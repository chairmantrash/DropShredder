import assert from 'node:assert/strict';
import test from 'node:test';
import { promises as fs } from 'node:fs';

test('side panel resolves the user current tab with Chrome documented last-focused-window pattern',async()=>{
 const source=await fs.readFile('entrypoints/sidepanel/main.ts','utf8');
 assert.match(source,/chrome\.tabs\.query\(\{active:true,lastFocusedWindow:true\}\)/);
 assert.doesNotMatch(source,/currentWindow:true/);
});

test('scan requests only the current site origin from a direct button gesture',async()=>{
 const source=await fs.readFile('entrypoints/sidepanel/main.ts','utf8');
 assert.match(source,/chrome\.permissions\.contains\(\{origins:\[origin\]\}\)/);
 assert.match(source,/chrome\.permissions\.request\(\{origins:\[origin\]\}\)/);
 assert.match(source,/if\(!await ensurePageAccess\(tab\)\)/);
});

test('manifest does not pretend activeTab grants persistent side-panel access',async()=>{
 const config=await fs.readFile('wxt.config.ts','utf8');
 assert.doesNotMatch(config,/'activeTab'/);
 assert.match(config,/optional_host_permissions:\s*\['https:\/\/\*\/\*'\]/);
});

test('obsolete guessed-tab tracker is absent',async()=>{
 const background=await fs.readFile('entrypoints/background.ts','utf8');
 assert.doesNotMatch(background,/lastActiveWebTabId|dropshredder:get-active-web-tab/);
});
