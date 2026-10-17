/** Exact captured-source diagnostic replay, deliberately separate from Chrome acceptance. */
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';import {parseHTML} from 'linkedom';
const [sourceRoot,sourceDirectory,output]=process.argv.slice(2);
if(!sourceRoot||!sourceDirectory||!output)throw Error('Usage: replay.mts SOURCE_ROOT HTML_DIRECTORY OUTPUT');
const load=(file:string)=>import(pathToFileURL(path.join(sourceRoot,file)).href);
const {extractPageScan}=await load('src/extraction/page-scan.ts'),{COMMERCE_LANGUAGE_KIT}=await load('src/languages/commerce-kit.ts'),{runPassiveRules}=await load('src/analysis/passive-rules.ts'),{warningSignalCount}=await load('src/analysis/evidence-engine.ts');
const receiptsInput=fs.readFileSync(path.join(sourceDirectory,'source-receipts.json'),'utf8'),receipts=JSON.parse(receiptsInput),records=[];
for(const receipt of receipts){
 if(receipt.status!==200){records.push({id:receipt.id,status:'SOURCE_UNAVAILABLE',sourceStatus:receipt.status});continue;}
 const bytes=fs.readFileSync(path.join(sourceDirectory,receipt.id+'.html'));const sha256=createHash('sha256').update(bytes).digest('hex');
 if(sha256!==receipt.sha256){records.push({id:receipt.id,status:'SOURCE_HASH_MISMATCH_QUARANTINED',expectedSha256:receipt.sha256,actualSha256:sha256});continue;}
 const {document,window}=parseHTML(bytes.toString('utf8'));
 for(const [key,selector] of [['scripts','script'],['images','img']] as const){const nodes=[...document.querySelectorAll(selector)];Object.defineProperty(document,key,{value:{length:nodes.length,item:(i:number)=>nodes[i]}});}
 const g=globalThis as unknown as Record<string,unknown>,v={document,window,location:new URL(receipt.responseUrl),NodeFilter:{SHOW_TEXT:4,SHOW_ELEMENT:1},HTMLElement:window.HTMLElement},old=Object.fromEntries(Object.keys(v).map(k=>[k,g[k]]));Object.assign(g,v);
 try{const scan=extractPageScan(COMMERCE_LANGUAGE_KIT),evidence=runPassiveRules(scan.product,scan.pageText);records.push({id:receipt.id,host:receipt.host,sourceSha256:sha256,status:'DETACHED_SOURCE_ONLY',structuredIdentity:scan.product.extraction?.structuredIdentityResolved,offerResolved:scan.product.extraction?.offerResolved,reviewCount:scan.reviews.length,verificationKnown:scan.reviews.filter((r:any)=>r.verified!==undefined).length,reviewBodyHashes:scan.reviews.map((r:any)=>createHash('sha256').update(r.body).digest('hex')),dispatch:evidence.find((e:any)=>e.id==='SUPPLIER_DIRECT_DISPATCH_DISCLOSED')?.observedValue,warningCount:warningSignalCount(evidence),signalIds:evidence.map((e:any)=>e.id),pageTextHash:createHash('sha256').update(scan.pageText).digest('hex')});}
 catch(error){records.push({id:receipt.id,status:'EXTRACTION_ERROR',error:String(error)});}
 finally{for(const key of Object.keys(v))if(old[key]===undefined)delete g[key];else g[key]=old[key];}
}
const outputData={scope:'Detached anonymous source diagnosis, no rendered CSS/script execution/native or independent accuracy inferred',receiptsSha256:createHash('sha256').update(receiptsInput).digest('hex'),records};
fs.writeFileSync(output,JSON.stringify(outputData,null,2)+'\n');console.log(JSON.stringify({total:records.length,extracted:records.filter(r=>r.status==='DETACHED_SOURCE_ONLY').length,errors:records.filter(r=>r.status==='EXTRACTION_ERROR').length,reviews:records.reduce((n,r)=>n+(r.reviewCount??0),0),dispatch:records.filter(r=>r.dispatch).length}));
