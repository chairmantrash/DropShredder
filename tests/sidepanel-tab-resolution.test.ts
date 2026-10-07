import assert from 'node:assert/strict';
import test from 'node:test';
import { promises as fs } from 'node:fs';

test('side panel resolves an active normal web tab without currentWindow',async()=>{
 const source=await fs.readFile('entrypoints/sidepanel/main.ts','utf8');
 assert.match(source,/chrome\.tabs\.query\(\{active:true\}\)/);
 assert.doesNotMatch(source,/chrome\.tabs\.query\(\{active:true,currentWindow:true\}\)/);
});

test('all scan-like sidepanel actions use the shared active web tab resolver',async()=>{
 const source=await fs.readFile('entrypoints/sidepanel/main.ts','utf8');
 const calls=source.match(/await activeWebTab\(\)/g) ?? [];
 assert.ok(calls.length>=3,'shared resolver must be used by scan, policy and fulfillment paths');
});
