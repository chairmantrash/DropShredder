# Evaluation strategy

Primary metric: **precision of severe warnings**.

Fixture families:
- confirmed mass-resell/dropship examples;
- legitimate retailers/manufacturers/makers;
- ambiguous cases where result should remain UNKNOWN;
- adversarial cases designed to trigger naive heuristics.

Mandatory adversarial cases include:
- original artisan photo later stolen by a wholesale marketplace;
- new legitimate business with a young domain;
- legitimate retailer using Shopify;
- honest white-label/reseller;
- legitimate long fulfillment;
- real limited sale;
- malformed/no JSON-LD but legitimate product.

Every promoted strong/direct rule requires at least one positive and one negative/adversarial fixture.
