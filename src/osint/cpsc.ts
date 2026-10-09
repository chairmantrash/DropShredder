import { normalizeGtin } from '../analysis/product-identity';
import { publicEvidenceUrl } from '../security/public-url';
export const CPSC_ORIGIN='https://www.saferproducts.gov/*';
export type RecallField='RecallTitle'|'ProductName'|'UPC';
export interface RecallCandidate {id:string;number:string;title:string;url:string;date?:string;modelMentioned:boolean}
export interface RecallLookup {candidates:RecallCandidate[];retrievedAt:string;inspected:number;truncated:boolean}
export function recallQueryUrl(query:string,field:RecallField='RecallTitle'):string {
  const text=query.normalize('NFKC').trim();
  if(!['RecallTitle','ProductName','UPC'].includes(field) || text.length<2 || text.length>100 || !/[\p{L}\p{N}]/u.test(text) || /[@\r\n]|https?:\/\//i.test(text))
    throw new Error('Use a brand, product name or barcode between 2 and 100 characters.');
  if(field==='UPC' && !normalizeGtin(text)) throw new Error('The barcode format/check digit is invalid.');
  const url=new URL('https://www.saferproducts.gov/RestWebServices/Recall');
  url.searchParams.set('format','json');url.searchParams.set(field,field==='UPC'?text.replace(/[\s-]+/g,''):text);
  return url.href;
}
const record=(v:unknown)=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:undefined;
const text=(v:unknown,max:number)=>typeof v==='string'?v.slice(0,max):'';
export function parseRecallCandidates(data:unknown,model?:string):Omit<RecallLookup,'retrievedAt'> {
  if(!Array.isArray(data)) throw new Error('The recall service returned an unsupported response.');
  const out:RecallCandidate[]=[],seen=new Set<string>();
  const modelToken=model?.trim().toLowerCase();
  for(const item of data.slice(0,200)){
    const r=record(item);if(!r) continue;
    const url=publicEvidenceUrl(r.URL),title=text(r.Title,500),id=String(r.RecallID??'').slice(0,40);
    if(!url || !/^https:\/\/(?:www\.)?cpsc\.gov\/Recalls\//i.test(url) || !title || !/^[0-9]+$/.test(id) || seen.has(id)) continue;
    seen.add(id);
    const products=Array.isArray(r.Products)?r.Products.slice(0,20).map(p=>record(p)):[];
    const subject=[title,text(r.Description,8000),...products.map(p=>text(p?.Model,500))].join(' ');
    const modelMentioned=Boolean(modelToken && subject.toLowerCase().split(/[^a-z0-9_-]+/).includes(modelToken));
    const date=text(r.RecallDate,30);
    out.push({id,number:text(r.RecallNumber,40),title,url,date:Number.isFinite(Date.parse(date))?date.slice(0,10):undefined,modelMentioned});
  }
  out.sort((a,b)=>Number(b.modelMentioned)-Number(a.modelMentioned)||(b.date??'').localeCompare(a.date??''));
  return {candidates:out.slice(0,12),inspected:Math.min(data.length,200),truncated:data.length>200||out.length>12};
}
export interface RecallDependencies {requestPermission:()=>Promise<boolean>;fetch:typeof fetch;hasPermission?:()=>Promise<boolean>}
/** User-triggered only; zero caching, credentials, scoring or follow-up requests. */
export async function lookupRecallCandidates(query:string,field:RecallField,model:string|undefined,signal:AbortSignal,
  deps:RecallDependencies={requestPermission:()=>chrome.permissions.request({origins:[CPSC_ORIGIN]}),fetch:(input,init)=>globalThis.fetch(input,init),hasPermission:()=>chrome.permissions.contains({origins:[CPSC_ORIGIN]})}):Promise<RecallLookup|undefined> {
  const url=recallQueryUrl(query,field);
  signal.throwIfAborted();
  // Request Chrome access in the direct click chain, before the first await.
  const granted=await deps.requestPermission();
  signal.throwIfAborted();if(!granted) return undefined;
  const combined=AbortSignal.any([signal,AbortSignal.timeout(8000)]);
  const response=await deps.fetch(url,{credentials:'omit',cache:'no-store',redirect:'error',referrerPolicy:'no-referrer',signal:combined,
    headers:{accept:'application/json'}});
  if(!response.ok) throw new Error(`Recall lookup failed: HTTP ${response.status}`);
  if(Number(response.headers.get('content-length')??0)>2_000_000) throw new Error('Recall response exceeded the 2 MB limit.');
  if(!response.headers.get('content-type')?.toLowerCase().includes('json') || !response.body) throw new Error('Recall service did not return readable JSON.');
  const reader=response.body.getReader(),decoder=new TextDecoder();let body='',bytes=0;
  try{while(true){combined.throwIfAborted();const {done,value}=await reader.read();if(done) break;
    bytes+=value.byteLength;if(bytes>2_000_000) throw new Error('Recall response exceeded the 2 MB limit.');
    body+=decoder.decode(value,{stream:true});}body+=decoder.decode();
  }finally{void reader.cancel().catch(()=>{});}
  combined.throwIfAborted();
  if(deps.hasPermission&&!await deps.hasPermission()) return undefined;
  combined.throwIfAborted();
  return {...parseRecallCandidates(JSON.parse(body),model),retrievedAt:new Date().toISOString()};
}
