import assert from 'node:assert/strict';
import test from 'node:test';
import { promises as fs } from 'node:fs';

test('side panel resolves tab identity without privileged tab metadata',async()=>{
 const source=await fs.readFile('entrypoints/sidepanel/main.ts','utf8');
 assert.match(source,/chrome\.tabs\.query\(\{active:true,lastFocusedWindow:true\}\)/);
 assert.doesNotMatch(source,/currentWindow:true/);
});

test('page authority is proven by scripting and missing access creates a tab-scoped Chrome request',async()=>{
 const source=await fs.readFile('entrypoints/sidepanel/main.ts','utf8');
 assert.match(source,/async function authorizedPage/);
 assert.match(source,/func:\(\)=>location\.href/);
 assert.match(source,/chrome\.permissions\.addHostAccessRequest\(\{tabId:tab\.id\}\)/);
 assert.doesNotMatch(source,/lastActiveWebTabId|dropshredder:get-active-web-tab/);
});

test('manifest uses modern host request support without tabs browsing-history permission',async()=>{
 const config=await fs.readFile('wxt.config.ts','utf8');
 assert.match(config,/minimum_chrome_version:\s*'133'/);
 assert.doesNotMatch(config,/'tabs'/);
 assert.doesNotMatch(config,/'activeTab'/);
 assert.match(config,/optional_host_permissions:\s*\['https:\/\/\*\/\*'\]/);
});

test('all page-reading actions use the shared authorized-page resolver',async()=>{
 const source=await fs.readFile('entrypoints/sidepanel/main.ts','utf8');
 const calls=source.match(/await authorizedPage\(tab\)/g) ?? [];
 assert.ok(calls.length>=3,'scan, policy and fulfillment must all prove page authority');
});
