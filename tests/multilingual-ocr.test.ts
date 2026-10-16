import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {OCR_LANGUAGES} from '../src/forensics/local-label-reader';
const models=JSON.parse(fs.readFileSync('public/ocr/LANGUAGE-MODELS.json','utf8')) as Array<{language:string;sourceUrl:string;originalBytes:number;originalSha256:string;packagedBytes:number;packagedSha256:string;license:string}>;
test('all seven selected offline models are pinned, licensed and byte-identical after decompression',()=>{
 assert.deepEqual(models.map(m=>m.language),OCR_LANGUAGES.slice(1));
 assert.match(fs.readFileSync('public/ocr/LICENSE-TESSDATA-FAST.txt','utf8'),/Apache License/);
 for(const m of models){
  assert.equal(m.license,'Apache-2.0');assert.match(m.sourceUrl,/\/87416418657359cb625c412a48b6e1d6d41c29bd\//);
  const bytes=fs.readFileSync(`public/ocr/${m.language}.traineddata.gz`),raw=gunzipSync(bytes);
  assert.equal(bytes.length,m.packagedBytes);assert.equal(raw.length,m.originalBytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),m.packagedSha256);assert.equal(createHash('sha256').update(raw).digest('hex'),m.originalSha256);
 }
});
test('OCR selector values match the finite model allowlist and model requests remain packaged',()=>{
 const html=fs.readFileSync('entrypoints/sidepanel/index.html','utf8'),source=fs.readFileSync('src/forensics/local-label-reader.ts','utf8');
 for(const lang of OCR_LANGUAGES)assert.ok(html.includes(`value="${lang}"`));
 assert.match(source,/chrome\.runtime\.getURL\('ocr\/'\)/);assert.doesNotMatch(source,/https:\/\//);
});
