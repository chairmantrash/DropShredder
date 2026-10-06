# DropShredder Release Smoke Test

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
- Enable Auto Reputation Sweep: Chrome asks specifically for Trustpilot access.
- Disable it: Trustpilot optional access is revoked.
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
