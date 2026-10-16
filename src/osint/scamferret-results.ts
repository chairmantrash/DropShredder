import index from '../../intelligence/scamferret-result-index.json';
import {fetchBoundedJson} from './bounded-json';
import {lookupDomain,type OutsideResult} from '../reputation/outside-results';
import {redactEvidenceText} from '../security/public-url';

export const SCAMFERRET_RESULT_ORIGIN='https://raw.githubusercontent.com/*';
const object=(v:unknown):Record<string,unknown>|undefined=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:undefined;
export function publishedScamferretPaths(domain:string):string[]{
  domain=lookupDomain(domain);
  return index.records.filter(r=>r.host===domain).slice(0,2).map(r=>r.path);
}
export function parsePublishedScamferret(input:unknown,domain:string,path:string,now=new Date()):OutsideResult|undefined{
  domain=lookupDomain(domain);const record=object(input);if(!record)return undefined;
  try{if(lookupDomain(new URL(String(record.target_url)).hostname)!==domain)return undefined;}catch{return undefined;}
  // Upstream timestamps have no zone; retain calendar date, not invented time precision.
  const date=String(record.start_time).match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  const reported=Date.parse(date??'');
  if(!Number.isFinite(reported)||reported>now.getTime()||!publishedScamferretPaths(domain).includes(path))return undefined;
  const response=object(record.llm_response);let output:unknown=response?.output??record.llm_response;
  if(typeof output==='string'){
    const text=output.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
    try{output=JSON.parse(text);}catch{output=undefined;}
  }
  const classification=object(output),scam=classification?.scam;
  return {provider:'ScamFerret research',domain,reportedAt:date!,retrievedAt:now.toISOString(),
    outcome:scam===true?'reported-concern':scam===false?'no-listed-concern':'unclassified',scope:'historical-opinion',
    stale:now.getTime()-reported>90*86400000,recordId:path.split('/').at(-1)!.slice(0,150),
    reason:typeof classification?.reason==='string'?redactEvidenceText(classification.reason,1600):'The published response was not valid machine-readable classification data.'};
}
/** Fetch original, pinned published output, not folder labels. Never invokes a model or submits a site. */
export async function lookupPublishedScamferret(domain:string,signal:AbortSignal,request:typeof fetch=globalThis.fetch,now=new Date()):Promise<OutsideResult[]>{
  domain=lookupDomain(domain);const rows:OutsideResult[]=[];
  for(const path of publishedScamferretPaths(domain)){
    if(!/^expanded_evaluation\/gpt-4\.1_results\/(?:scam_websites|legitimate_websites)\/online_shopping_[a-z]+\/[a-zA-Z0-9._-]+\.json$/.test(path))throw Error('Unrecognized published result reference.');
    // Raw GitHub serves original JSON as text/plain. Keep JSON parsing and all bounds.
    const data=await fetchBoundedJson('https://raw.githubusercontent.com/ScamFerret/artifact/'+index.commit+'/'+path,signal,150_000,request,true);
    const row=parsePublishedScamferret(data,domain,path,now);if(row)rows.push(row);
  }
  return rows;
}
