import assert from 'node:assert/strict';
import test from 'node:test';
import { promises as fs } from 'node:fs';

test('background tracks active normal web tabs for the side panel',async()=>{
 const source=await fs.readFile('entrypoints/background.ts','utf8');
 assert.match(source,/chrome\.tabs\.onActivated\.addListener/);
 assert.match(source,/dropshredder:get-active-web-tab/);
 assert.match(source,/chrome\.tabs\.get\(lastActiveWebTabId\)/);
});

test('side panel asks background for the product tab before fallback discovery',async()=>{
 const source=await fs.readFile('entrypoints/sidepanel/main.ts','utf8');
 assert.match(source,/sendMessage\(\{type:'dropshredder:get-active-web-tab'\}\)/);
 assert.match(source,/chrome\.tabs\.get\(response\.tabId\)/);
 assert.doesNotMatch(source,/chrome\.tabs\.query\(\{active:true,currentWindow:true\}\)/);
});

test('all scan-like sidepanel actions use the shared active web tab resolver',async()=>{
 const source=await fs.readFile('entrypoints/sidepanel/main.ts','utf8');
 const calls=source.match(/await activeWebTab\(\)/g) ?? [];
 assert.ok(calls.length>=3,'shared resolver must be used by scan, policy and fulfillment paths');
});
