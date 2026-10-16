import {fetchBoundedJson} from './bounded-json';
import {lookupDomain,type OutsideResult} from '../reputation/outside-results';

export const URLSCAN_ORIGIN='https://urlscan.io/*';
const object=(v:unknown):Record<string,unknown>|undefined=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:undefined;
const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
function matches(value:unknown,domain:string):boolean{
  try{const u=new URL(String(value));return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password&&lookupDomain(u.hostname)===domain;}catch{return false;}
}
export function urlscanCandidates(input:unknown,domain:string,now=new Date()):string[]{
  domain=lookupDomain(domain);const root=object(input);if(!root||!Array.isArray(root.results))throw Error('Outside service returned an invalid result.');
  const ids:string[]=[];
  for(const value of root.results.slice(0,8)){
    const row=object(value),task=object(row?.task),page=object(row?.page);
    const id=task?.uuid,at=Date.parse(String(task?.time)),age=now.getTime()-at;
    if(typeof id==='string'&&uuid.test(id)&&Number.isFinite(at)&&age>=0&&age<=90*86400000&&matches(page?.url,domain)&&matches(task?.url,domain)&&!ids.includes(id))ids.push(id);
    if(ids.length===2)break;
  }
  return ids;
}
export function parseUrlscanResult(input:unknown,domain:string,id:string,now=new Date()):OutsideResult|undefined{
  domain=lookupDomain(domain);const root=object(input),task=object(root?.task),page=object(root?.page);
  const stats=object(root?.stats),verdicts=object(root?.verdicts),v=object(verdicts?.urlscan);
  const at=Date.parse(String(task?.time)),age=now.getTime()-at;
  if(!uuid.test(id)||task?.uuid!==id||!matches(task?.url,domain)||!matches(page?.url,domain)||!Number.isFinite(at)||age<0||age>90*86400000||
    typeof stats?.dataLength!=='number'||stats.dataLength<=0)return undefined;
  const result:OutsideResult={provider:'urlscan',domain,recordId:id,reportedAt:new Date(at).toISOString(),retrievedAt:now.toISOString(),scope:'security',stale:false,
    outcome:v?.malicious===true?'reported-concern':v?.malicious===false?'no-listed-concern':'unclassified',
    reason:v?.malicious===true?'The provider reported a security concern for this archived page. This does not establish non-delivery, dropshipping or the current product’s status.':
      v?.malicious===false?'This archived scan has no listed provider security concern. It is not a merchant-trust or product-safety clearance.':'The archived page has no usable provider security verdict.'};
  return result;
}
/** Read existing public reports only. No URL submission, credentials, key or background sweep. */
export async function lookupUrlscan(domain:string,signal:AbortSignal,request:typeof fetch=globalThis.fetch,now=new Date()):Promise<OutsideResult[]>{
  domain=lookupDomain(domain);const q=`page.domain:("${domain}" OR "www.${domain}") AND date:>now-90d`;
  const search=await fetchBoundedJson('https://urlscan.io/api/v1/search/?q='+encodeURIComponent(q)+'&size=5',signal,250_000,request);
  const results:OutsideResult[]=[];
  for(const id of urlscanCandidates(search,domain,now)){
    signal.throwIfAborted();const data=await fetchBoundedJson('https://urlscan.io/api/v1/result/'+id+'/',signal,800_000,request);
    const result=parseUrlscanResult(data,domain,id,now);if(result)results.push(result);
  }
  return results;
}
