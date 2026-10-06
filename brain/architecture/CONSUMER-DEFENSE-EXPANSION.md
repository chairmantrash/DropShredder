# Consumer-defense expansion roadmap — imported/dropshipped goods

Updated: 2026-10-06

Scope remains focused on dropshipping, private-label/resold imported goods, deceptive provenance, unsafe low-quality products, manipulative storefront tactics, and merchant risk.

## Core principle
A strong DropShredder verdict should answer separate questions:
1. Is this likely mass-resold/dropshipped?
2. Is the merchant misrepresenting provenance/origin/manufacture?
3. Is the product associated with safety/recall/compliance risk?
4. Is the merchant associated with substantial complaint/refund/quality problems?
5. Is the storefront using manipulative/dark-pattern tactics?
6. Is there security/phishing risk?
7. Is this legitimate resale/POD/private-label activity that should NOT be framed as deception?

## Tier 0 — local/free forever

### Product identity graph
Fingerprint:
- GTIN/UPC/EAN
- MPN/model/SKU/ASIN
- dimensions
- wattage/capacity
- materials
- variant topology
- package contents
- image hashes
- product handles/vendor/product type
- structured metadata
- first/last seen

Use to recognize one commodity after:
- AI rewrite
- private label
- packaging change
- supplier switch
- new photography
- new storefront

### Merchant relationship graph
Collect only public storefront identifiers:
- tracker/pixel IDs
- favicon hash
- policy text hash
- support email/phone/address
- social links
- theme/app signatures
- uncommon campaign parameters
- merchant/legal names

Require independent corroboration before inferring common operation.

### Dark-pattern chronology
Track:
- countdown resets
- persistent "today only"
- fake low-stock counters
- repeated reference/crossed-out prices
- perpetual sales
- fake visitor/purchase counters
- forced urgency popups

### Complaint taxonomy
Classify complaints into:
- never arrived
- fake/invalid tracking
- wrong item
- substantially-not-as-described
- poor/unsafe quality
- refund refusal
- return-address friction
- surprise overseas return
- counterfeit allegation
- dropshipping/resale allegation
- customer-service failure

Complaint presence is merchant-quality evidence, not proof of dropshipping.

### Return/refund friction detector
Parse policies for:
- customer-paid international returns
- undisclosed restocking fees
- short return windows
- return address supplied only after contacting support
- final-sale traps
- merchant discretion language
- refund only after warehouse receipt
- inconsistent return locations

### Shipping-claim contradiction engine
Separate:
- business location
- manufacture origin
- fulfillment origin
- last-mile carrier
- warehouse location

Never infer manufacture country from carrier routing alone.

### Product identity mutation history
Warn when a stable URL silently changes:
- title
- images
- specs
- variants
- seller/manufacturer
- SKU/GTIN
- product category

Useful for recycled high-review listings and supplier replacement.

## Tier 1 — public government/safety data, no paid dependency

### CPSC recall matcher
Use CPSC public Recall REST API (JSON/XML).
Match by:
- model
- product name
- UPC/identifiers
- manufacturer/importer
- image/spec clues

Safety recall should be displayed independently from dropship verdict.

### Health Canada recall matcher
Canada publishes recall/safety-alert datasets in CSV/JSON updated daily.
Useful for imported consumer goods that may not yet be in a U.S. alert.

### EU Safety Gate / public recall search
Check dangerous/noncompliant product alerts for imported consumer goods.
Prefer local cached feeds/official public datasets where available.

### FDA/openFDA
Free public API for relevant regulated products:
- devices
- cosmetics/foods where appropriate
- enforcement/recalls

API key is free and optional; unauthenticated access exists at lower limits.

### FCC equipment authorization
For electronics/radio products:
- extract claimed FCC ID
- verify ID exists in FCC equipment authorization data
- compare grantee/model data
- flag malformed/nonexistent IDs

Absence of an FCC ID is only relevant where authorization/labeling is actually required.

### GS1 GTIN verification
If GTIN/UPC is present:
- offer "Verify GTIN" action using Verified by GS1
- free public service allows up to 30 single GTIN queries per 24h
- compare assigned company/product metadata against storefront claims

Do not automate beyond public limits.

## Tier 2 — free-account optional

### ImportYeti
Use for human/user-triggered importer/supplier research.
Current free tier:
- $0
- free forever
- unlimited human search
- U.S. import data
- no credit card required for core search

High value for:
- importer/manufacturer relationships
- claimed "we manufacture this" contradictions
- supplier-network discovery
- identifying repeated importers behind different brands

Do not scrape/bypass page limits. API data beyond free search may require credits.

### urlscan.io
Optional free account/API key.
Use only user-triggered domain intelligence:
- historical page captures
- redirects
- contacted domains
- certificates/hosting
- storefront infrastructure changes

Keep security risk separate from dropship/provenance scores.

### openFDA API key
Free, not a trial.
Use if request volume eventually warrants it.
Without a key openFDA still exposes public API access at lower daily limits.

## Services NOT suitable as core dependencies

### VirusTotal Public API
Free account exists, but public API terms prohibit commercial-product use and impose strict quotas.
Do not make this a required DropShredder dependency.
Could remain a user-launched external lookup if legally appropriate.

### Google Places/Reviews
Useful review data but current API access is billing-account based.
Do not require it for a zero-cost core.
Use public Google review search launchers instead.

### Paid reverse-image APIs / paid import databases
Do not require:
- TinEye API
- commercial Google/Bing vision APIs
- ImportGenius/Panjiva-style paid datasets
Use user-triggered public search surfaces and local image fingerprints instead.

## High-priority modules

1. Safety Recall Radar
   - CPSC + Health Canada + EU Safety Gate + openFDA
2. Certification/Identifier Validator
   - GS1 + FCC
3. Import/Supplier Provenance
   - ImportYeti human-search integration
4. Return Policy Abuse Detector
5. Merchant Complaint Radar
6. Product Identity Mutation Watch
7. Dark Pattern Recorder
8. Cross-Market Product Equivalence
9. Merchant Network Graph
10. Review Provenance / Listing-Recycling Detector
11. Fulfillment Claim Auditor
12. Marketplace Saturation / Launch-Wave Detector
13. Counterfeit/Certification Claim Checker
14. Risky Product Category Rules
   - chargers/batteries
   - children's products
   - cosmetics
   - food-contact goods
   - protective gear
   - heaters/electrical goods
   - medical/wellness devices

## UI recommendation

Keep separate status cards:

PROVENANCE
- Original / legitimate resale / likely mass-resell / unknown

SAFETY
- No known alert / recall match / certification concern / unknown

MERCHANT REPUTATION
- Normal / elevated complaints / severe multi-source complaints / unknown

MANIPULATION
- None observed / urgency present / longitudinal contradiction / severe dark pattern

SECURITY
- Separate web-security/phishing risk

This prevents a bad Trustpilot rating from inflating a dropshipping accusation, and prevents a mass-resell match from being presented as a safety hazard.

## Recommended free signups
Only sign up if/when the module is implemented:
- ImportYeti — free forever human search, no credit card for core search
- urlscan.io — free account for API/search quotas
- openFDA API key — free, optional for higher public API quota

No signup needed for initial CPSC, Health Canada, FCC public data, RDAP, or manual Verified by GS1 lookups.
