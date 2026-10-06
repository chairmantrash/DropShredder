import fs from 'node:fs';
import path from 'node:path';

const failures=[];
const main=fs.readFileSync('entrypoints/sidepanel/main.ts','utf8');
const bg=fs.readFileSync('entrypoints/background.ts','utf8');
const history=fs.readFileSync('src/storage/history.ts','utf8');

const requiredPatterns=[
  ['page text cap',/slice\(0,120000\)/],
  ['visible review cap',/\.slice\(0,80\)/],
  ['catalog card cap',/\.slice\(0,200\)/],
  ['Amazon search card cap',/\.slice\(0,160\)/],
  ['image DOM cap',/document\.images\]\.slice\(0,200\)/],
  ['script DOM cap',/document\.scripts\]\.slice\(0,300\)/],
  ['same-site page cap',/links\.slice\(0,4\)/],
  ['side-panel tab cap',/maxTabs=8/],
];
for(const [name,pattern] of requiredPatterns){
  if(!pattern.test(main)) failures.push(`entrypoints/sidepanel/main.ts: missing ${name}`);
}
if(!/maxTabs=8/.test(bg)) failures.push('entrypoints/background.ts: missing context-menu tab cap');
if(/\.getAll\s*\(/.test(history)) failures.push('src/storage/history.ts: unbounded IndexedDB getAll() is forbidden');
if(!/MAX_TOTAL_OBSERVATIONS=2000/.test(history)) failures.push('src/storage/history.ts: missing total observation retention cap');
if(!/MAX_IDENTITY_OBSERVATIONS=120/.test(history)) failures.push('src/storage/history.ts: missing per-identity retention cap');
if(!/openCursor\([^)]*['"]prev['"]/.test(history)) failures.push('src/storage/history.ts: expected bounded reverse cursor reads');

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
  const maxTotal=8*1024*1024;
  const maxSingle=2*1024*1024;
  if(total>maxTotal) failures.push(`built extension too large: ${(total/1024/1024).toFixed(2)} MiB > 8 MiB budget`);
  if(largest.size>maxSingle) failures.push(`single built asset too large: ${largest.path} ${(largest.size/1024/1024).toFixed(2)} MiB > 2 MiB budget`);
  console.log(`Built size: ${(total/1024/1024).toFixed(2)} MiB; largest asset: ${largest.path} ${(largest.size/1024).toFixed(1)} KiB`);
}

if(failures.length){
  console.error('DropShredder performance audit failed:\n'+failures.map(x=>' - '+x).join('\n'));
  process.exit(1);
}
console.log('DropShredder performance audit passed.');
