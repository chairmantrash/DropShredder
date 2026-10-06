# Evidence and verdict policy

## Evidence tiers
### A — direct
Examples: exact supplier SKU/model; same merchant identity across stores; explicit third-party fulfillment admission; older upstream listing + matching unique product identifiers/images; hard contradiction of claimed manufacturer identity.

### B — strong circumstantial
Examples: multiple independent wholesale image matches; high-confidence technical-spec fingerprint match; copied distinctive description; policy/analytics/contact clustering across storefronts; strong review-product mismatch.

### C — moderate/weak
Examples: long shipping window; new domain; generic marketing language; extreme discount; incoherent catalog; imported-review tooling; generic storefront template.

### D — informational only
Examples: Shopify/WooCommerce; CDN/provider; payment processor; country of manufacture; domain privacy.

## Severe warning gate
Use a severe automatic verdict only when:
- >= 1 Tier A + >= 1 independent corroborating B/C signal, OR
- >= 2 independent Tier B signals from different evidence families.

Never treat multiple symptoms of the same underlying observation as independent corroboration.

## Contradiction priority
Claim-vs-observation contradictions receive higher weight than generic dropship traits.

## Abstention
When evidence is insufficient or conflicting, output UNKNOWN / INCONCLUSIVE. Uncertainty is a valid result.

## Explainability
Every score contribution must link to a human-readable evidence item with source, timestamp, extraction method, and confidence.
