import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {productFromPublicHtml} from '../../../src/osint/public-product-comparison';
const dir=process.env.DS62_CAPTURES!,out='workplane/runs/DS-062';
const prior=JSON.parse(fs.readFileSync(path.join(out,'public100-before-binding-repair.json'),'utf8'));
const rows=prior.outcomes.map((r:any)=>{
 if(r.httpStatus!==200||!r.sha256)return {...r,replayStatus:'NOT_ELIGIBLE'};
 const bytes=fs.readFileSync(path.join(dir,r.id+'.html'));
 if(createHash('sha256').update(bytes).digest('hex')!==r.sha256)throw Error('Capture hash mismatch: '+r.id);
 try{const product=productFromPublicHtml(bytes.toString('utf8'),r.url,r.finishedAt);return {...r,product,replayStatus:product?'PRODUCT_BOUND':'UNRESOLVED'};}
 catch(e){return {...r,replayStatus:'REFUSED',replayError:String(e)};}
});
const summary={frozenCases:rows.length,eligibleHtml:rows.filter((r:any)=>r.httpStatus===200).length,boundBefore:rows.filter((r:any)=>r.status==='PRODUCT_BOUND').length,boundAfter:rows.filter((r:any)=>r.replayStatus==='PRODUCT_BOUND').length,nativeTests:false,independentTruth:false};
fs.writeFileSync(path.join(out,'public100-after-binding-repair.json'),JSON.stringify({summary,outcomes:rows},null,2)+'\n');console.log(summary);
