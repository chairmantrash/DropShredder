# Amazon and Walmart marketplace policy baseline — 2026-10-06

## Amazon
Amazon's current seller policy permits drop shipping only when the Amazon merchant remains clearly identified as the seller of record. Third-party packaging, invoices, or seller identity that expose another seller/drop shipper can violate policy.

Detection consequence:
- "dropshipped" is not synonymous with "Amazon policy violation";
- seller-of-record and packaging/fulfillment identity are separate from product provenance;
- Amazon's "Sold by" / "Ships from" fields are context, not accusation evidence;
- generic/private-label provenance analysis should focus on product identifiers, cross-listing matches, chronology, review integrity, and merchant identity.

Sources:
- https://sellercentral.amazon.com/help/hub/reference/external/G201808410
- https://sellercentral.amazon.com/seller-forums/discussions/t/3b745ef7b97535de86e4a6fb8ca2bc60

## Walmart Marketplace
Walmart's Business Information Policy requires current seller business information and states that business name/contact information can be visible on seller pages. It also addresses disclosure when a seller uses a third-party seller to supply an item. Walmart maintains separate policies for shipping, identifiers, reviews, duplicate listings, and product details.

Detection consequence:
- capture the displayed Marketplace seller identity for correlation and reputation/business verification;
- seller status alone has zero accusation weight;
- future Walmart Deep Hunt should compare displayed seller/business information with public records and cross-store identity reuse;
- third-party supply/fulfillment is not equivalent to deceptive provenance without additional evidence.

Sources:
- https://marketplacelearn.walmart.com/guides/Policies%20%26%20standards/Account/Business-information-policy
- https://marketplacelearn.walmart.com/guides/Policies%20%26%20standards/Account/Walmart-Marketplace-seller-retailer-policies
