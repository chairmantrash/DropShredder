/** Shared limits for explicit public-data requests. Never follows redirects or sends credentials. */
export async function fetchBoundedJson(url:string,signal:AbortSignal,maxBytes=800_000,request:typeof fetch=globalThis.fetch):Promise<unknown>{
  signal.throwIfAborted();
  const response=await request(url,{signal,credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',cache:'no-store',headers:{accept:'application/json'}});
  if(!response.ok) throw new Error(`Public lookup failed: HTTP ${response.status}`);
  if(Number(response.headers.get('content-length')??0)>maxBytes) throw new Error('Public response exceeded the size limit.');
  if(!response.headers.get('content-type')?.toLowerCase().includes('json') || !response.body) throw new Error('Public service did not return readable JSON.');
  const reader=response.body.getReader(),decoder=new TextDecoder();let body='',bytes=0;
  try{while(true){signal.throwIfAborted();const {done,value}=await reader.read();if(done) break;
    bytes+=value.byteLength;if(bytes>maxBytes) throw new Error('Public response exceeded the size limit.');
    body+=decoder.decode(value,{stream:true});}body+=decoder.decode();
  }finally{void reader.cancel().catch(()=>{});}
  signal.throwIfAborted();return JSON.parse(body);
}
