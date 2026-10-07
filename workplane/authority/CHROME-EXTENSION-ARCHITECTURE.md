# DropShredder Chrome Extension Architecture

## Runtime model
DropShredder is a Manifest V3 side-panel extension. Chrome contexts are treated as separate security/lifecycle domains rather than one application process.

### Side panel
Owns user interaction, orchestration and rendering. It must not assume its own window is the browsing window.

### Chrome page transaction runtime
`src/runtime/chrome-page.ts` is the authority for selecting and authorizing a page.
- Resolve tab identity with `active:true,lastFocusedWindow:true`.
- Prove existing authority using a tiny ISOLATED-world script.
- Capture Chrome's `documentId`.
- If authority is absent, add a tab-scoped host-access request.
- All later page operations target that exact `documentId`, not merely the tab.
- Navigation therefore fails closed instead of mixing documents.

### Page scanner
`src/extraction/page-scan.ts` is the packaged, self-contained DOM extraction function executed in Chrome's ISOLATED world.
- Structured product data is preferred.
- DOM fallbacks are bounded.
- Page text, images, scripts, product cards, marketplace cards and visible reviews have explicit work budgets.
- Extraction returns data only; scoring remains extension-side.
- No remote executable code.
- No page-owned JavaScript is trusted or executed.

### Analysis
Analysis modules consume the extraction contract and local history. Country, platform and importing remain informational unless independent evidence establishes deception or risk.

### Service worker
The MV3 worker is an event coordinator only:
- side-panel behavior
- context-menu registration
- bounded search-tab creation
It contains no correctness-critical volatile state.

### Storage
- settings: chrome.storage.local
- ephemeral network cache: chrome.storage.session
- bounded forensic chronology: IndexedDB
No credentials, cookies, payment fields or arbitrary browsing history are stored.

## Chrome capability policy
Required permissions remain minimal: scripting, storage, contextMenus, sidePanel.
Optional HTTPS host capability is granted per site through Chrome.
Do not add tabs, history, debugger, webRequest, nativeMessaging, cookies, tabCapture or blanket host access without a documented capability/security review.

## Execution worlds
ISOLATED is mandatory for ordinary extraction.
MAIN-world code is prohibited by default. It may only be introduced for a documented storefront capability that cannot be obtained from DOM/structured data, must return a narrowly validated serializable result, and must have dedicated hostile-page tests.

## Advanced API policy
- registered content scripts: use only if repeated per-page work justifies persistent registration and host-access behavior remains explicit.
- offscreen documents: use only for DOM work that cannot occur safely in the page or worker.
- declarative APIs: prefer when they reduce page observation or runtime cost.
- structured clone/browser namespace: future modernization when the minimum supported Chrome version makes it practical; not a reason by itself to raise minimum version.

## Performance invariants
- no passive continuous scanning
- no MutationObserver over whole pages in default mode
- no unbounded DOM collections
- no unbounded tab fan-out
- no unbounded network waits or response bodies
- no image fetch with credentials
- expensive external investigations are explicit actions
- scanner budgets are release-tested

## Release invariants
A Chrome-facing feature is incomplete until its:
1. execution context,
2. permission authority,
3. tab/document target,
4. lifecycle behavior,
5. failure behavior,
6. data boundary,
7. performance bound,
8. automated regression check,
9. real-browser smoke case
are defined.
