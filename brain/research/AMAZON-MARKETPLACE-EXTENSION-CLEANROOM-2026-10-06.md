# Amazon / marketplace extension clean-room analysis — 2026-10-06

Source: owner-supplied installed Chrome extension packages. Static inspection only. Do not redistribute proprietary source code, private datasets, authentication material, or subscription-gated data.

## Batch received

17 packaged extensions were present:
- AMZBase 1.2.3
- AMZScout PRO 2.5.6.9
- AiPrice / AliPrice 4.0.9
- Amazon Review Analyzer 2.0.0
- Amazon Shopping Companion 1.0.0
- BulkASIN 2.0.4
- Helium 10 8.43.5
- Jungle Scout 9.2.9
- Keepa 5.69
- Knockoff 1.5.2
- Papaya Shopping Pal 4.0.1.0
- ProductLens
- SameSame 5.2.3
- SellerAmp QVS 0.0.4
- SellerAmp SAS
- SellerLens
- SellerSprite 5.0.6

The expected Listing Detective package was not present in the uploaded archive. No conclusion should be drawn about it from this batch.

## Cross-tool consensus

Independent extensions repeatedly converge on the same durable Amazon product-identity workflow:

1. extract ASIN and parent/variation relationships;
2. identify seller / merchant and apparent brand;
3. recover stable identifiers when present (UPC/EAN/GTIN);
4. collect price, rating, review count, dimensions, materials and technical specifications;
5. traverse search results or seller storefront catalogs;
6. collapse duplicate/variant listings;
7. compare images or launch visual/source searches;
8. add price/listing/review chronology;
9. correlate Amazon products with AliExpress / Alibaba / 1688 / Temu or other source markets.

DropShredder should implement this architecture independently rather than rely on brand names, ASINs or listing text as product identity.

## Highest-value findings

### BulkASIN — image-family de-duplication
BulkASIN explicitly removes product variants by normalizing the primary Amazon image identity and collapsing distinct ASINs that share that underlying image asset. It also merges ASINs across multiple Amazon search-result tabs.

Clean-room lesson:
- Amazon's CDN image identity is a strong zero-backend equivalence primitive.
- Distinct ASINs sharing one underlying primary image can be clustered immediately on search pages.
- Same-image clustering must remain contextual because legitimate variants can share imagery.
- Cross-brand reuse of the same image family is substantially more interesting than same-brand variation reuse.

Implemented:
- `normalizeAmazonImageFamily`
- search-result ASIN image-family clustering
- `AMAZON_COMMODITY_CLONE_CLUSTER` evidence
- price-spread display within a visible clone family

### Knockoff — pseudo-brand filtering without nationality scoring
Knockoff uses a layered model:
- user allow/block choices;
- curated known/established-brand corpus;
- seed suspicious-brand corpus;
- brand-name structural heuristics;
- unbranded/generic-title handling;
- rating/review thresholds.

Its code comments explicitly warn that established brands can look like gibberish and that local-language text must not be treated as "foreign = bad."

Clean-room lesson:
- brand legitimacy should be modeled separately from seller/manufacturing country;
- heuristics need allowlisted established-brand exceptions;
- generic/unbranded and pseudo-brand classifications should be consumer context, not fraud proof;
- Amazon brand extraction should prefer structured/byline/store URLs over guessing the first word of the title.

Do not copy Knockoff's proprietary/bundled lists. If DropShredder eventually ships a brand corpus, build it from public, independently licensed sources and maintain freshness/provenance.

### Papaya Shopping Pal — origin + alternatives + dark patterns
Papaya has dedicated Amazon extraction plus:
- GTIN/UPC/EAN discovery;
- seller/product country context;
- Google/reverse-product search;
- AliExpress/Alibaba/Temu surfaces;
- alternative-product finding;
- dark-pattern detection;
- price-history concepts.

Clean-room lesson:
- seller country, product country-of-origin and fulfillment country must remain separate;
- unique identifiers should become automatic source-search pivots;
- reverse product search should prefer GTIN/UPC/EAN when available, then image/spec invariants;
- dark-pattern detection belongs beside, not inside, provenance scoring.

### SellerSprite — variation, seller and 1688 intelligence
SellerSprite exposes:
- all variation ASINs;
- parent/child variation sales context;
- seller count;
- seller storefront analysis;
- brand counts;
- review analysis;
- price/history intelligence;
- 1688 integration;
- Amazon Seller Central surfaces;
- image/review/product research tooling.

Clean-room lesson:
- variation topology is a valuable product fingerprint;
- storefront brand distribution and catalog overlap can reveal operator behavior;
- 1688 should be a first-class upstream-source pivot;
- parent/child ASIN identity should be separated from physical-product equivalence.

### SellerAmp QVS / SAS
QVS extracts search-result product details including ASIN/variation/brand/UPC-related fields.
SAS contains Amazon parsing, image context actions, price-history/Keepa concepts and arbitrary-page-to-Amazon product matching workflows.

Clean-room lesson:
- build one Amazon card parser usable on search pages and detail pages;
- retain UPC/EAN when visible;
- provide context-menu/product-page actions to search Amazon for an external product and vice versa.

### AMZBase
AMZBase has lightweight Amazon DOM/data extraction, including ASIN, brand, UPC/manufacturer/seller/offer data and outbound comparison/search surfaces.

Clean-room lesson:
- keep a minimal, resilient DOM fallback layer independent from heavier Amazon adapters;
- extract manufacturer separately from brand and seller;
- use stable fallbacks because Amazon DOM layouts change.

### SameSame / AiPrice-AliPrice / ProductLens
These tools emphasize image-led equivalence across Amazon and external marketplaces. SameSame explicitly supports Amazon, Temu and AliExpress; AiPrice/AliPrice spans 1688/AliExpress/Temu and other markets.

Clean-room lesson:
- image equivalence must be first-class;
- preserve local hashes and normalized source-image identity;
- external visual search is a user-triggered augmentation, not the only equivalence engine;
- cross-market equivalent products matter even when titles/descriptions are rewritten.

### Keepa
Keepa demonstrates how valuable ASIN chronology, price history, offer/seller history and Amazon-specific product timelines are.

Clean-room lesson:
- DropShredder should retain its own local observations even without Keepa;
- price-history and seller/listing mutation are stronger longitudinal evidence than one-time markdown labels;
- an optional external Keepa lookup may be useful but must not become a paid/core dependency.

### Helium 10 / Jungle Scout / AMZScout
The mature seller-research extensions consistently expose:
- ASIN grabbers;
- seller/market analysis;
- brand/variation data;
- review insights;
- seller-country/origin concepts;
- product/spec/category metrics;
- competitor/duplicate intelligence.

Clean-room lesson:
- Amazon scan mode should support both detail-page and result-page datasets;
- seller and catalog context are important alongside product identity;
- preserve category context because identical commodity behavior is especially common in furniture, pet goods, storage, lighting, kitchen, small electronics/accessories and generic household goods.

## Amazon-specific DropShredder priorities

### P0 — Commodity clone clusters
Detect:
- same normalized Amazon primary-image family across multiple ASINs;
- same/near-identical perceptual image hashes;
- matching technical/spec fingerprints;
- matching dimensions/materials/package contents;
- distinct apparent brands/sellers;
- price spread across equivalent listings.

Consumer-facing framing:
"These listings appear to represent the same or closely related physical commodity under multiple marketplace identities."

Do not claim counterfeit/fraud from clone membership alone.

### P0 — Variation topology
Capture:
- ASIN
- parent ASIN when recoverable
- child/variation ASINs
- variant dimensions
- seller
- brand
- manufacturer
- UPC/EAN/GTIN

A true Amazon variation family should be distinguished from unrelated cross-brand clones.

### P0 — Cross-market source hunt
Search in order:
1. GTIN/UPC/EAN/model identifiers;
2. exact/near image identity;
3. technical fingerprint;
4. dimensions/materials/package contents;
5. rewritten title keywords.

Prioritize:
- 1688
- Alibaba
- AliExpress
- Temu
- DHgate
- Made-in-China.com
- Global Sources

### P1 — Seller/storefront clustering
Record:
- seller identity;
- seller storefront;
- number/distribution of apparent brands;
- exact/shared product fingerprints within seller catalogs;
- cross-seller duplicate commodities.

Do not infer common ownership solely from similar catalogs.

### P1 — pseudo-brand / generic-brand context
Potential future module:
- distinguish established public brands from low-information/pseudo-brand identities;
- use public/licensable brand sources;
- heuristics alone remain weak;
- nationality/language/country never counts negatively.

### P1 — review defect aggregation
For clone clusters, compare whether the same physical-product complaints recur across different brand/ASIN identities:
- breakage;
- instability;
- misleading dimensions;
- fabric/material quality;
- battery/charger failures;
- unsafe overheating;
- missing parts;
- durability failures.

Repeated defect themes across apparently different brands are stronger evidence that the physical commodity is shared.

## False-positive controls

- Same image can represent legitimate Amazon variations.
- Shared OEM/private-label products are legal and common.
- Multiple retailers may legitimately sell the same manufacturer product.
- Similar dimensions are weak unless combined with other invariants.
- Amazon seller location does not establish manufacture origin.
- Amazon fulfillment does not establish merchant/manufacturer country.
- Chinese or other foreign ownership/manufacture is not negative evidence.
- Brand unfamiliarity is not proof of low quality.
- Price spread is consumer context, not fraud evidence.

## Clean-room boundaries

Do not copy:
- proprietary brand allow/block lists;
- paid API responses;
- subscription datasets;
- private seller research results;
- proprietary scoring weights;
- extension source code.

Safe to independently reproduce:
- public DOM/structured-data extraction;
- ASIN/GTIN/UPC/EAN parsing;
- Amazon CDN image normalization as a general observable URL property;
- perceptual image hashing;
- variation/seller/brand relationships visible on public pages;
- local historical observations;
- public marketplace/source search pivots.

## Missing package

Listing Detective was expected but absent from the uploaded ZIP. Revisit only if later supplied; do not block current implementation on it.
