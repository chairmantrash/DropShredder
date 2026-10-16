# DropShredder Beta / Release Smoke Test

Target public build: Chrome/Chromium Manifest V3.

A CI-green ZIP is not publishable until these browser checks pass.

## Install / first run
- Load the unpacked production build in current stable Chrome.
- Extension name, icon and side panel render correctly.
- No error badge or service-worker exception.
- Required permissions at install match the reviewed baseline only.
- No optional site access is granted before a feature asks for it.
- Default tone is Professional.
- Reload browser and confirm settings persist.

## Privacy / security
- Try a normal product page: scan is allowed.
- Try an account/login page: scan is refused.
- Try a checkout/payment page: scan is refused.
- Try an ordinary page containing a password or credit-card field: scan is refused.
- Verify no page cookies, passwords or form values appear in Raw evidence.
- Scan a URL containing tracking/query parameters, then inspect exported/local diagnostic storage in the internal build: stored URL must contain origin+path only.
- Confirm reputation research only runs after an explicit user action.
- Confirm no third-party review-site access is granted automatically.
- Grant an image-origin permission, then press REVOKE OPTIONAL SITE ACCESS: the grant disappears.
- CLEAR LOCAL HISTORY removes local observations.

## Performance / UX
Measure using Chrome Task Manager / Performance panel where practical.
- Opening DropShredder without scanning causes no continuous page CPU activity.
- Product-page scan completes without freezing scrolling or interaction.
- Collection page with hundreds of cards remains responsive.
- Amazon search page with many results remains responsive.
- Slow About/Shipping/Return endpoints time out rather than hanging the panel.
- Reputation/RDAP outage produces a bounded error and leaves local scan usable.
- Huge image (>15 MB) is refused cleanly.
- Normal image fingerprinting does not lock the UI.
- Source Hunt opens a bounded number of grouped searches, not dozens of tabs.
- Warning stamp is dismissible.
- Keyboard focus is visible on all controls.

## Platform/site matrix
Run at least one representative page for:
- Shopify
- WooCommerce
- SHOPLINE
- Shoplazza
- ShopBase
- Wix Stores
- Ecwid
- Squarespace Commerce
- Amazon product
- Amazon search results
- Etsy
- eBay or Walmart Marketplace
- generic/non-recognized commerce site

Verify platform presence remains informational and does not independently produce a severe verdict.

## Real-world regression sites
Use these only as evidence fixtures, not as pre-decided verdicts:
- Geeksoutfit-like cross-border/secondary-page identity pattern.
- HaremPants/Sure Design merchant-network relationship.
- Amazon generic furniture/pet/home product search with visually duplicated items.

Confirm the extension shows the evidence it actually recovers and preserves UNKNOWN where evidence is absent.

## Evidence quality
- One weak supplier/image clue cannot unlock a severe warning.
- Merchant complaints alone cannot raise product provenance.
- Country/manufacture geography alone has zero accusation weight.
- Sister-store membership alone cannot satisfy severe provenance gate.
- Review-source rating discrepancy is labeled as discrepancy, not “fake reviews.”
- Made in USA preference notice is separate from misconduct/risk scoring.
- Tone mode changes wording only.

## Storage / retention
Automated tests cover caps, but browser test should verify:
- repeated scans remain fast after history exists;
- old records do not cause noticeable scan slowdown;
- local history clear works without reload corruption.

## Release artifact
- Inspect generated manifest.json.
- Confirm Manifest V3 and self-only CSP.
- Confirm no permanent host_permissions.
- Confirm optional host permission is HTTPS only.
- Confirm no source maps, .env, private keys, node_modules or test files in the Store ZIP.
- Verify version in side-panel footer matches manifest version.

## Chrome Web Store submission
Human/developer-dashboard steps:
- upload the exact CI artifact;
- complete Privacy Practices truthfully from PRIVACY.md;
- provide privacy-policy URL;
- provide screenshots/promotional art from the same version;
- confirm single-purpose description;
- review permission warnings before submission.

Record date, Chrome version, OS, build commit and any failure before publication.


## Beta candidate gate
Before handing a beta build to testers, record:
- exact Git commit;
- CI and CodeQL success on that exact commit;
- Store ZIP artifact from that CI run, not a locally modified rebuild;
- known limitations and unsupported sites;
- browser smoke-test status.

Beta testers should report:
- page URL with query parameters removed if they share it;
- what DropShredder said;
- what they expected;
- whether the page became slow or unresponsive;
- Chrome version and OS;
- screenshots only after checking they contain no personal/account/payment information.

A beta build may be distributed before the full site matrix is complete, but it must not be submitted to the public Chrome Web Store until the mandatory browser checks above pass.


## Side-panel permission lifecycle — mandatory
- Open a normal HTTPS product page, open DropShredder, and click CHECK THIS PRODUCT.
- On a never-authorized origin, Chrome may request access to that site; granting it must allow the scan without reinstalling or changing extension settings.
- The requested origin must be the active page only, never blanket all-sites access.
- Switch to a different HTTPS origin while the side panel stays open; CHECK THIS PRODUCT must target the newly active tab and request that origin only if needed.
- Return to an already-authorized origin; scanning must work without a redundant permission prompt.
- Deny a site-access request; DropShredder must explain that access is needed and must not scan.
- Revoke optional site access; the next scan must request the site again.
- chrome://, extension pages, login/account, checkout and payment surfaces remain unscannable.

## Modern Chrome transaction checks
- On a single-page app storefront, start a scan and immediately navigate to another product in the same tab. DropShredder must either finish against the original Chrome document or abort clearly; it must never combine evidence from both products.
- Keep the side panel open while switching between two authorized storefront tabs. Each scan must follow the active tab in the last-focused browser window.
- Trigger a cross-origin navigation after Chrome signals a host-access request but before granting it. The old request must not authorize the new origin.
- Put the extension service worker to sleep/restart between commands. Settings, history and command correctness must survive because no critical state is worker-global.
- Confirm the injected shopper stamp is isolated in Shadow DOM and does not inherit/store page form values.

## Precision automatic product alerts (DS-029) — required real Chrome tests

Automatic protection is **opt-in**, requiring the shopper to grant Chrome's optional HTTPS host access. Do not claim it functions from the manifest or simulation alone.

### Permission lifecycle
- Before opting in, confirm no automatic content script is registered and no alert appears. Manual current-site permission requests still work.
- Toggle automatic alerts ON. The browser must show its actual permission prompt for broad HTTPS site access; deny and confirm no registration or toast.
- Grant access and confirm dynamic content script appears through `chrome.scripting.getRegisteredContentScripts()` with ID `dropshredder-auto-shopping-v1`, ISOLATED, document_idle, main frame only.
- Confirm existing product page is evaluated without needing to reload after grant.
- Toggle OFF. Confirm dynamic registration is removed, broad optional HTTPS grant revoked, and further pages do not trigger. Re-enable, then test browser restart and worker suspension.
- Set Chrome site access to “On click” or one specific site and verify other domains stay untouched.

### Silent pages (should show **no toast**)
- Browser home/new tab, Google searches, general articles, forums, online email, social media.
- Ecommerce homepage, category/collection, merchant search, Amazon search, Etsy search, Walmart search.
- Editorial product reviews or affiliate pages containing Product JSON-LD and a price.
- An unusual category page containing scattered Product schema, many product cards, and purchase buttons.
- Login, account, profile, payment, checkout, cart, or a page with credential/card fields.

### Qualifying pages (should show **one** useful toast)
- Apple iPhone detail page and a distinct Apple product page.
- Individual products on Shopify, WooCommerce, SHOPLINE, Shoplazza, ShopBase, Wix, Ecwid and Squarespace.
- Amazon product detail, Etsy listing, Walmart Marketplace product.
- Structured-data-heavy and React/Next/Hydrogen-rendered product details.
- Product lacking JSON-LD but with clear individual title, displayed price and Buy/Add to Cart control.

### Nuisance and navigation control
- Enter and leave a product before the first-pass scan completes: no stale verdict.
- Switch tabs while the page hydrates: no background-tab toast.
- Dismiss toast, change a variant or hash: no repeated toast for the same product path.
- Switch SPA products via pushState: new product may trigger, previous toast must disappear; no two stale UI overlays.
- Timeout toast after approximately 12 seconds with a working dismiss control.
- Click the quick verdict immediately. Panel must open and run the **clicked document**, including through a sleeping worker. No silent failure.
- Click toast then navigate away, switch tabs, or revoke access: full report must fail closed rather than target another product.
- Quick verdict cannot claim a shop is safe, a dropshipper, or a scam without the independently verified evidence gate.
- Use Chrome Task Manager on huge product/category pages and verify no repeated background traversal, network fan-out or scrolling lag.

### Build checks
- Generated manifest contains no required blanket `host_permissions`, no `tabs`/`activeTab` permission, and no static all-HTTPS content-script match.
- Packaged file `content-scripts/auto.js` is present and runtime registration targets that exact file.
- Quick toast remains entirely local: no third-party requests, no image fetching, no IndexedDB observation storage.
- Chrome Store privacy disclosure explicitly describes optional automatic screening on approved HTTPS sites.
