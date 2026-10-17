import fs from 'node:fs';import {createHash} from 'node:crypto';import path from 'node:path';import {pathToFileURL} from 'node:url';
const sourceRoot=process.argv[3]??process.cwd();
const {fulfillmentDisclosure}=await import(pathToFileURL(path.join(sourceRoot,'src/analysis/fulfillment-disclosure.ts')).href);
const input=fs.readFileSync('tools/beta/audit59/disclosure-cases.json','utf8'),data=JSON.parse(input);
const rows=data.cases.map((c:any)=>{const d=fulfillmentDisclosure([{text:c.text,url:c.url}],data.observedAt);return {id:c.id,group:c.group,expected:c.expected,actual:d?.model??null,matched:d?.model===c.expected,quote:d?.quote};});
const output={scope:data.scope,manifestSha256:createHash('sha256').update(input).digest('hex'),positives:rows.length,correct:rows.filter((r:any)=>r.matched).length,rows,overall59Target:'NOT_EVALUABLE — no independent fraud/deceptive-resale labels; positive statement challenge has no representative negative sample'};
fs.writeFileSync(process.argv[2]??'workplane/runs/DS-061/disclosure-baseline.json',JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify({correct:output.correct,total:rows.length}));
