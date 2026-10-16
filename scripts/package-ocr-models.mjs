import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';

// Build-time data acquisition only: pinned immutable sources, bounded input,
// verified bytes, retained license; no model or executable download at runtime.
const root=path.resolve(import.meta.dirname,'..');
const models=JSON.parse(await fs.readFile(path.join(root,'intelligence/ocr-models.json'),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const records=[];
for(const model of models){
 const url=new URL(model.sourceUrl);
 if(url.origin!=='https://raw.githubusercontent.com'||url.pathname!=='/tesseract-ocr/tessdata_fast/'+model.upstreamCommit+'/'+model.language+'.traineddata'
   ||model.upstreamCommit!=='87416418657359cb625c412a48b6e1d6d41c29bd'
   ||!['chi_sim','hin','spa','ara','fra','ben','por'].includes(model.language))throw Error('Unapproved OCR source');
 const target=path.join(root,'public/ocr',model.language+'.traineddata.gz');
 let raw,packed;
 try{
  packed=await fs.readFile(target);
  raw=gunzipSync(packed,{maxOutputLength:12_000_000});
  if(raw.length!==model.originalBytes||hash(raw)!==model.originalSha256)throw Error('Cached model differs from pinned source');
 }catch{
  const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(30_000)});
  if(!response.ok||!response.body)throw Error('Pinned OCR source unavailable: '+model.language+' '+response.status);
  const length=Number(response.headers.get('content-length')||0);
  if(length>12_000_000)throw Error('Oversized OCR source');
  const reader=response.body.getReader(),chunks=[];let bytes=0;
  try{
   for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>12_000_000)throw Error('Oversized OCR stream');chunks.push(value);}
  }finally{await reader.cancel().catch(()=>{});}
  raw=Buffer.concat(chunks);
  if(raw.length!==model.originalBytes||hash(raw)!==model.originalSha256)throw Error('Pinned OCR hash mismatch: '+model.language);
  packed=gzipSync(raw,{level:9,mtime:0});
  await fs.mkdir(path.dirname(target),{recursive:true});
  await fs.writeFile(target,packed);
 }
 // Environment versions belong in the build log, not the hashed runtime inventory.
 // The compressed and original bytes remain independently pinned below.
 records.push({...model,packagedBytes:packed.length,packagedSha256:hash(packed),transform:'lossless deterministic gzip, mtime=0; no model edits'});
 console.log('Verified packaged OCR data: '+model.language+' '+packed.length+' bytes');
}
await fs.writeFile(path.join(root,'public/ocr/LANGUAGE-MODELS.json'),JSON.stringify(records,null,2)+'\n');
console.log('OCR packaging environment: Node '+process.versions.node+' / zlib '+process.versions.zlib);
