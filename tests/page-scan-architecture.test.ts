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

test('scanner keeps bounded expensive collections',async()=>{
 const scanner=await fs.readFile('src/extraction/page-scan.ts','utf8');
 assert.match(scanner,/Math\.min\(document\.images\.length,200\)/);
 assert.match(scanner,/Math\.min\(document\.scripts\.length,300\)/);
 assert.match(scanner,/\.slice\(0,200\)/);
 assert.match(scanner,/\.slice\(0,80\)/);
 assert.match(scanner,/\.slice\(0,120000\)/);
});
