import fs from 'node:fs';
import path from 'node:path';

const failures=[];
const main=fs.readFileSync('entrypoints/sidepanel/main.ts','utf8');
const bg=fs.readFileSync('entrypoints/background.ts','utf8');
const history=fs.readFileSync('src/storage/history.ts','utf8');
const rdap=fs.readFileSync('src/osint/rdap.ts','utf8');
const images=fs.readFileSync('src/forensics/image-acquisition.ts','utf8');
const renderer=fs.readFileSync('src/ui/report-renderer.ts','utf8');
const scanner=fs.readFileSync('src/extraction/page-scan.ts','utf8');

const requiredMain=[
  ['same-site page cap',/links\.slice\(0,4\)/],
  ['search tab cap',/maxTabs=8/],
  ['same-site timeout',/AbortSignal\.timeout\(3500\)/],
];
const requiredScanner=[
  ['central scan budget',/const LIMITS=\{images:160,scripts:220,pageText:100_000,cards:160,amazonCards:120,reviews:60,htmlSignature:60_000\}/],
  ['page text cap',/slice\(0,LIMITS\.pageText\)/],
  ['visible review work cap',/reviewElements\.length<LIMITS\.reviews/],
  ['Amazon result work cap',/amazonElements\.length<LIMITS\.amazonCards/],
  ['bounded element traversal',/visitedElements<MAX_ELEMENTS/],
  ['bounded text-node traversal',/visitedTextNodes<MAX_TEXT_NODES/],
  ['bounded structured-data input',/input\.length>MAX_JSON_BYTES/],
  ['image DOM cap',/Math\.min\(document\.images\.length,LIMITS\.images\)/],
  ['script DOM cap',/Math\.min\(document\.scripts\.length,LIMITS\.scripts\)/],
];
const renderMatch=main.match(/function renderReport\([^)]*\): void \{([\s\S]*?)\n\}\n\nasync function scanActivePage/);
if(!renderMatch) failures.push('sidepanel: renderReport boundary missing');
else if(renderMatch[1].length>700) failures.push('sidepanel: report rendering grew back into the entrypoint');
if(!/renderShopperReport/.test(main)) failures.push('sidepanel: extracted report renderer is not used');
if(!/export function renderShopperReport/.test(renderer)) failures.push('report renderer: canonical renderer export missing');

for(const [name,pattern] of requiredMain){
  if(!pattern.test(main)) failures.push(`sidepanel: missing ${name}`);
}
for(const [name,pattern] of requiredScanner){
  if(!pattern.test(scanner)) failures.push(`page scanner: missing ${name}`);
}
if(/document\.body\?\.innerText|document\.head\?\.innerHTML/.test(scanner)) failures.push('scanner: output slice is not a bound on DOM traversal or serialization');
if(!/maxTabs=8/.test(bg)) failures.push('background: missing context-menu search-tab cap');
if(/\.getAll\s*\(/.test(history)) failures.push('history: unbounded IndexedDB getAll() is forbidden');
if(!/MAX_OBSERVATIONS=2000/.test(history)) failures.push('history: 2,000-record cap missing');
if(!/MAX_IDENTITY_OBSERVATIONS=120/.test(history)) failures.push('history: per-product 120-record cap missing');
if(!/MAX_AGE_MS=180\*24\*60\*60\*1000/.test(history)) failures.push('history: 180-day retention cap missing');
if(!/openCursor\([^;]*['"]prev['"]/.test(history)) failures.push('history: bounded reverse-cursor reads missing');
if(!/AbortSignal\.timeout\(5000\)/.test(rdap)) failures.push('RDAP timeout missing');
if(!/AbortSignal\.timeout\(8000\)/.test(images)) failures.push('image timeout missing');
if(!/MAX_IMAGE_BYTES=15_000_000/.test(images)) failures.push('image byte limit missing');
if(!/HASH_SAMPLE_MAX=128/.test(images)) failures.push('image downsample limit missing');

const output='.output/chrome-mv3';
if(fs.existsSync(output)){
  const stack=[output];
  let total=0;
  let largest={path:'',size:0};
  while(stack.length){
    const current=stack.pop();
    for(const entry of fs.readdirSync(current,{withFileTypes:true})){
      const full=path.join(current,entry.name);
      if(entry.isDirectory()) stack.push(full);
      else{
        const size=fs.statSync(full).size;
        total+=size;
        if(size>largest.size) largest={path:full,size};
      }
    }
  }
  const maxTotal=60*1024*1024;
  const maxSingle=12*1024*1024;
  if(total>maxTotal) failures.push(`built extension too large: ${(total/1024/1024).toFixed(2)} MiB > 60 MiB`);
  if(largest.size>maxSingle) failures.push(`single built asset too large: ${largest.path} > 12 MiB`);
  console.log(`Built size ${(total/1024/1024).toFixed(2)} MiB; largest asset ${largest.path} ${(largest.size/1024).toFixed(1)} KiB`);
}

if(failures.length){
  console.error('DropShredder performance audit failed:\n'+failures.map(item=>' - '+item).join('\n'));
  process.exit(1);
}
console.log('Performance audit passed.');
