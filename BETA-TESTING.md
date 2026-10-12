# DropShredder Beta Testing

DropShredder 0.2.0 beta 2 is an experimental public beta for Chrome/Chromium. Accuracy, native-language/legal-copy, original-photo and broader lifecycle validation are ongoing beta work. There is no claim that every store or product can be classified.

## Download and install

Use the [beta 2 release](https://github.com/chairmantrash/DropShredder/releases/tag/v0.2.0-beta.2), and download `DropShredder-0.2.0-beta.2-chrome.zip` plus `SHA256SUMS.txt`. The release is published only after exact-artifact/native/public-site checks and exact-head CI/CodeQL pass.

1. Verify ZIP SHA256 `7fda25e48d7b5645140d9cda3fb4e3cd213fa659fdccfc4fecac2064955492b8` (PowerShell: `Get-FileHash .\DropShredder-0.2.0-beta.2-chrome.zip -Algorithm SHA256`; macOS/Linux: `shasum -a 256 DropShredder-0.2.0-beta.2-chrome.zip`).
2. Extract the ZIP into a folder you will keep. Its root contains `manifest.json`.
3. Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select that folder.
4. Open a normal public product page, click the DropShredder extension icon, and use the side panel. Grant optional site access only when you choose the corresponding function.
5. Report problems through [DropShredder GitHub issues](https://github.com/chairmantrash/DropShredder/issues). Use the report fields below and attach only scrubbed information. Removing the extension at `chrome://extensions` ends participation; no account or telemetry enrollment is required.

`BUILD-INFO.json` lists all 51 reviewed package files and production source `6fe561807d6962fe51006eab99c0cf7017c2c6ee`. `BETA-OBSERVATIONS.json` contains actual bounded public-site results; `NATIVE-PROTOCOL.json` contains the full engineering/native run. Unavailable sites/provider timeouts are recorded without a pass claim. The prerelease tag points to exact accepted/tested head c5326c7e7aa3deddae5cd2d2bf434fc739339e48; BUILD-INFO records the production source of those identical compiled bytes. DS-050/051/052 receipts preserve the original full matrix, initial failures and subsequent repairs.

To update an existing beta1 installation, replace the contents of its unpacked folder with beta2 and click Reload in chrome://extensions.

## Actual known-site observations

The predeclared six-page run found Warmly factory-direct statements and the HaremPants/Sure Design affiliation. It exposed a missing visible HaremPants SKU; beta2 captures GPH42-Black without choosing an ambiguous structured offer. After repair,24 known checks have16PASS/8UNAVAILABLE/0FAIL; both selected UntilGone pages returned404.84 native checks and408 core checks pass. Numeric dropship/resell estimates remain UNKNOWN. This is a small selected/correlated sample with exposed affiliate controls, not independent accuracy acceptance.

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
