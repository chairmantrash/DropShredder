# Chrome Full Runtime Conformance Audit — 2026-10-07

## Scope
Every Chrome-facing DropShredder command was traced from user gesture through permission, execution context, browser target, bounded work and failure behavior.

## Primary authority
Chrome Side Panel, Tabs, Scripting, Permissions, Context Menus, Storage, extension service-worker lifecycle, user-privacy guidance and Chrome Web Store policies.

## Command matrix

| Command / path | Chrome context | Required authority | Correct target / behavior | Audit result |
|---|---|---|---|---|
| Toolbar icon | service worker + action | sidePanel | setPanelBehavior openPanelOnActionClick | conforming |
| CHECK THIS PRODUCT | side panel click | scripting + exact optional host | active tab in lastFocusedWindow; reject unsafe; request exact origin; inject exact tabId | corrected |
| Warning stamp | side panel after scan | same authorized page | inject isolated function into exact scanned tab | conforming |
| Find other sellers | side panel click | tabs.create | bounded inactive search tabs | conforming |
| Search this image | side panel click | image CDN optional host + tabs.create | permission request stays in click chain; credentialless bounded fetch; bounded search tabs | corrected |
| Check this store | side panel click | tabs.create | bounded inactive searches | conforming |
| Site age / RDAP | side panel click | rdap.org optional host + storage | permission request stays in click chain; 5s timeout; 2MB response cap; session cache | corrected |
| Buyer reputation | side panel click | tabs.create | explicit user searches only; no silent scraping | conforming |
| Fine print | side panel click | exact page host already authorized | locate same-origin policy link; fetch from authorized page context; 3.5s timeout | conforming; browser matrix required |
| Fulfillment check | side panel click | exact page host | exact active authorized tab; bounded visible text | conforming |
| Delete history | side panel | IndexedDB | clear extension observation DB only | conforming |
| Remove extra site access | side panel | permissions | remove granted HTTPS optional origins | conforming |
| Feature settings | side panel | storage | extension local storage | conforming |
| RDAP cache | side panel module | storage | storage.session; no service-worker global state | conforming |
| Context menus | service worker | contextMenus | HTTP/HTTPS documents only | corrected |
| Context-menu searches | service worker event | tabs.create | event-supplied tab/page/image data; bounded inactive tabs | conforming |
| Service-worker startup | service worker | sidePanel/storage/contextMenus | listeners registered synchronously by defineBackground execution; no correctness-critical global state | conforming |

## Permission model
Required:
- scripting
- storage
- contextMenus
- sidePanel

Optional host capability:
- https://*/*

No permanent host_permissions.
No activeTab dependency.
No tabs permission (avoids the Chrome “Read your browsing history” warning).
No cookies/history/webRequest/debugger/nativeMessaging/identity permissions.

The broad optional HTTPS declaration is capability only. Runtime requests are narrowed to the exact active site, image host or RDAP host as required by the invoked feature.

## Correctness invariants
- Side panel never uses currentWindow to identify the browsing page.
- Current tab identity resolution is active:true + lastFocusedWindow:true; no sensitive URL metadata is assumed.
- Existing page authority is proven by a tiny scripting probe that returns location.href.
- If authority is missing, Chrome 133+ permissions.addHostAccessRequest({tabId}) creates the browser-native site access request without requiring tabs/browsing-history permission.
- Page injection never precedes exact-origin authorization.
- Permission request is directly downstream of a user click.
- Restricted and sensitive pages are refused before extraction.
- Changing active tab changes the scan target.
- No guessed last-tab global state.
- Service-worker termination cannot erase correctness-critical state.
- Context menus do not advertise commands on unsupported chrome/file documents.
- Cross-origin extension fetches require explicit optional host access.
- Search fan-out remains bounded.
- Network work has time/size bounds.
- Credentials/cookies are not requested or intentionally transmitted.

## Automated enforcement
scripts/chrome-runtime-audit.mjs is a release gate in CI. It rejects regression of the reviewed Chrome runtime invariants. Security/release audits were also corrected so they no longer require the invalid activeTab architecture.

## Browser-only mandatory verification
Static/CI conformance cannot emulate Chrome's actual permission bubble and side-panel focus lifecycle. The next unpacked build must verify:
1. toolbar opens panel;
2. first scan requests exact site;
3. grant continues scan;
4. deny aborts clearly;
5. second scan same origin does not reprompt;
6. switch origin while panel remains open targets new tab;
7. revoke causes prompt on next scan;
8. image CDN permission request works from Search This Image;
9. RDAP permission request works from Site Age;
10. context menus absent on unsupported pages;
11. policy/fulfillment use active page;
12. service worker can sleep/restart without breaking commands.

Any failure is release-blocking.
