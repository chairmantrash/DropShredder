import assert from 'node:assert/strict';
import test from 'node:test';
import { promises as fs } from 'node:fs';

test('Chrome page runtime resolves tab identity without privileged browsing metadata',async()=>{
 const runtime=await fs.readFile('src/runtime/chrome-page.ts','utf8');
 assert.match(runtime,/chrome\.tabs\.query\(\{active:true,lastFocusedWindow:true\}\)/);
 assert.doesNotMatch(runtime,/currentWindow:true/);
});

test('page authority is proven by isolated scripting and missing access creates a tab-scoped request',async()=>{
 const runtime=await fs.readFile('src/runtime/chrome-page.ts','utf8');
 assert.match(runtime,/world:'ISOLATED'/);
 assert.match(runtime,/func:\(\)=>location\.href/);
 assert.match(runtime,/probe\.documentId/);
 assert.match(runtime,/chrome\.permissions\.addHostAccessRequest\(\{tabId:tab\.id\}\)/);
 assert.match(runtime,/documentIds:\[page\.documentId\]/);
});

test('manifest uses modern host request support without browsing-history permission',async()=>{
 const config=await fs.readFile('wxt.config.ts','utf8');
 assert.match(config,/minimum_chrome_version:\s*'133'/);
 assert.doesNotMatch(config,/'tabs'/);
 assert.doesNotMatch(config,/'activeTab'/);
 assert.match(config,/optional_host_permissions:\s*\['https:\/\/\*\/\*'\]/);
});

test('page-reading sidepanel actions share the authorized Chrome page transaction',async()=>{
 const source=await fs.readFile('entrypoints/sidepanel/main.ts','utf8');
 const calls=source.match(/await authorizeChromePage\(tab\)/g) ?? [];
 assert.ok(calls.length>=3,'scan, policy and fulfillment must all prove page authority');
 assert.match(source,/target:documentTarget\(page\)/);
 assert.doesNotMatch(source,/lastActiveWebTabId|dropshredder:get-active-web-tab/);
});
