# DropShredder full-spectrum scope and redundancy audit — 2026-10-07

## Product boundary
DropShredder's default scan exists to help a shopper decide whether a listing deserves trust before purchase. Core evidence is deceptive reselling/dropshipping, product identity, manipulated reviews, repeated defects or safety problems, misleading claims, fake pricing/scarcity, and return/fulfillment traps.

Default-scan work must be decision-useful, bounded, explainable, low-privacy-cost, and resistant to false positives. Deeper corporate, domain, marketplace, supplier, and network research belongs behind an explicit Deep Hunt action.

## Redundancy findings
- Review integrity and review provenance overlap on duplicate wording, bursts, incentives, wrong-product reviews, and rating anomalies. They should share one classifier rather than score the same observation twice.
- Product source matching, clone clustering, mutation detection, and image matching need a shared product fingerprint and lineage record.
- Origin, fulfillment, return jurisdiction, and merchant identity frequently derive from the same seller-controlled page. They are correlated evidence unless independently corroborated.
- Quality complaints and defect consensus must not independently score the same complaint corpus.
- Scarcity text and longitudinal scarcity resets are related; history can strengthen the observation but must not create a second independent source.
- The newer independence-aware fusion primitive and the legacy verdict engine must converge after regression characterization; two scoring authorities are not a stable architecture.

## Scope reductions
Keep in normal scan:
- exact-first product identity
- visible seller/product claims
- visible review integrity
- bounded local history
- visible price/scarcity behavior
- return/shipping terms available on the eligible page
- exact safety/recall matches from trusted local or keyless data
- concise verdict and receipts

Deep Hunt only:
- broad merchant-network exploration
- external reputation searches
- corporate registry lookup
- domain-age/RDAP research
- marketplace/source hunting
- expensive image investigation
- sanctions/restricted-party corroboration when merchant identity makes it relevant

Research context, not routine shopper evidence:
- aggregate trade-flow datasets
- broad factory intelligence unrelated to exact product identity
- generic corporate/financial research

## Stop-doing rules
1. Do not add a detector when an existing detector can be deepened with a shared primitive.
2. Do not add an API because it is interesting; require a concrete purchase-decision use case.
3. Do not make a default network request when local evidence is sufficient.
4. Do not add a top-level UI metric without merging or removing another.
5. Do not implement the same threshold in multiple detectors.
6. Do not count one observation twice, even when two labels describe it.
7. Do not grow the sidepanel controller with new analysis logic.
8. Country, nationality, Shopify, overseas fulfillment, or a new domain never increase risk by themselves.
9. Harsh copy is downstream of evidence confidence and never changes evidence weight.
10. Missing data is unknown, not clean.

## UI hierarchy
1. purchase verdict
2. strongest three receipts
3. review check: checked, passed/flagged, displayed vs adjusted rating, common integrity-passing low-star complaints
4. safety, returns, and shipping warnings
5. optional details
6. Deep Hunt

Payment processor and origin context are supporting details unless they directly contradict a material seller claim.

## Architecture
The sidepanel controller is approximately 46 KB and currently mixes DOM extraction, scan orchestration, permissions, history, network investigations, analysis, and rendering. Decompose incrementally after behavioral characterization into page extraction, scan orchestration, report rendering, explicit investigations, and settings/permissions. Avoid a wholesale rewrite.

## Performance/privacy
Preserve bounded history, bounded review comparisons, local-first analysis, optional host access, sensitive-page refusal, no credential collection, no telemetry, no mandatory backend, and no remote executable code.

Reduce duplicate review passes, share normalized product/review fingerprints, cache repeated external lookups with freshness, timeout network calls, and keep expensive source/image work explicit.

## Release gate
No public merge until the same exact head passes typecheck, tests, security audit, data lint, professional audit, build, generated-extension audit, performance audit, CodeQL, and browser smoke testing.
