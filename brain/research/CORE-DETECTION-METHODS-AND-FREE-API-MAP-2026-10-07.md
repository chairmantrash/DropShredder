# Core Detection Methods + Free/Public API Map — 2026-10-07

## Operating principle
DropShredder should collect broadly but accuse narrowly. Prefer interpretable, independently corroborated evidence. Geography, platform choice, newness, high markup, or one weak technical artifact never establish deception alone.

## 1. Review integrity
Enhance with campaign-level signals:
- rating histogram anomalies
- review-count discontinuities
- cadence regularity and bursts
- duplicate and paraphrase clusters
- review/listing chronology conflicts
- review corpus persistence across product mutation
- wrong-product/category clusters
- incentive/refund language after adversarial normalization
- rating/text contradictions
- first-party vs outside rating/complaint divergence
- reviewer-product graph features when legitimately/publicly observable
- positive and negative manipulation treated symmetrically

Verified purchase is supporting evidence only, never a trust bypass.

## 2. Product identity / clone / relabel detection
Use an evidence ladder:
1. exact GTIN/UPC/EAN/MPN/model/ASIN where applicable
2. normalized exact image hashes
3. perceptual image similarity
4. specification fingerprint
5. title/entity similarity
6. distinctive phrase/manual/packaging overlap
7. multimodal candidate similarity

Use fuzzy/multimodal matching to generate candidates. Require exact or multiple independent features for strong identity conclusions.

Future hardening:
- image crop/resize/recompression/background mutation tests
- OCR-visible model/packaging identifiers when browser-local cost permits
- specification contradiction detector
- variant-family comparison
- manual/warranty text fingerprinting
- same-image/different-brand cluster

## 3. Price manipulation
Maintain bounded local price/reference-price history per normalized product key.
Detect:
- reference price introduced at same time actual price rises
- permanent/near-permanent sale
- recurring sale reset
- claimed percentage inconsistent with visible prices
- reference price rarely/never observed as selling price
- same-product robust market-price outlier
- unit-price mismatch
- shipping-hidden effective markup

High markup alone is not fraud. Stronger finding requires commodity identity and/or misleading exclusivity/origin/quality/discount claims.

## 4. Dark patterns
Longitudinal and structural checks:
- countdown resets
- low-stock resets
- fake recent-purchase/activity messages
- forced continuity/subscription disclosure
- preselected add-ons
- basket sneaking
- hidden fees
- confirm-shaming
- cancellation obstruction
- visual interference / asymmetric choice emphasis
- urgency/scarcity persistence

One scarcity message is weak. A supposedly expiring state proven to reset is much stronger.

## 5. Merchant / storefront integrity
Hybrid feature families:
- domain/brand/title consistency
- business identity consistency
- legal/contact/address consistency
- domain chronology vs explicit business-age claim
- copied policy/about/support text
- reused product/image families
- cross-store contact/return identifiers
- public legal-entity relationships
- storefront mutation/rebrand history
- technical identifiers only as supporting edges

Never use domain age, Shopify, geography, certificate presence, or social-media absence alone as guilt.

## 6. Origin / manufacture / fulfillment claims
Represent separately:
- manufactured/made in
- assembled in
- designed in
- ships from
- warehouse
- business based in
- importer/distributor
- seller location

Contradiction engine compares explicit seller claims against independent observations. Warehouse/shipping origin never proves manufacture.

## 7. Return / fulfillment friction
Compute buyer consequence:
- overseas return at buyer expense
- hidden return address
- conflicting return pages
- restocking fee
- short return window
- final sale
- refund after remote warehouse receipt
- cancellation barriers
- delivery-window contradiction
- tracking-origin contradiction with explicit shipping claim

## 8. Quality / defect consensus
Cluster concrete failures after review-integrity filtering:
- early failure
- breakage
- overheating/fire/electrical
- battery swelling/failure
- leaks
- materials mismatch
- seam/stitch failure
- missing parts
- wrong item
- sizing inconsistency
- contamination/odor
- safety/injury

Weight recurrence, independent-source count, severity, persistence, and model specificity. Generic sentiment has little value.

## 9. Safety / regulatory intelligence
Authoritative matches are separate from ordinary reputation evidence.

### CPSC Recalls API
Public machine-readable recall data. Strong candidate for build-time/local corpus plus on-demand confirmation.
Use exact UPC/model/manufacturer where possible; fuzzy names create candidates only.

### SaferProducts.gov
Public consumer incident reports; free key path has been documented previously.
Incident reports corroborate patterns but are not equivalent to a regulatory defect finding.

### openFDA
Public APIs for drugs/devices/foods and enforcement/recall datasets. Some endpoints can be used without a key; regular use benefits from a free key.
Use category-aware matching and preserve FDA disclaimers/data limitations.

### NHTSA
Public safety/rating/VIN APIs useful for automotive products/vehicles. Do not bulk VIN query; respect NHTSA traffic controls.

## 10. Legal entity / seller identity intelligence

### GLEIF
Public API for LEI legal-entity reference and ownership data, including fuzzy name/address search.
Use to corroborate claimed legal identity and corporate relationships. Absence of an LEI means nothing for ordinary small merchants.

### UK Companies House
Public company records via authenticated API. Free account/key path; default documented rate limit 600 requests / 5 minutes.
Never embed a shared secret in the extension. Prefer user-local key or build-time/controlled research where appropriate.

### SEC EDGAR data APIs
data.sec.gov submissions and XBRL APIs require no authentication/key.
Useful only where seller/parent is a public filer. Absence is not negative evidence.

## 11. Trade context

### USITC DataWeb
Official U.S. import/export statistics; account/API key required and key expires after six months.
Contextual/aggregate only. Never infer a specific product factory from aggregate trade statistics.

### UN Comtrade
Aggregate international trade context. Same limitation: plausibility/context, not product-level manufacture proof.

## 12. Open product identity

### Open Food Facts
Free/open product API and downloadable database; ODbL/database-content licensing and attribution obligations must be honored. Current docs state read-product API limits and recommend bulk downloads for larger use.
Useful for food identity/ingredients/barcodes and potentially related Open Products/Beauty/Pet Food datasets.
Community data is not authoritative by itself.

## 13. Threat-list licensing caution
Google Safe Browsing free API is explicitly non-commercial. Do not make it a commercial DropShredder dependency. A commercial Google threat product would violate the no-paid-dependency goal if required.

## API deployment policy
Classify every source:
A. bundled/build-time corpus: best privacy/latency; verify redistribution/license/update cadence
B. keyless on-demand: cache, timeout, rate-limit, send minimum query data
C. free-key on-demand: never bundle developer secrets; user-local key or non-runtime research/build process
D. contextual research only: cannot support product-specific verdicts

No API result bypasses evidence semantics. Name similarity is not identity. No-result is not innocence.

## Recommended implementation order
1. campaign-level review analysis + adversarial fixtures
2. price/reference-price longitudinal detector
3. dark-pattern reset/history detector
4. semantic origin split (made/assembled/designed/ships/from)
5. exact-first regulatory matcher and CPSC corpus compiler
6. merchant identity graph using legal/contact/product/image edges
7. product identity fingerprint improvements
8. API adapters behind strict timeout/cache/privacy interfaces
9. category-specific quality models
10. cross-detector adversarial mutation suite

## Primary/current research basis
- FTC Consumer Reviews and Testimonials Rule / platform guidance
- CPSC Recalls API
- openFDA APIs
- SEC EDGAR data APIs
- GLEIF API
- UK Companies House API guidelines
- NHTSA API use policy
- USITC DataWeb API
- Open Food Facts API/license docs
- Park, Xie & Xie, Marketing Science: price increase framed as discount
- 2025 e-commerce fraud feature comparison
- 2025/2026 phishing feature-engineering and dark-pattern detection research
