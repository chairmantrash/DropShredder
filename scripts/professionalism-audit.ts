import fs from 'node:fs';
import path from 'node:path';

const errors:string[]=[];
const warnings:string[]=[];
const EXECUTABLE_EXTENSIONS=new Set(['.ts','.tsx','.js','.mjs','.cjs']);
const ROOTS=['src','entrypoints'];
const REVIEW_BYTES=20_000;
const BLOCK_BYTES=40_000;
const documentedLargeFiles=new Set<string>();

function walk(dir:string):string[]{
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const file=path.join(dir,entry.name);
    return entry.isDirectory()?walk(file):[file];
  });
}

const executable=ROOTS.flatMap(root=>walk(root))
  .filter(file=>EXECUTABLE_EXTENSIONS.has(path.extname(file)));

for(const file of executable){
  const size=fs.statSync(file).size;
  if(size>BLOCK_BYTES && !documentedLargeFiles.has(file)){
    errors.push(`${file} is ${size} bytes (> ${BLOCK_BYTES}); decompose or document a reviewed exception`);
  }else if(size>REVIEW_BYTES){
    warnings.push(`${file} is ${size} bytes (> ${REVIEW_BYTES}); architecture review recommended`);
  }
}

const pkg=JSON.parse(fs.readFileSync('package.json','utf8')) as {dependencies?:Record<string,string>};
if(Object.keys(pkg.dependencies ?? {}).length){
  warnings.push('Runtime dependencies exist; verify provenance, necessity, license and vulnerability status');
}

const trustpilot='src/reputation/trustpilot.ts';
if(fs.existsSync(trustpilot)){
  const source=fs.readFileSync(trustpilot,'utf8');
  if(/fetch\s*\(\s*url/.test(source) && /trustpilot\.com\/review/.test(source)){
    errors.push('Unsupported Trustpilot HTML scraping remains in the release candidate');
  }
}

for(const warning of warnings) console.warn('WARNING:',warning);
if(errors.length){
  console.error('Professionalism audit failed:\n'+errors.map(item=>' - '+item).join('\n'));
  process.exit(1);
}
console.log(`Professionalism audit passed: ${executable.length} executable source files checked.`);
