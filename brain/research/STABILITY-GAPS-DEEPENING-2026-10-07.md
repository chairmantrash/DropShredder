# DropShredder Stability Gaps — Deepening Plan (2026-10-07)

## Definition of stable
A detector is not stable because it has many rules. It is stable when:
- semantics are explicit
- missing data is represented as unknown
- correlated evidence is capped
- adversarial mutations are tested
- legitimate controls exist
- runtime work is bounded
- customer claims do not exceed evidence
- external data has provenance, freshness and licensing rules
- performance/privacy failure degrades gracefully

## Ground truth and calibration
Create labeled fixture families rather than invented probability claims:
- legitimate direct manufacturer
- legitimate private label
- legitimate dropshipper with honest disclosure
- deceptive relabel/resell
- review manipulation
- product mutation/review hijack
- legitimate migration/rebrand
- legitimate promotion/review burst
- fake scarcity/reset
- ordinary real sale
- recalled exact product
- fuzzy recall lookalike
- legitimate new business/domain
- conflicting seller identity
- syndicated review feed

Track confusion matrix by detector and final verdict. Until sufficient labeled cases exist, numeric confidence means evidence strength, not empirical probability.

## Product identity
Hierarchy:
GTIN > brand+MPN > variant/group identifiers > exact image > perceptual image > specs > distinctive text > generic title.
Fuzzy methods generate candidates; they do not establish identity alone.
Add mutation fixtures for crop, resize, recompression, background, brand rename, reordered specs and punctuation.

## Source independence
Every evidence item should carry:
- source key
- lineage/provider key
- evidence family
- independence key
- observed timestamp
Five websites syndicating the same review feed count as one lineage. Multiple observations derived from the same page payload should not masquerade as independent corroboration.

## Longitudinal state
Bounded history should preserve meaningful deltas:
- price/reference price
- review count/rating
- product fingerprint
- seller/legal identity
- return policy fingerprint
- scarcity/countdown state
- stock/activity claims
- shipping/origin claims
- variant structure
Use change points rather than unlimited snapshots.

## Reviews
Separate:
- review-level suspicion
- campaign-level manipulation
- product-level adjusted rating
- integrity-filtered low-star complaint consensus
- outside-source discrepancy
Verified purchase is not a bypass. Analyze positive and negative manipulation symmetrically. Do not claim percent real; show percent passed current checks.

## Merchant graph
Typed edges only:
- exact legal identity
- exact contact
- exact return address
- product identifier
- image family
- policy/template fingerprint
- disclosed parent
- public corporate relationship
- technical identifier
Common providers/payment processors/analytics are weak edges. Ownership requires multiple meaningful edges or authoritative corporate data.

## Origin claims
Separate made/manufactured, assembled, designed, ships from, warehouse, business based in, importer/distributor.
Add implied-claim candidate extraction from net impression, but symbols/address alone remain insufficient.
Contradiction requires explicit/implied seller claim plus independent observation.

## Pricing
Longitudinal:
- price rise framed as discount
- reference price persistence
- permanent sale
- variant bait
- unit price
- shipping-inclusive effective price
- same-product robust market comparison
High markup is not fraud by itself.

## Dark patterns
Stateful:
- timer reset
- stock reset
- recent-purchase/activity replay
- hidden subscription/continuity
- preselected add-ons
- basket sneaking
- fee reveal
- cancellation obstruction
- asymmetric/obscured choices
Visual claims require DOM/style/layout evidence; avoid pure color-only conclusions.

## Returns and checkout
Stay out of credentials/payment fields. Analyze public/pre-payment policy and cart state only when user explicitly invokes eligible checks.
Compare return pages, product-page promises and structured merchant-return markup.
Estimate consequence only when carrier/rate evidence is reliable; otherwise say buyer-paid international return, not invented dollar cost.

## Safety
Unify CPSC, openFDA, FSIS and NHTSA into normalized records:
authority, recall ID, date, manufacturer, brand, model, identifiers, category, hazard, remedy, URL.
Exact identifier or manufacturer+model can escalate. Fuzzy names only produce candidates.
Consumer incident reports are corroboration, not regulatory defect findings.

## Legal identity
GLEIF: authoritative LEI reference/ownership where applicable.
SEC EDGAR: public filers only.
Companies House: UK entities with authenticated free API.
ITA CSL/OFAC: restricted-party screening requires identity due diligence; fuzzy hit is never accusation.
No registry result is negative evidence for ordinary small merchants unless the seller explicitly claims that registration/status.

## Certifications and authority claims
Future category adapters:
- FDA approval/clearance/registration semantics
- UL certification/listing where publicly verifiable
- FCC equipment authorization where applicable
- organic certification where official public data supports it
- energy-efficiency registries
A logo image is a claim, not verification.

## Internationalization
Keep detectors language-neutral where possible: identifiers, time, prices, graph edges, images, structured data.
Move text rules into language packs. Unknown language should reduce coverage, not increase risk.
Never use language/country as negative evidence.

## Performance
Budget tiers:
0 synchronous extraction
1 local bounded analysis/history
2 cached public-data lookup
3 explicit Deep Hunt
No unbounded page crawling or O(n^2) work above hard caps. Review pair comparisons remain bounded. Image work downsampled and candidate-limited.

## Security/privacy
Least privilege and optional host access. No credentials/payment collection. No remote executable code. Minimize query data sent to APIs. Cache only necessary normalized evidence. Keep side-panel UI isolated from page DOM.

## Public/free data deployment
Prefer downloadable/build-time corpora when licensing/update size permits.
Keyless APIs: timeout/cache/minimize queries.
Free-key APIs: never embed shared secrets in public extension.
Restricted-party/fuzzy entity APIs: candidate only until identity corroborated.
Record freshness and source authority for every imported dataset.

## Release gates
- deterministic tests
- adversarial mutation tests
- legitimate control fixtures
- data lint
- permission/security audit
- latency/memory budget
- current-browser smoke test
- exact-head CI + CodeQL
- no public merge without owner authorization
