# Research application continuation

The 174-record reconciliation remains a complete research inventory, not a feature count. This supplement records the bounded application now implemented without rewriting historical dispositions or claiming every candidate was adopted.

| Research area | Implemented application | Still unimplemented or unverified |
| --- | --- | --- |
| Controlled archives and source freshness (DS-032) | Strict inert JSON, source/date/license preview, explicit save and manual weekly refresh reminder, expiry, remove/reset, one-version rollback and monotonic feed floor | Real publisher onboarding, automatic key rotation and scheduled refresh |
| Feed authentication (DS-032) | Exact-byte Ed25519 verification using separately reviewed source-bound public keys; unknown keys and tampering fail | No pretrusted issuer, factual authentication or TUF compliance |
| Product matching and supplier fields (DS-033; SF06) | Exact GTIN or brand/model leads; color/size/capacity/material conflict rejection; explicit same-URL selected ProductGroup child | Nonstandard selectors, fuzzy matching calibration, OCR/embeddings, empirical image/text comparisons |
| Manufacturer network records (DS-033; N/H records) | Role-separated source-dated manufacturer/importer/seller leads, capped and zero-score | No bulk promotion of historical company names, alias merges or graph blacklists; per-record rights/freshness/exact-product verification required |
| Legal identity API (DS-034) | Explicit exact-LEI GLEIF lookup with bounded response, exact response identity, no key/cost/persistence or verdict effect | Broader relationships, store-to-entity attribution; other providers remain unselected |
| Recall/certification research (DS-034; FP/CG records) | Existing explicit CPSC candidate lookup, cancellation/error/permission guards and conservative exact-match primitives retained | Certification issuer verification, serial/lot and model-exclusion coverage, broader official safety providers |
| Chrome lifecycle (DS-031) | Tab/SPA/document/selection checks, cancel stale work, sensitive-field export refusal, bounded destination chooser | Independent release protocol, concurrent native panels, full context-menu UX and representative accuracy |

Implementation and limits: `USER-LISTS.md`, `intelligence/API-CAPABILITIES-20261008.json`, `brain/decisions/20261009-002-user-intelligence-and-runtime-gates.md`. Runtime claims require the new exact-package receipt; old browser passes do not verify this continuation. No external model/code/data catalogue was silently imported.
