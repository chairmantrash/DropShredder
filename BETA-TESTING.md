# DropShredder Beta Testing

DropShredder 0.2.0 beta 5 is an experimental public beta for Chrome/Chromium133 or later. Accuracy, native-language/legal-copy, original-photo and broader lifecycle validation are ongoing beta work.

## Download and install

Use the [beta 5 release](https://github.com/chairmantrash/DropShredder/releases/tag/v0.2.0-beta.5), and download `DropShredder-0.2.0-beta.5-chrome.zip` plus `SHA256SUMS.txt`.

1. Verify ZIP SHA256 `17f5ae153b5c745e5488d4d81e12ad1864a3a4d4ffbb8f97da71e0b5df54ca3c` (PowerShell: `Get-FileHash .\DropShredder-0.2.0-beta.5-chrome.zip -Algorithm SHA256`; macOS/Linux: `shasum -a 256 DropShredder-0.2.0-beta.5-chrome.zip`).
2. Extract the ZIP into a folder you will keep. Its root contains `manifest.json`.
3. Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select that folder.
4. Open a normal public product page, click the DropShredder extension icon, and use the side panel. Grant optional site access through the displayed Chrome controls.
5. Report problems through [DropShredder GitHub issues](https://github.com/chairmantrash/DropShredder/issues). Use the report fields below and attach only scrubbed information. Removing the extension ends participation; no account or telemetry enrollment is required.

To update an existing unpacked beta, disable the extension and back up its folder. Replace that folder's contents with beta5, then reload and re-enable the existing extension. Keeping the same folder path preserves its extension ID and local data.

BUILD-INFO.json lists all54 reviewed package files and production/tag source `ae94718c310fdf253fcfbef156fc49b30bb4a8d9`. The exact tested CI ZIP was reused without rebuilding. All7 public assets were independently downloaded without authentication and byte/hash verified. NATIVE-PROTOCOL.json records87 headed native checks; LIVE-PAGE-OUTCOMES.json preserves all268 target outcomes. Accepted native harness `aa84acc6207340755ffb55b5c8d956995f57b504`; six complete original live profiles use `bbbed82e5027e26a9fae5fbf4c845732fde4e722` and corrected profiles1/4 use the accepted harness, all with identical package bytes.

## Actual public-site observations

The full268-target repeat produced230 distinct successful native product scans across54 hostnames,38 pages with positive-weight evidence,25 commerce-unconfirmed pages,4 unavailable/challenge pages,8 navigation/environment errors and1 redirected/private-surface refusal. Scan, policy and shipping each have230 recorded action outcomes. Explicit manufacturer-code reports increased from0 to10; the visible GW3773 manufacturer-code row is retained by the native scan. There were zero severe warnings, native privacy refusals, uncaught panel errors or profile safety stops.440 core tests,87 headed native checks,all seven browser groups and complete finding-free CodeQL pass.

All230 numerical dropshipping/resale estimates remain UNKNOWN. These results measure function and extraction coverage. Historical source labels, correlated products and weak evidence findings do not establish current scam truth or a validated detection rate. The [live acceptance report](workplane/research/DS-058-LIVE-BETA-ACCEPTANCE-20261016.md) retains the before/after comparison and initial collector failures.

Open **Outside reports and consumer records** to explicitly request published historical research or existing security results. Those results stay inside the panel with source/date/scope; they do not change local product scores or submit a site for scanning. Actual historical lookup returned two dated records; urlscan HTTP403 remains an error. New reputation navigation uses Trustpilot, BBB and government originals. Missing or favorable outside data is not evidence of merchant delivery, product safety or legitimacy. [Primary-source research](workplane/research/DS-056-EXTERNAL-RESULTS-AND-DETECTION-20261013.md) records provider/API limitations.

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
