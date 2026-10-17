/** Preserve minimal public structured-data inputs; this is a derived replay, not the original HTML. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {productFromPublicHtml} from '../../../src/osint/public-product-comparison';
const dir=process.env.DS62_CAPTURES!,out='workplane/runs/DS-062';
const prior=JSON.parse(fs.readFileSync(path.join(out,'public100-before-binding-repair.json'),'utf8'));
const cases=prior.outcomes.filter((r:any)=>r.httpStatus===200&&r.sha256).map((r:any)=>{
 const bytes=fs.readFileSync(path.join(dir,r.id+'.html'));assert.equal(createHash('sha256').update(bytes).digest('hex'),r.sha256);
 const html=bytes.toString('utf8');
 const tags=/<!--[\s\S]*?-->|<(style|textarea|template|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>|<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
 const derived=[...html.matchAll(tags)].filter(m=>m[2]!==undefined&&/(?:^|\s)type\s*=\s*(?:"application\/ld\+json"|'application\/ld\+json')(?=\s|$)/i.test(m[2]!)).map(m=>m[0]).join('\n');
 const result=(input:string)=>{try{return productFromPublicHtml(input,r.url,r.finishedAt);}catch(e){return String(e);}};
 assert.deepEqual(result(derived),result(html),r.id+' derived-input equivalence');
 return {id:r.id,url:r.url,capturedAt:r.finishedAt,originalHtmlSha256:r.sha256,derivedSha256:createHash('sha256').update(derived).digest('hex'),derivedJsonLdScripts:derived};
});
fs.writeFileSync(path.join(out,'structured-inputs.json'),JSON.stringify({scope:'Derived public JSON-LD raw-text blocks only; not original HTML, independent labels, merchant authenticity or native Chrome acceptance',cases},null,2)+'\n');
console.log('Derived script-only replay equals complete captured HTML on all',cases.length,'eligible inputs');
