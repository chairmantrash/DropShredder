# DropShredder Beta Testing

DropShredder 0.2.0 beta 3 is an experimental public beta for Chrome/Chromium. Accuracy, native-language/legal-copy, original-photo and broader lifecycle validation are ongoing beta work. There is no claim that every store or product can be classified.

## Download and install

Use the [beta 3 release](https://github.com/chairmantrash/DropShredder/releases/tag/v0.2.0-beta.3), and download `DropShredder-0.2.0-beta.3-chrome.zip` plus `SHA256SUMS.txt`. The release is published only after exact-artifact/native/public-site checks and exact-head CI/CodeQL pass.

1. Verify ZIP SHA256 `0f52e8f4411dc49d0a64f98f6402e1c0ee68bee13a0f60927ae3a2db7f7314b4` (PowerShell: `Get-FileHash .\DropShredder-0.2.0-beta.3-chrome.zip -Algorithm SHA256`; macOS/Linux: `shasum -a 256 DropShredder-0.2.0-beta.3-chrome.zip`).
2. Extract the ZIP into a folder you will keep. Its root contains `manifest.json`.
3. Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select that folder.
4. Open a normal public product page, click the DropShredder extension icon, and use the side panel. Grant optional site access only when you choose the corresponding function.
5. Report problems through [DropShredder GitHub issues](https://github.com/chairmantrash/DropShredder/issues). Use the report fields below and attach only scrubbed information. Removing the extension at `chrome://extensions` ends participation; no account or telemetry enrollment is required.

BUILD-INFO.json lists all51 reviewed files and productionf2ea60e2ac42f6292d60dfe6069290a1758a6905, which the prerelease tag targets. BETA-OBSERVATIONS.json records actual native/live outcomes; NATIVE-PROTOCOL.json contains80 engineering/native checks, and LIVE-PAGE-OUTCOMES.json preserves all259 targets. The accepted native/live harness is8a70b96ff030ba50c1ac83e5ae3e6d0ca18837af. DS-054/055 receipts retain original refusals and subsequent repair.

To update an existing beta, replace the contents of its unpacked folder with beta3 and click Reload in chrome://extensions.

## Actual public-site observations

The same259-target corpus now produces227 distinct successful native product extractions on47 hostnames, versus11 reports and216 privacy refusals before repair. Dormant login subtrees are excluded; activating private login/payment surfaces still refuses a scan and invalidates stale report actions.32 other targets remain unavailable/unconfirmed/navigation outcomes. All227 numerical estimates remain UNKNOWN;10 weak catalog-sale/final-sale findings and zero severe warnings.414 core tests,80 headed native checks and all seven accepted browser groups pass.

This is extraction coverage, not independent current scam/dropshipping accuracy. Historical source labels and correlated products do not prove truth or independent operators. The [ScamFerret research](workplane/research/DS-055-SCAMFERRET-RESEARCH-20261013.md) explains external evidence and API limitations; no cloud-model calls or runtime blacklist imports were added.

## What to test
Use normal public product/listing pages first. Try a mix of well-known manufacturers, ordinary resellers, marketplace listings, suspicious ads/stores, products with many reviews, and products with little information.

Pay attention to:
- whether the main verdict matches the receipts shown;
- false accusations against legitimate stores or imported products;
- copied/wrong-product/review-burst warnings;
- displayed versus adjusted visible-review rating;
- fake countdowns, repeated sale pricing and scarcity claims across repeat visits;
- shipping/return contradictions;
- exact product/source matches;
- UNKNOWN results where the page does not provide enough evidence;
- page or browser slowdown.

## Safety
Do not test DropShredder on checkout, payment, account, login, billing or order-history pages. The extension is designed to refuse those surfaces.

Do not send passwords, payment information, cookies, order details or other private information with a bug report.

## Useful bug report
Include:
1. Chrome version and operating system.
2. Store/site and product page. Remove query strings/tracking parameters before sharing the URL.
3. What DropShredder showed.
4. What looked wrong or confusing.
5. Screenshot of the DropShredder panel if it contains no private information.
6. Whether the page became slower, froze or behaved differently.

False positives are high priority. A strong accusation with weak receipts should be treated as a release-blocking defect until investigated.

## Known beta boundaries
- External investigations are explicit user actions and can depend on third-party availability.
- Missing evidence remains UNKNOWN; it is not a clean bill of health.
- Country, nationality, storefront platform and overseas fulfillment do not make a seller suspicious by themselves.
- Longitudinal warnings become more useful after the same product has been checked on separate visits.
- The beta is Chrome/Chromium Manifest V3.
