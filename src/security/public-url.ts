/** Safe public evidence destinations. Queries/fragments and embedded credentials never leave via links/exports. */
export function publicEvidenceUrl(value:unknown):string|undefined {
  if(typeof value!=='string' || value.length>4096) return undefined;
  try{
    const url=new URL(value);
    if(url.protocol!=='https:' || url.username || url.password || url.port) return undefined;
    const host=url.hostname.toLowerCase();
    if(!host.includes('.') || host.endsWith('.local') || host.endsWith('.localhost') || host.endsWith('.internal') ||
      host.endsWith('.test') || host.endsWith('.invalid') || /^[\d.]+$/.test(host) || host.includes(':')) return undefined;
    url.search='';url.hash='';return url.href;
  }catch{return undefined;}
}
export function redactEvidenceText(value:unknown,max=2000):string {
  if(typeof value!=='string') return '';
  return value.slice(0,max).replace(/https?:\/\/[^\s<>"']+/gi,url=>publicEvidenceUrl(url)??'[link omitted]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,'[email omitted]')
    .replace(/\b(?:access_token|api_key|authorization|password|token|session)=([^\s&]+)/gi,'[redacted]');
}
