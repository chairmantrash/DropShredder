import fs from 'node:fs';
import path from 'node:path';

const errors:string[]=[];
const warnings:string[]=[];
const EXECUTABLE_EXTENSIONS=new Set(['.ts','.tsx','.js','.mjs','.cjs']);
const ROOTS=['src','entrypoints'];
const REVIEW_BYTES=20_000;
const BLOCK_BYTES=40_000;
// Temporary reviewed exception: characterize and decompose this orchestration module without mixing behavior changes.
const documentedLargeFiles=new Set<string>(['entrypoints/sidepanel/main.ts']);
// DS-059 reviewed exception: Chrome copies this entire injected function body.
// No closures/eval/shared page state. The documented exception has a hard cap.
const serializedExtractorReview='brain/decisions/20261016-001-typed-identity-and-observed-countdowns.md';
const scopedReviewExtension='brain/decisions/20261016-002-beta100-review-and-warning-boundaries.md';

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
  const boundedSerializedExtractor=file==='src/extraction/page-scan.ts'&&(size<=45_000||size<=49_000&&fs.existsSync(scopedReviewExtension))&&fs.existsSync(serializedExtractorReview);
  if(size>BLOCK_BYTES && !documentedLargeFiles.has(file)&&!boundedSerializedExtractor){
    errors.push(`${file} is ${size} bytes (> ${BLOCK_BYTES}); decompose or document a reviewed exception`);
  }else if(size>REVIEW_BYTES){
    warnings.push(`${file} is ${size} bytes (> ${REVIEW_BYTES}); architecture review recommended`);
  }
}

const pkg=JSON.parse(fs.readFileSync('package.json','utf8')) as {dependencies?:Record<string,string>};
if(Object.keys(pkg.dependencies ?? {}).length){
  warnings.push('Runtime dependencies exist; verify provenance, necessity, license and vulnerability status');
}

const duplicateArchitecture:Array<[string,string]>=[
  ['src/analysis/product-fingerprint.ts','Duplicate product-fingerprint authority must not return'],
];
for(const [file,message] of duplicateArchitecture){
  if(fs.existsSync(file)) errors.push(`${message}: ${file}`);
}

const evidenceEngine=fs.readFileSync('src/analysis/evidence-engine.ts','utf8');
if(!/from '\.\/evidence-fusion'/.test(evidenceEngine) || !/export function fusionSummary/.test(evidenceEngine)){
  errors.push('Canonical evidence engine is no longer bridged to independence-aware fusion');
}

const reviewProvenance=fs.readFileSync('src/analysis/review-provenance.ts','utf8');
if(/function\s+(?:duplicatePairs|maxWindowShare)\s*\(/.test(reviewProvenance)){
  errors.push('Review provenance reintroduced duplicate review-analysis primitives');
}

const betaRequired=[
  'src/analysis/dark-patterns.ts',
  'src/intelligence/regulatory-match.ts',
  'BETA-TESTING.md',
  'RELEASE-TESTING.md',
];
for(const file of betaRequired){if(!fs.existsSync(file)) errors.push(`Beta-critical file missing: ${file}`);}

const currentState=fs.readFileSync('workplane/CURRENT-STATE.md','utf8');
if(/\*\*Phase:\*\*\s*Active implementation/i.test(currentState)) warnings.push('Workplane still claims generic active implementation instead of beta completion/verification');

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
