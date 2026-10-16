# DropShredder Beta Testing

DropShredder 0.2.0 beta 6 is an experimental public beta for Chrome/Chromium133 or later. Accuracy, native-language/legal-copy, original-photo and broader lifecycle validation are ongoing beta work.

## Download and install

Use the [beta 6 release](https://github.com/chairmantrash/DropShredder/releases/tag/v0.2.0-beta.6), and download `DropShredder-0.2.0-beta.6-chrome.zip` plus `SHA256SUMS.txt`.

1. Verify ZIP SHA256 `83d3a687f02de89bfa57ddbf5113d81cc919852c9dba568b44c1e502e400d43b` (PowerShell: `Get-FileHash .\DropShredder-0.2.0-beta.6-chrome.zip -Algorithm SHA256`; macOS/Linux: `shasum -a 256 DropShredder-0.2.0-beta.6-chrome.zip`).
2. Extract the ZIP into a folder you will keep. Its root contains `manifest.json`.
3. Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select that folder.
4. Open a normal public product page, click the DropShredder extension icon, and use the side panel. Grant optional site access through the displayed Chrome controls.
5. Report problems through [DropShredder GitHub issues](https://github.com/chairmantrash/DropShredder/issues). Use the report fields below and attach only scrubbed information. Removing the extension ends participation; no account or telemetry enrollment is required.

To update an existing unpacked beta, disable the extension and back up its folder. Replace that folder's contents with beta6, then reload and re-enable the existing extension. Keeping the same folder path preserves its extension ID and local data.

BUILD-INFO.json lists all 54 reviewed package files and production/tag source `5bdd16f282bae1aff9b2193f9c98b3fca1e89737`. The exact accepted CI ZIP was reused without rebuilding. All seven public assets were independently downloaded without authentication and byte/hash verified. NATIVE-PROTOCOL.json records 94 headed native checks; LIVE-PAGE-OUTCOMES.json preserves all 269 actual outcomes. All eight live profiles and the native protocol use accepted harness `0167f5b8a9beae6d87deed65c42593aaa043c690` with identical compiled package bytes.

## Actual public-site observations

The complete 269-target run produced 236 distinct successful native product scans across 56 hostnames, 39 pages with positive-weight evidence, 18 commerce-unconfirmed pages, four unavailable/challenge pages, nine navigation/environment errors and two private URLs refused before navigation. Scan, policy and shipping each have 236 recorded action outcomes. There were zero severe warnings, native privacy refusals, uncaught panel errors or profile safety stops. All 459 core tests, 94 headed native checks, seven browser groups and complete finding-free CodeQL pass.

The latest repairs retain brand/material from an unambiguous connected ProductGroup, recover explicit public Microdata identifiers, bind a sole selected variant Offer, and require actual timestamps/clock evidence for a resetting-countdown finding. The real vivo variant now retains declared brand, SKU 11677981 and 479 PHP with its Product/Offer resolved. Static low-stock wording no longer produces a countdown-reset warning. All numerical dropshipping/resale estimates remain UNKNOWN. The original 268 targets alone produce 235 successful scans/55 hosts versus 230/54; changing public availability and collector admission also affect coverage. Historical source labels, correlated products and weak findings do not establish current scam truth or a validated detection rate. The [research and retest report](workplane/research/DS-059-IMPLEMENTED-AND-RETESTED-20261016.md) retains exact identities, same-cohort comparison and original startup failure/retry.

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
