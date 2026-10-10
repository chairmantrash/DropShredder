# DropShredder Scam + Low-Quality Detection Architecture — 2026-10-06

## Goal
Build a wide-net, adversary-resistant shopping analysis engine while keeping harsh verdicts evidence-gated. No detector is infallible. Optimize separately for high recall in evidence collection and high precision in final accusations.

## Core doctrine
1. Wide net on collection; conservative verdict gate.
2. Country/nationality/overseas origin alone has zero negative weight.
3. Independent evidence families matter more than raw signal count.
4. Exact identifiers beat fuzzy similarity.
5. Time is evidence: repeated/reset claims are stronger than one snapshots.
6. Graph relationships survive superficial rebranding.
7. Always test a plausible innocent explanation before escalating.
8. Strong claims must expose short, understandable receipts.
9. Treat every detector as adversarially targetable.
10. Missing data is unknown, never proof of innocence or guilt.

## Detection ensemble

### A. Product identity / clone detector
Use layered matching:
- GTIN/UPC/EAN/MPN/ASIN/SKU exact matches.
- normalized image SHA-256 for exact reuse.
- perceptual image hash for resize/crop/compression tolerance.
- local visual embedding candidate matching when performance/package budget permits.
- normalized title token similarity.
- specification-vector similarity: dimensions, materials, capacity, wattage, included parts.
- distinctive phrase reuse.
- variant/option overlap.
- packaging/manual/warranty text overlap.

Escalation requires multiple independent identity features unless an exact globally meaningful identifier matches.

### B. Listing mutation detector
Track locally over time:
- product identifiers
- title/category
- hero images
- technical fingerprint
- variant structure
- review count/rating
- seller claims
- price/reference price

Flag when the same URL materially changes product identity while retaining reviews/history.

### C. Merchant relationship graph
Nodes:
- domains
- legal/business names
- contact emails/phones
- return addresses
- product identifiers
- image families
- analytics/tracking IDs when lawfully visible
- payment processors (processor presence only)
- support text/templates
- social accounts
- supplier/marketplace listings

Edges are typed and confidence-scored. Do not infer common ownership from one weak edge. Repeated independent edges can reveal store clusters and rebrands.

### D. Review manipulation detector
Fuse:
- rating distribution
- verified-purchase share when available
- temporal bursts
- near-duplicate wording
- repeated unusual phrases
- review dates predating listing
- wrong-product/category mentions
- incentive disclosures
- store-vs-external rating gap
- review-count discontinuities over time
- sentiment/detail mismatch
- reviewer graph/behavior only when public and legitimately available

Do not use AI-text detection alone as proof. LLM-generated and genuine reviews overlap too much.

### E. Defect consensus / low-quality detector
Extract concrete defect aspects instead of generic negative sentiment:
- breakage/failure
- overheating/fire/electrical
- battery failure/swelling
- leaking
- material mismatch
- stitching/seam failure
- sizing/fit inconsistency
- coating/finish failure
- odor/contamination
- missing parts
- counterfeit/not-as-described
- early-life failure
- injury/safety incident

Cluster semantically similar complaints, deduplicate copied reviews, then score:
- recurrence count
- share of substantive reviews
- independent-source count
- severity
- time persistence
- model/variant specificity

A repeated concrete failure across independent sources is much stronger than many generic one-star reviews.

### F. Safety / recall matcher
Sources:
- CPSC recalls
- SaferProducts public incident reports
- openFDA recall/enforcement/device datasets where category applies

Matching ladder:
1. exact UPC/GTIN/model/catalog identifier
2. manufacturer + exact model
3. brand + model + category
4. fuzzy name/category candidate for manual/secondary confirmation only

Never label a product recalled from fuzzy text similarity alone.

### G. Claim contradiction engine
Represent claims separately:
- made/manufactured in
- assembled in
- designed in
- ships from
- business based in
- warehouse location
- material/composition
- handmade/artisan
- certification/safety
- warranty
- business age
- original/reference price

Compare explicit seller claims with independent observations. Contradiction is much stronger than geography itself.

### H. Dark-pattern / pressure detector
Detect and longitudinally test:
- countdown reset
- low-stock number reset
- fake activity/social-proof messages
- permanent sale
- reference-price inflation
- preselected add-ons
- hidden recurring charges
- basket additions
- hard-to-find cancellation/returns
- buried fees
- confirm-shaming

One-time urgency copy is weak. A timer/stock/sale claim proven to reset becomes strong.

### I. Price / markup intelligence
For strong product matches:
- normalized unit price
- shipping-adjusted price
- median/trimmed market price
- robust z-score / MAD outlier
- same-product price ratio
- price history
- reference-price persistence

High markup alone is not fraud. High markup + hidden commodity identity + misleading exclusivity/origin/quality claims is materially stronger.

### J. Return-friction detector
Score concrete buyer cost:
- international return at buyer expense
- hidden return address
- restocking fee
- very short window
- final-sale language
- refund only after remote warehouse receipt
- conflicting policy pages
- cancellation barriers

Present expected consequence, not jargon.

## Fusion model
Do not simply add every signal. Use evidence-family caps and independence gates.

Suggested internal families:
identity, product-match, claims, reviews, quality, merchant-network, pricing, dark-patterns, fulfillment, returns, safety, regulatory.

Verdict stages:
- CLEAN SO FAR: no meaningful evidence.
- SMALL FLAGS: weak/circumstantial evidence only.
- SUSPICIOUS: one meaningful family or several weak independent families.
- STRONG RED FLAGS: multiple independent strong families.
- CONFIRMED SLOP: objective commodity/resell/dropship conclusion supported by strong product identity plus seller/listing evidence.
- DECEPTIVE / SCAM-LIKE: reserve for strong evidence of intentional misleading conduct, not merely dropshipping or markup.
- KNOWN SAFETY ISSUE / RECALL: only exact/high-confidence regulatory match.

Harsh tone is downstream of confidence. Never let tone change scoring.

## Anti-evasion test suite
For every detector create mutations:
- title synonym/reordering
- Unicode/homoglyph/spacing changes
- image resize/crop/recompress/background change
- query-string/domain/path changes
- brand rename
- reordered specs
- review paraphrase
- review timestamps shifted
- timer wording changed
- origin claim moved to image/FAQ
- return-policy euphemisms
- identifiers formatted with spaces/hyphens
- missing-field cases
- benign lookalikes

Measure detector recall after each mutation and false positives against legitimate controls.

## Performance architecture
Tier 0: synchronous local extraction, bounded.
Tier 1: local history and exact matching.
Tier 2: cached public-data checks on demand.
Tier 3: user-triggered Deep Hunt / expensive comparison.

No per-page unbounded crawling. Cache by normalized domain/product key. Deduplicate work. Use bounded candidate sets and timeouts.

## Research basis
- 2026 cross-view graph fraud research: relational/profile-behavior fusion improves fraud detection and works with sparse labels.
- 2026 fake-review survey: text, behavior, temporal metadata, graphs, multimodal and external knowledge should be fused; uncertainty and adversarial robustness remain key.
- 2025 counterfeit research: multimodal/text feature fusion improves detection of evasive counterfeit naming.
- FTC fake-review rule: fake/false reviews, sentiment-conditioned incentives, undisclosed insiders, fake independent review sites and review suppression are concrete deceptive practices.
- FTC dark-pattern guidance: deceptive timers, hidden terms/fees and manipulative choice architecture are established consumer-protection concerns.
- CPSC/SaferProducts/openFDA: authoritative safety/recall/incident data can support exact or strongly corroborated product safety findings.
- NIST AI 100-2e2025: evasion and poisoning must be treated as explicit adversarial risks.

## Explicit non-goals
- no nationality score
- no accusation from Shopify/review platform/supplier platform alone
- no fake-review verdict from writing style alone
- no recall verdict from fuzzy name alone
- no ownership claim from one shared technical artifact
- no paid API dependency
- no mandatory backend
- no telemetry or credential collection
