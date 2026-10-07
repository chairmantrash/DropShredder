import fs from 'node:fs';

const failures=[];
const config=fs.readFileSync('wxt.config.ts','utf8');
const panel=fs.readFileSync('entrypoints/sidepanel/main.ts','utf8');
const bg=fs.readFileSync('entrypoints/background.ts','utf8');
const image=fs.readFileSync('src/forensics/image-acquisition.ts','utf8');
const rdap=fs.readFileSync('src/osint/rdap.ts','utf8');
const scanner=fs.readFileSync('src/extraction/page-scan.ts','utf8');

const requireMatch=(text,re,message)=>{if(!re.test(text)) failures.push(message);};
const forbid=(text,re,message)=>{if(re.test(text)) failures.push(message);};

requireMatch(config,/permissions:\s*\['scripting', 'storage', 'contextMenus', 'sidePanel'\]/,'manifest permission baseline drifted');
requireMatch(config,/minimum_chrome_version:\\s*'133'/,'Chrome 133+ required for tab-scoped host access requests');
requireMatch(config,/optional_host_permissions:\s*\['https:\/\/\*\/\*'\]/,'optional HTTPS host permission missing');
forbid(config,/'activeTab'/,'activeTab must not be used as persistent side-panel access');
forbid(config,/host_permissions\s*:/,'permanent host permissions are forbidden');

requireMatch(panel,/chrome\.tabs\.query\(\{active:true,lastFocusedWindow:true\}\)/,'current tab must use active + lastFocusedWindow');
forbid(panel,/currentWindow:true/,'side panel must not infer current browser window with currentWindow');
requireMatch(panel,/chrome\.permissions\.addHostAccessRequest\(\{tabId:tab\.id\}\)/,'scan must use tab-scoped Chrome host access request');
requireMatch(panel,/pageSafety\(page\.url\)/,'scan must run page-safety gate on authorized URL');
requireMatch(panel,/await authorizedPage\(tab\)/,'scan-like paths must gate injection on actual authorized page access');
requireMatch(panel,/chrome\.scripting\.executeScript/,'scanner must use scripting injection after permission gate');
requireMatch(panel,/func:extractPageScan/,'side panel must invoke packaged page scanner');
requireMatch(panel,/documentIds:\[page\.documentId\]/,'authorized scan transaction must pin Chrome documentId');
requireMatch(panel,/world:'ISOLATED'/,'page scanner must explicitly use isolated execution world');
requireMatch(scanner,/export function extractPageScan/,'packaged page scanner missing');

requireMatch(bg,/setPanelBehavior\(\{ openPanelOnActionClick: true \}\)/,'toolbar action must open/toggle side panel');
requireMatch(bg,/documentUrlPatterns:\['http:\/\/\*\/\*','https:\/\/\*\/\*'\]/,'context menus must be limited to web documents');
requireMatch(bg,/chrome\.tabs\.create\(\{url,active:false\}\)/,'Deep Hunt searches must open bounded background tabs');

requireMatch(image,/chrome\.permissions\.request\(\{origins:\[origin\]\}\)/,'image acquisition must request its exact image host');
requireMatch(image,/credentials:'omit'/,'image fetch must omit credentials');
requireMatch(image,/AbortSignal\.timeout\(8000\)/,'image fetch timeout missing');
requireMatch(image,/MAX_IMAGE_BYTES=15_000_000/,'image byte bound missing');

requireMatch(rdap,/chrome\.permissions\.request\(\{origins:\[origin\]\}\)/,'RDAP must request its own host permission');
requireMatch(rdap,/AbortSignal\.timeout\(5000\)/,'RDAP timeout missing');
requireMatch(rdap,/chrome\.storage\.session/,'RDAP cache must use extension session storage');

forbid(bg,/lastActiveWebTabId|dropshredder:get-active-web-tab/,'obsolete guessed-tab architecture returned');

if(failures.length){
 console.error('Chrome runtime audit failed:\n'+failures.map(x=>' - '+x).join('\n'));
 process.exit(1);
}
console.log('Chrome runtime audit passed: side panel, tab targeting, optional permissions, scripting, menus, searches, image acquisition and RDAP conform to reviewed runtime invariants.');
