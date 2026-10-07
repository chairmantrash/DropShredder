import assert from 'node:assert/strict';
import test from 'node:test';
import { promises as fs } from 'node:fs';

test('page scanner is packaged outside the sidepanel controller',async()=>{
 const panel=await fs.readFile('entrypoints/sidepanel/main.ts','utf8');
 const scanner=await fs.readFile('src/extraction/page-scan.ts','utf8');
 assert.match(panel,/func:extractPageScan/);
 assert.match(panel,/world:'ISOLATED'/);
 assert.doesNotMatch(panel,/querySelectorAll<HTMLScriptElement>\('script\[type="application\/ld\+json"\]'\)/);
 assert.match(scanner,/export function extractPageScan\(\):PageScanResult/);
});

test('scan aborts if navigation changes the document during authorization and extraction',async()=>{
 const panel=await fs.readFile('entrypoints/sidepanel/main.ts','utf8');
 assert.match(panel,/result\.product\.url!==page\.url/);
 assert.match(panel,/page changed while DropShredder was checking it/);
});

test('scanner centralizes bounded expensive collection budgets',async()=>{
 const scanner=await fs.readFile('src/extraction/page-scan.ts','utf8');
 assert.match(scanner,/const LIMITS=\{images:160,scripts:220,pageText:100_000,cards:160,amazonCards:120,reviews:60,htmlSignature:60_000\}/);
 assert.match(scanner,/Math\.min\(document\.images\.length,LIMITS\.images\)/);
 assert.match(scanner,/Math\.min\(document\.scripts\.length,LIMITS\.scripts\)/);
 assert.match(scanner,/\.slice\(0,LIMITS\.reviews\)/);
 assert.match(scanner,/\.slice\(0,LIMITS\.pageText\)/);
});
