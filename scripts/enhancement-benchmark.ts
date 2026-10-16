import { performance } from 'node:perf_hooks';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

// Developer-only Node benchmark, not Chrome QA or detector accuracy measurement.
const root=resolve(process.argv[2]??'.');
const load=(path:string)=>import(pathToFileURL(resolve(root,path)).href);
const {runPassiveRules}=await load('src/analysis/passive-rules.ts');
const {indexedSourceEvidence}=await load('src/analysis/source-match.ts');
const {imageHistoryEvidence}=await load('src/forensics/image-history.ts');
const {calculateVerdict}=await load('src/analysis/evidence-engine.ts');
const product={url:'https://shop.example/p',domain:'shop.example',title:'Portable power bank',description:'Details '.repeat(1000),
  gtin:'012345678905',capturedAt:'2026-10-08T00:00:00Z',imageUrls:[],jsonLdProductCount:1,claims:[],pageSignals:[],
  imageFingerprints:Array.from({length:12},(_,i)=>({url:'https://image.example/'+i,sha256:String(i),ahash:'01'.repeat(32),dhash:'10'.repeat(32),width:800,height:800,capturedAt:'2026-10-08T00:00:00Z'}))};
const history=Array.from({length:250},(_,i)=>({id:String(i),identityKey:'test',domain:'aliexpress.com',url:'https://aliexpress.com/item/'+i,
  capturedAt:'2026-10-07T00:00:00Z',report:{product:{...product,url:'https://aliexpress.com/item/'+i,domain:'aliexpress.com',capturedAt:'2026-10-07T00:00:00Z'}}}));
const text='Ordinary product text. '.repeat(5000).slice(0,100_000);
function measure(name:string,fn:()=>unknown,iterations:number){
  for(let i=0;i<5;i++) fn();
  const samples:number[]=[];
  for(let i=0;i<iterations;i++){const start=performance.now();fn();samples.push(performance.now()-start);}
  samples.sort((a,b)=>a-b);
  return {name,iterations,meanMs:samples.reduce((sum,x)=>sum+x,0)/samples.length,p95Ms:samples[Math.floor(samples.length*.95)],maxMs:samples.at(-1)};
}
const signals=Array.from({length:512},(_,i)=>({id:String(i),family:'reviews',severity:'moderate',confidence:.8,weight:10,title:'x',explanation:'x',independentKey:String(i),correlationKeys:['one-campaign']}));
console.log(JSON.stringify({runtime:process.version,root,notMeasured:['Chrome wall time','DOM extraction','network latency','physical product accuracy'],scenarios:[
  measure('passive rules / 100k characters',()=>runPassiveRules(product,text),100),
  measure('source matching / 250 observations x 12 images',()=>indexedSourceEvidence(product,history),50),
  measure('explicit image history / 250 observations x 12 x 12 images',()=>imageHistoryEvidence(product,history),20),
  measure('fusion / 512 correlated signals',()=>calculateVerdict(signals),100),
]},null,2));
