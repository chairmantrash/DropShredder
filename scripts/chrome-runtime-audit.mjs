import fs from 'node:fs';

const failures=[];
const config=fs.readFileSync('wxt.config.ts','utf8');
const panel=fs.readFileSync('entrypoints/sidepanel/main.ts','utf8');
const bg=fs.readFileSync('entrypoints/background.ts','utf8');
const image=fs.readFileSync('src/forensics/image-acquisition.ts','utf8');
const rdap=fs.readFileSync('src/osint/rdap.ts','utf8');
const scanner=fs.readFileSync('src/extraction/page-scan.ts','utf8');
const pageRuntime=fs.readFileSync('src/runtime/chrome-page.ts','utf8');

const requireMatch=(text,re,message)=>{if(!re.test(text)) failures.push(message);};
const forbid=(text,re,message)=>{if(re.test(text)) failures.push(message);};

requireMatch(config,/permissions:\s*\['scripting', 'storage', 'contextMenus', 'sidePanel', 'alarms'\]/,'manifest permission baseline drifted');
requireMatch(config,/minimum_chrome_version:\s*'133'/,'Chrome 133+ required for tab-scoped host access requests');
requireMatch(config,/optional_host_permissions:\s*\['https:\/\/\*\/\*'\]/,'optional HTTPS host permission missing');
forbid(config,/'activeTab'/,'activeTab must not be used as persistent side-panel access');
forbid(config,/(^|\n)\s*host_permissions\s*:/m,'permanent host permissions are forbidden');

requireMatch(pageRuntime,/chrome\.tabs\.query\(\{active:true,lastFocusedWindow:true\}\)/,'current tab must use active + lastFocusedWindow');
forbid(panel,/currentWindow:true/,'side panel must not infer current browser window with currentWindow');
requireMatch(pageRuntime,/chrome\.permissions\.addHostAccessRequest\(\{tabId:tab\.id\}\)/,'scan must use tab-scoped Chrome host access request');
requireMatch(panel,/pageSafety\(page\.url\)/,'scan must run page-safety gate on authorized URL');
requireMatch(panel,/await authorizeChromePage\(tab\)/,'scan-like paths must gate injection on actual authorized page access');
requireMatch(panel,/chrome\.scripting\.executeScript/,'scanner must use scripting injection after permission gate');
requireMatch(panel,/func:extractPageScan/,'side panel must invoke packaged page scanner');
requireMatch(pageRuntime,/documentIds:\[page\.documentId\]/,'authorized scan transaction must pin Chrome documentId');
requireMatch(panel,/world:'ISOLATED'/,'page scanner must explicitly use isolated execution world');
requireMatch(scanner,/export function extractPageScan/,'packaged page scanner missing');

requireMatch(bg,/setPanelBehavior\(\{ openPanelOnActionClick: true \}\)/,'toolbar action must open/toggle side panel');
requireMatch(bg,/documentUrlPatterns:\['http:\/\/\*\/\*','https:\/\/\*\/\*'\]/,'context menus must be limited to web documents');
const chooser=fs.readFileSync('src/ui/search-chooser.ts','utf8');
requireMatch(chooser,/chrome\.tabs\.create\(\{url:c\.url,active:false\}\)/,'Deep Hunt searches must open bounded background tabs after explicit selection');
requireMatch(chooser,/selected\.length>8/,'Deep Hunt must cap each batch at eight');
requireMatch(bg,/search\.html#\$\{key\}/,'Context searches must disclose destinations in the same chooser');

requireMatch(image,/chrome\.permissions\.request\(\{origins:\[hostPattern\(url\)\]\}\)/,'image acquisition must request its exact image host directly');
forbid(image,/await chrome\.permissions\.contains/,'image permissions must not await a preflight before request');
requireMatch(image,/response\.body\.getReader\(\)/,'image downloads must enforce byte limits while streaming');
requireMatch(panel,/verifiedReportPage\(report\)/,'Deep Hunt must bind actions to scanned document');
requireMatch(panel,/chrome\.tabs\.onActivated\.addListener/,'tab switching must invalidate stale side-panel reports');
requireMatch(panel,/chrome\.tabs\.onUpdated\.addListener/,'full navigation must invalidate side-panel reports');
requireMatch(panel,/await isCurrentChromePage\(page\)/,'SPA and document validity must be proven before results are applied');
requireMatch(pageRuntime,/probe\?\.documentId===page\.documentId/,'page validity must include document ID');
requireMatch(pageRuntime,/probe\?\.result\?\.url===page\.url/,'page validity must include SPA URL');
requireMatch(scanner,/MAX_ELEMENTS=9000/,'scanner must bound DOM element traversal');
requireMatch(scanner,/MAX_TEXT_NODES=4500/,'scanner must bound page text traversal');
requireMatch(scanner,/MAX_JSON_BYTES=60_000/,'scanner must bound JSON-LD bytes');
forbid(scanner,/document\.body\?\.innerText|document\.head\?\.innerHTML|\.\.\.document\.scripts|\.\.\.document\.images/,'scanner must not materialize unbounded DOM collections');
requireMatch(image,/credentials:'omit'/,'image fetch must omit credentials');
requireMatch(image,/AbortSignal\.timeout\(8000\)/,'image fetch timeout missing');
requireMatch(image,/MAX_IMAGE_BYTES=15_000_000/,'image byte bound missing');

requireMatch(rdap,/chrome\.permissions\.request\(\{origins:\[origin\]\}\)/,'RDAP must request host access directly from the click');
requireMatch(rdap,/if\(!\(await permission\)\)/,'RDAP must await consent before cache access');
requireMatch(rdap,/redirect:'error'/,'RDAP must not follow unapproved redirects');
requireMatch(rdap,/response\.body\.getReader\(\)/,'RDAP data must be stream-limited');
requireMatch(rdap,/const permission=ensureRdapPermission\(origin\)/,'RDAP must request permission before async cache reads');
requireMatch(rdap,/AbortSignal\.timeout\(5000\)/,'RDAP timeout missing');
requireMatch(rdap,/chrome\.storage\.session/,'RDAP cache must use extension session storage');

forbid(bg,/lastActiveWebTabId|dropshredder:get-active-web-tab/,'obsolete guessed-tab architecture returned');

// Opt-in automatic shopping alerts: verify the permission and noisy-page boundaries,
// not only the manual scan invariants.
const autoContent=fs.readFileSync('entrypoints/auto.content.ts','utf8');
const detector=fs.readFileSync('src/detection/shopping-page.ts','utf8');
const autoRegistration=fs.readFileSync('src/runtime/auto-registration.ts','utf8');
const pageFacts=fs.readFileSync('src/detection/page-facts.ts','utf8');
requireMatch(config,/optional_host_permissions:\s*\['https:\/\/\*\/\*'\]/,'automatic host screening must remain optional');
requireMatch(autoContent,/registration:'runtime'/,'auto scanner must not be statically registered for all sites');
requireMatch(autoContent,/matches:\[\]/,'WXT runtime auto entrypoint must not add required host permissions');
requireMatch(autoRegistration,/persistAcrossSessions:true/,'automatic registration must survive worker restart');
requireMatch(autoRegistration,/world:'ISOLATED'/,'automatic screening must stay isolated');
requireMatch(autoContent,/detectShoppingPage\(document,url\)/,'automatic scanner must classify page before extraction');
requireMatch(autoContent,/classification\.showToast/,'only confirmed product pages may show toasts');
requireMatch(autoContent,/DS_AUTO_STATUS/,'auto scanner must verify consent immediately before content work');
requireMatch(panel,/chrome\.permissions\.request\(\{origins:\[AUTO_PATTERN\]\}\)/,'opt-in must request Chrome permission from user gesture');
requireMatch(bg,/chrome\.sidePanel\.open\(\{tabId:sender\.tab\.id\}\)/,'toast click must open the originating tab panel');
requireMatch(bg,/sender\.documentId/,'toast intent must bind a Chrome document');
requireMatch(panel,/documentIds:\[value\.documentId\]/,'side panel must reject stale toast documents');
requireMatch(detector,/classification|showToast/,'pure page classifier must be present');
requireMatch(detector,/structuredArticle/,'article markup must be considered before automatic alerts');
requireMatch(detector,/collectionPath/,'collection/search exclusion must exist');
requireMatch(pageFacts,/hasSensitiveFields/,'preflight must check password/payment fields');
forbid(autoContent,/MutationObserver|setInterval|fetch\(|captureImageFingerprint|saveObservation|openSearches/,
 'automatic product alerts must not crawl, fetch, store reports or open external tabs');

if(failures.length){
 console.error('Chrome runtime audit failed:\n'+failures.map(x=>' - '+x).join('\n'));
 process.exit(1);
}
console.log('Chrome runtime audit passed: side panel, tab targeting, optional permissions, scripting, menus, searches, image acquisition and RDAP conform to reviewed runtime invariants.');
