# DropShredder Beta Testing

This build is a beta candidate, not a claim that every store or product can be classified.

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
