# Consumer-defense scope — dropshipped and imported goods

Updated: 2026-10-06

DropShredder is not a general cybersecurity, recall, reputation, or shopping-assistant platform. Its scope is tightly limited to consumer risks that materially improve the answer to:

> Is this product likely mass-resold/dropshipped, misrepresented, low-quality/risky, or sold by a merchant exhibiting relevant consumer-harm patterns?

If a feature does not materially improve that answer, it stays out.

## Six maintainable core modules

### 1. Product provenance — P0
Purpose: recognize the same underlying commodity across rewritten listings, supplier switches, private labels, new packaging, and new photography.

Core signals:
- GTIN/UPC/EAN
- MPN/model/SKU/ASIN
- dimensions/specifications
- materials
- wattage/capacity
- variant topology
- package contents
- product handle/vendor/product type
- exact/perceptual image hashes
- first/last seen chronology
- cross-market source matches

Required false-positive controls:
- wholesale/private-label/OEM can be legitimate
- supplier images can be stolen from an original maker
- chronology and multiple independent invariants matter more than one image match

### 2. Merchant credibility — P1
Purpose: identify materially inconsistent merchant identity and relevant cross-store relationships.

Core signals:
- domain age vs explicit business-age claims
- business/support identity consistency
- repeated uncommon tracker IDs
- email/phone/address reuse
- policy/favicon hashes
- social links
- catalog overlap

Rules:
- Shopify, analytics tools, hosting/CDNs, country and ordinary SaaS use have zero accusation weight
- merchant-network relationships require independent corroboration

### 3. Manipulation detection — P0
Purpose: detect seller tactics directly relevant to misleading dropshipped/imported goods.

Core signals:
- fake/resetting scarcity
- perpetual sale/reference-price contradictions
- misleading handmade/original/local/manufacturer claims
- review provenance anomalies
- recycled/listing-swapped products
- undisclosed product identity mutation

Longitudinal evidence is preferred over one-time page heuristics.

### 4. Fulfillment reality — P1
Purpose: separate what a seller claims from how the product actually reaches the customer.

Core signals:
- explicit ships-from claims
- product-level fulfillment origin
- carrier/route observations
- return-location friction
- third-party fulfillment disclosures
- contradictions between in-house/local claims and observed fulfillment

Do not infer manufacture country from carrier routing.

### 5. Consumer complaint radar — P0/P1
Purpose: warn about merchant/product harm patterns relevant to dropshipping/imported goods.

Public sources:
- Trustpilot
- Sitejabber
- ConsumerAffairs
- BBB
- Google reviews/search
- Reddit

Complaint taxonomy:
- never arrived
- fake/invalid tracking
- wrong item
- not as described
- poor/unsafe quality
- refund refusal
- return-address friction
- surprise international return
- counterfeit allegation
- explicit dropshipping/resale allegation
- customer-service failure

Rules:
- one review source is corroborative only
- small samples do not trigger strong warnings
- multiple independent sources are required for strong merchant-risk warnings
- reputation risk never directly increases provenance/dropship likelihood

### 6. Focused safety checks — P2
Only activate for product categories where imported-product safety materially matters:
- batteries/chargers/electrical goods
- heaters
- children's products
- cosmetics
- food-contact goods
- protective equipment
- dubious medical/wellness devices

Potential public sources:
- CPSC
- Health Canada
- EU Safety Gate
- relevant openFDA data
- FCC equipment authorization
- Verified by GS1 manual lookup

Safety findings stay separate from provenance and merchant scores.

## Explicitly out of scope
- general antivirus/malware scanning
- generic phishing detection unrelated to merchant/product risk
- universal business background checks
- broad recall search for unrelated product categories
- generic shopping recommendations
- price-comparison engine unrelated to deception/provenance
- financial-credit scoring
- social-media moderation
- general corporate intelligence
- paid API dependencies required for core operation

## Architecture rule
Every external integration must be optional and replaceable.

Core operation remains:
- local-first
- zero-backend
- no account required
- no telemetry
- no paid API requirement

External public services should plug into narrow adapters so removal of one provider does not break the extension.

## Priority order

### P0
- product provenance
- source/index matching
- image/spec fingerprints
- review provenance
- fake scarcity/price chronology
- complaint radar

### P1
- merchant relationships
- fulfillment contradictions
- return-policy friction
- catalog overlap

### P2
- focused recall/certification checks for relevant risky imported-product categories only

## Verdict separation
DropShredder must continue to expose separate dimensions rather than one opaque scam score:

PROVENANCE
- original / legitimate resale / likely mass-resell / unknown

MERCHANT RISK
- normal / elevated complaints / severe multi-source complaints / unknown

MANIPULATION
- none observed / weak indicators / longitudinal contradiction / strong deception evidence

FULFILLMENT
- consistent / unclear / contradictory

SAFETY
- not checked / no known issue / concern / recall or certification conflict

This separation prevents a bad merchant reputation from masquerading as provenance evidence and prevents legitimate resale from being framed as fraud.
