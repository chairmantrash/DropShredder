export interface RdapDomainObservation {
  domain:string;
  registeredAt?:string;
  updatedAt?:string;
  expiresAt?:string;
  registrar?:string;
  nameservers:string[];
  statuses:string[];
  source:string;
  retrievedAt:string;
}

type RdapEvent={eventAction?:string;eventDate?:string};
type RdapEntity={roles?:string[];vcardArray?:unknown[]};
type RdapResponse={
  events?:RdapEvent[];
  entities?:RdapEntity[];
  nameservers?:Array<{ldhName?:string}>;
  status?:string[];
};

function eventDate(events:RdapEvent[]|undefined,action:string):string|undefined {
  return events?.find(e=>e.eventAction===action)?.eventDate;
}

function registrarName(entities:RdapEntity[]|undefined):string|undefined {
  const registrar=entities?.find(entity=>entity.roles?.includes('registrar'));
  const vcard=registrar?.vcardArray;
  if(!Array.isArray(vcard) || !Array.isArray(vcard[1])) return undefined;
  for(const row of vcard[1] as unknown[]){
    if(Array.isArray(row) && row[0]==='fn' && typeof row[3]==='string') return row[3];
  }
  return undefined;
}

function normalizeDomain(input:string):string {
  const candidate=input.trim().toLowerCase().replace(/^https?:\/\//,'').split('/')[0] ?? '';
  return candidate.replace(/^www\./,'');
}

async function ensureRdapPermission():Promise<boolean> {
  const origin='https://rdap.org/*';
  if(await chrome.permissions.contains({origins:[origin]})) return true;
  return chrome.permissions.request({origins:[origin]});
}

const CACHE_MS=6*60*60*1000;

export async function lookupDomainRdap(input:string):Promise<RdapDomainObservation|undefined> {
  const domain=normalizeDomain(input);
  if(!domain || !domain.includes('.')) return undefined;
  const cacheKey=`rdap:${domain}`;
  try{
    const cached=(await chrome.storage.session.get(cacheKey))[cacheKey] as {at:number;value:RdapDomainObservation}|undefined;
    if(cached && Date.now()-cached.at<CACHE_MS) return cached.value;
  }catch{}
  if(!(await ensureRdapPermission())) return undefined;

  const url=`https://rdap.org/domain/${encodeURIComponent(domain)}`;
  const response=await fetch(url,{
    headers:{accept:'application/rdap+json, application/json'},
    signal:AbortSignal.timeout(5000),
  });
  if(!response.ok) throw new Error(`RDAP lookup failed: HTTP ${response.status}`);
  const length=Number(response.headers.get('content-length') || 0);
  if(length>2_000_000) throw new Error('RDAP response exceeded the safety limit.');
  const data=await response.json() as RdapResponse;

  const value:RdapDomainObservation={
    domain,
    registeredAt:eventDate(data.events,'registration'),
    updatedAt:eventDate(data.events,'last changed') ?? eventDate(data.events,'last update of RDAP database'),
    expiresAt:eventDate(data.events,'expiration'),
    registrar:registrarName(data.entities),
    nameservers:(data.nameservers ?? []).map(n=>n.ldhName).filter((v):v is string=>Boolean(v)),
    statuses:data.status ?? [],
    source:url,
    retrievedAt:new Date().toISOString(),
  };
  try{await chrome.storage.session.set({[cacheKey]:{at:Date.now(),value}});}catch{}
  return value;
}
