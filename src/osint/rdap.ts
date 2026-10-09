import { parse } from 'tldts';
import bootstrap from '../../intelligence/rdap-bootstrap.json';

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
  ldhName?:string;
  events?:RdapEvent[];
  entities?:RdapEntity[];
  nameservers?:Array<{ldhName?:string}>;
  status?:string[];
};

function eventDate(events:RdapEvent[]|undefined,action:string):string|undefined {
  const date=Array.isArray(events)?events.find(e=>e?.eventAction===action)?.eventDate:undefined;
  return typeof date==='string' && Number.isFinite(Date.parse(date))?date:undefined;
}

function registrarName(entities:RdapEntity[]|undefined):string|undefined {
  const registrar=Array.isArray(entities)?entities.find(entity=>Array.isArray(entity?.roles) && entity.roles.includes('registrar')):undefined;
  const vcard=registrar?.vcardArray;
  if(!Array.isArray(vcard) || !Array.isArray(vcard[1])) return undefined;
  for(const row of vcard[1] as unknown[]){
    if(Array.isArray(row) && row[0]==='fn' && typeof row[3]==='string') return row[3];
  }
  return undefined;
}

export function registeredDomain(input:string):string|undefined {
  if(input.length>2048) return undefined;
  try{
    const url=new URL(input.includes('://')?input:`https://${input}`);
    if(url.protocol!=='https:' || url.username || url.password || url.port) return undefined;
    const result=parse(url.hostname,{allowPrivateDomains:false});
    return result.isIcann && result.domain && !result.isIp?result.domain:undefined;
  }catch{return undefined;}
}

export function rdapEndpoint(domain:string):string|undefined {
  const tld=domain.split('.').at(-1);
  const service=bootstrap.services.find(([suffixes])=>suffixes?.includes(tld??''));
  const endpoint=service?.[1]?.find(url=>url.startsWith('https://'));
  if(!endpoint) return undefined;
  try{
    const url=new URL(endpoint);
    if(url.username || url.password || url.port || url.search || url.hash) return undefined;
    return `${url.href.replace(/\/$/,'')}/domain/${encodeURIComponent(domain)}`;
  }catch{return undefined;}
}

function ensureRdapPermission(origin:string):Promise<boolean> {
  // Called before the first await of the user-clicked RDAP action.
  return chrome.permissions.request({origins:[origin]});
}

const CACHE_MS=6*60*60*1000;

export async function lookupDomainRdap(input:string,signal:AbortSignal=new AbortController().signal):Promise<RdapDomainObservation|undefined> {
  signal.throwIfAborted();
  const domain=registeredDomain(input);
  if(!domain) return undefined;
  const url=rdapEndpoint(domain);
  if(!url) return undefined;
  const origin=`${new URL(url).origin}/*`;
  // Ask Chrome while the click still has user activation, before async cache reads.
  const permission=ensureRdapPermission(origin);
  if(!(await permission)) return undefined;
  signal.throwIfAborted();
  const cacheKey=`rdap:${domain}`;
  try{
    const cached=(await chrome.storage.session.get(cacheKey))[cacheKey] as {at:number;value:RdapDomainObservation}|undefined;
    if(cached && Number.isFinite(cached.at) && cached.at<=Date.now() && Date.now()-cached.at<CACHE_MS
      && cached.value?.domain===domain && cached.value.source===url
      && typeof cached.value.retrievedAt==='string' && Number.isFinite(Date.parse(cached.value.retrievedAt))
      && (cached.value.registeredAt===undefined || (typeof cached.value.registeredAt==='string' && Number.isFinite(Date.parse(cached.value.registeredAt))))
      && Array.isArray(cached.value.nameservers) && Array.isArray(cached.value.statuses)
      && await chrome.permissions.contains({origins:[origin]})) return cached.value;
  }catch{}
  const combined=AbortSignal.any([signal,AbortSignal.timeout(5000)]);
  const response=await fetch(url,{
    headers:{accept:'application/rdap+json, application/json'},
    signal:combined,
    credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',redirect:'error',
  });
  if(!response.ok) throw new Error(`RDAP lookup failed: HTTP ${response.status}`);
  const length=Number(response.headers.get('content-length') || 0);
  if(length>2_000_000) throw new Error('RDAP response exceeded the safety limit.');
  if(!response.body) throw new Error('RDAP response could not be read.');
  const reader=response.body.getReader();
  const decoder=new TextDecoder();
  let text='',size=0;
  try{
    while(true){
      combined.throwIfAborted();
      const {done,value}=await reader.read();
      if(done) break;
      size+=value.byteLength;
      if(size>2_000_000) throw new Error('RDAP response exceeded the safety limit.');
      text+=decoder.decode(value,{stream:true});
    }
    text+=decoder.decode();
  }finally{
    void reader.cancel().catch(()=>{});
  }
  const data=JSON.parse(text) as RdapResponse;
  combined.throwIfAborted();
  if(!data || typeof data!=='object' || data.ldhName?.toLowerCase()!==domain) throw new Error('RDAP record did not identify the requested registered domain.');
  if(!(await chrome.permissions.contains({origins:[origin]}))) return undefined;

  const value:RdapDomainObservation={
    domain,
    registeredAt:eventDate(Array.isArray(data.events)?data.events:undefined,'registration'),
    updatedAt:eventDate(data.events,'last changed') ?? eventDate(data.events,'last update of RDAP database'),
    expiresAt:eventDate(data.events,'expiration'),
    registrar:registrarName(data.entities),
    nameservers:(Array.isArray(data.nameservers)?data.nameservers:[]).slice(0,100).map(n=>n?.ldhName).filter((v):v is string=>typeof v==='string').map(v=>v.slice(0,253)),
    statuses:(Array.isArray(data.status)?data.status:[]).filter((v):v is string=>typeof v==='string').slice(0,50),
    source:url,
    retrievedAt:new Date().toISOString(),
  };
  try{await chrome.storage.session.set({[cacheKey]:{at:Date.now(),value}});}catch{}
  return value;
}
