/** Development-only anonymous curl transport. This does not simulate Chrome permission or execute merchant JS. */
import fs from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {comparisonUrl,fetchPublicProduct} from '../../../src/osint/public-product-comparison';
const exec=promisify(execFile),root=process.cwd(),out=path.join(root,'workplane/runs/DS-062');
const captures=path.resolve(process.env.DS62_CAPTURES??'comparison62-captures');fs.mkdirSync(captures,{recursive:true});
const manifest=JSON.parse(fs.readFileSync(path.join(out,'frozen100.json'),'utf8'));
const rows:unknown[]=[];let cursor=0;
async function capture(target:any){
 const row:any={...target,startedAt:new Date().toISOString(),scope:'Public JSON-LD acquisition only; no merchant truth or native Chrome acceptance'};
 const url=comparisonUrl(target.url);
 if(!url){row.status='URL_REFUSED';return row;}
 const body=path.join(captures,target.id+'.html'),headers=path.join(captures,target.id+'.headers');
 const request=(async(u:string,options:RequestInit)=>{
  if(u!==url||options.credentials!=='omit'||options.redirect!=='error')throw Error('Unexpected transport request');
  const {stdout}=await exec('curl',['--proto','=https','--max-redirs','0','--connect-timeout','6','--max-time','16','--max-filesize','1000000','-sS','-H','Accept: text/html','-H','Cookie:','-H','Referer:','-D',headers,'-o',body,'-w','%{http_code}',url],{signal:options.signal??undefined,timeout:18000,maxBuffer:100_000});
  const bytes=fs.readFileSync(body),rawHeaders=fs.readFileSync(headers,'utf8');
  row.httpStatus=Number(stdout);row.bytes=bytes.length;row.sha256=createHash('sha256').update(bytes).digest('hex');
  const contentType=[...rawHeaders.matchAll(/^content-type:\s*(.+)$/gim)].at(-1)?.[1]?.trim()??'';
  return new Response(bytes,{status:Number(stdout),headers:{'content-type':contentType}});
 }) as typeof fetch;
 try{row.product=await fetchPublicProduct(url,AbortSignal.timeout(18000),request);row.status='PRODUCT_BOUND';}
 catch(e){row.status='UNAVAILABLE_OR_UNRESOLVED';row.error=String(e).slice(0,350);}
 row.finishedAt=new Date().toISOString();return row;
}
await Promise.all(Array.from({length:6},async()=>{while(cursor<manifest.targets.length){const target=manifest.targets[cursor++];rows.push(await capture(target));
 fs.writeFileSync(path.join(out,'public100-results.json'),JSON.stringify({manifestSha256:createHash('sha256').update(fs.readFileSync(path.join(out,'frozen100.json'))).digest('hex'),scope:'Development acquisition coverage, not independent detection accuracy',outcomes:[...rows].sort((a:any,b:any)=>a.id.localeCompare(b.id))},null,2)+'\n');
 if(rows.length%10===0)console.log(JSON.stringify({completed:rows.length,bound:rows.filter((r:any)=>r.status==='PRODUCT_BOUND').length}));
}}));
