import { publicEvidenceUrl } from '../security/public-url';
export const BRAVE_ORIGIN='https://api.search.brave.com/*';
export interface SupplierSearchResult {title:string;url:string;description:string}
/** Only a user-entered query leaves the panel after an explicit button click. */
export function boundedBraveQuery(value:string):string{
  const query=value.normalize('NFKC').trim();
  if(query.length<3||query.length>180||/[\u0000-\u001f\u007f]/.test(query)) throw new Error('Enter a supplier or product query between 3 and 180 characters.');
  return query;
}
export function parseSupplierSearchResults(value:unknown):SupplierSearchResult[]{
  if(!value || typeof value!=='object' || Array.isArray(value))return [];
  const web=(value as Record<string,unknown>).web;
  if(!web || typeof web!=='object'||Array.isArray(web))return [];
  const data=(web as Record<string,unknown>).results;
  if(!Array.isArray(data))return [];
  return data.slice(0,10).flatMap(row=>{
    if(!row||typeof row!=='object'||Array.isArray(row))return [];
    const r=row as Record<string,unknown>,url=publicEvidenceUrl(r.url);
    if(!url || typeof r.title!=='string')return [];
    return [{url,title:r.title.slice(0,200),description:typeof r.description==='string'?r.description.slice(0,500):''}];
  });
}
export async function supplierSearchWithKey(
  query:string,key:string,signal:AbortSignal,
  request:typeof fetch=globalThis.fetch,
):Promise<SupplierSearchResult[]>{
  const q=boundedBraveQuery(query);
  if(!key||key.length>256||/[\r\n\u0000-\u001f]/.test(key))throw new Error('Enter a valid API key.');
  signal.throwIfAborted();
  const url='https://api.search.brave.com/res/v1/web/search?'+new URLSearchParams({q,count:'10',safesearch:'moderate'});
  const response=await request(url,{credentials:'omit',redirect:'error',cache:'no-store',referrerPolicy:'no-referrer',
    signal:AbortSignal.any([signal,AbortSignal.timeout(10000)]),headers:{'Accept':'application/json','X-Subscription-Token':key}});
  if(!response.ok)throw new Error('Brave Search request failed (HTTP '+response.status+'). Verify your key and plan.');
  if(Number(response.headers.get('content-length')??0)>200000)throw new Error('Provider response exceeds 200 KB.');
  if(!response.headers.get('content-type')?.toLowerCase().includes('json')||!response.body)throw new Error('Provider returned unsupported content.');
  const reader=response.body.getReader(),decoder=new TextDecoder();let bytes=0,body='';
  try{
    while(true){signal.throwIfAborted();const {done,value}=await reader.read();if(done)break;
      bytes+=value.byteLength;if(bytes>200000)throw new Error('Provider response exceeds 200 KB.');
      body+=decoder.decode(value,{stream:true});
    }
    body+=decoder.decode();
  }finally{void reader.cancel().catch(()=>{});}
  signal.throwIfAborted();
  return parseSupplierSearchResults(JSON.parse(body));
}
