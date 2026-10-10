# Work queue

Current owner addition DS-041: Canada/Mexico research and North American origin utility implemented; exact-build/native verification in progress. 34 dated source/outlet records and five neutral disclosed relationships. DS-040 Hindi OCR remains independently blocked; its failure is not repaired or suppressed.

Current owner-directed DS-040: BLOCKED by O-hin mixed-script OCR correctness. Fresh337core/CI/CodeQL and69distinct Chromium156 checks pass on51files; all eight merchant-page groups pass, but the suite stops at Hindi OCR. Reproduced unchanged; no repair or pass substitution. See DS-040 handoff and full run receipt.

Current owner-directed addition2026-10-10: DS-039 offline localization DONE (bounded engineering scope). Seven additions plus English,336messages/pack;278core/45distinct Chrome156 checks pass on the42-file package. Independent language/release acceptance remains separate. Consult DS-039/TRANSLATIONS.md for exact new-build Chrome/packaging evidence. Public release remains held.

| ID | Priority | Task | Status | Owner | Depends on |
|---|---:|---|---|---|---|
| DS-001 | P0 | Scaffold WXT/TypeScript MV3 extension | DONE | runtime | — |
| DS-002 | P0 | Define typed Product/Merchant/Evidence contracts | DONE | lead | DS-001 |
| DS-003 | P0 | Generic JSON-LD/OpenGraph product extraction | DONE | lead | DS-002 |
| DS-004 | P0 | Shadow-DOM right-side stamp | VERIFYING | runtime | DS-001 |
| DS-005 | P0 | Side-panel evidence viewer | VERIFYING | runtime | DS-002 |
| DS-006 | P0 | Rule/evidence engine + independence model | DONE | lead | DS-002 |
| DS-007 | P1 | Native IndexedDB evidence history | DONE | runtime | DS-002 |
| DS-008 | P1 | Etsy adapter + fixtures | DONE | — | DS-003,DS-006 |
| DS-009 | P1 | Amazon adapter + fixtures | DONE | — | DS-003,DS-006 |
| DS-010 | P1 | Walmart adapter + fixtures | DONE | — | DS-003,DS-006 |
| DS-011 | P0 | Fake scarcity/price chronology | DONE | forensics | DS-007 |
| DS-012 | P0 | Image hashing/local similarity | DONE | forensics | DS-007 |
| DS-013 | P0 | Reverse-image/supplier search launchers | DONE | runtime | DS-003 |
| DS-014 | P1 | RDAP/DNS merchant intelligence | DONE | forensics | DS-006 |
| DS-015 | P0 | Review provenance/anomaly engine | DONE | forensics | DS-006 |
| DS-016 | P1 | Policy/storefront fingerprinting | IMPLEMENTED-QA-PENDING | release | DS-007 |
| DS-017 | P2 | Merchant relationship graph | IMPLEMENTED-QA-PENDING | release | DS-007,DS-016 |
| DS-018 | P1 | OCR Deep Hunt | IMPLEMENTED-QA-PENDING | release | DS-012 |
| DS-019 | P2 | Marketplace result-page badges | IMPLEMENTED-QA-PENDING | release | DS-008,DS-009,DS-010 |
| DS-020 | P1 | Local similarity and invariant matching (bounded feature hashing; no neural model) | IMPLEMENTED-QA-PENDING | release | DS-012,DS-015 |
| DS-021 | P0 | Weekly dropshipper enablement intelligence watch | RUNNING | research | — |
| DS-022 | P1 | Technology signature registry (informational-first) | DONE | research | DS-021,DS-006 |
| DS-023 | P1 | Fulfillment-claim vs carrier contradiction engine | DONE | forensics | DS-007,DS-021 |
| DS-024 | P0 | Auto Source Hunt toggle + indexed-source matching | DONE | forensics | DS-007,DS-012,DS-013 |
| DS-025 | P0 | Merchant complaint / reputation sweep | DONE | forensics | DS-006 |
| DS-026 | P1 | Return/refund friction detector | DONE | forensics | DS-006 |
| DS-027 | P2 | Focused imported-product safety checks | DONE | — | DS-003,DS-006 |

## Current reconciliation queue (2026-10-09, DS-038 reconciliation)

Earlier DONE rows describe historical implementation, not a real Chrome gate pass. DS-030 addresses the DS-003/008/013/014 and DS-028/029 follow-ups without changing their original receipts.

| ID | Priority | Task | Status | Owner |
|---|---|---|---|---|
| DS-030 | P0 | Runtime and research reconciliation | VERIFYING | successor Work agent |
| DS-031 | P0 | Chrome/category validation | VERIFYING | /root — hosted engineering covered; independent and category gates open |
| DS-032 | P1 | Controlled data imports/subscriptions | VERIFYING | /root — bounded imports shipped to draft; issuer/onboarding gates open |
| DS-033 | P1 | Product matching/manufacturer graph | VERIFYING | /root — exact informational leads; broad accuracy/model gates open |
| DS-034 | P1 | Safety/certification/API capabilities | VERIFYING | /root — live GLEIF/RDAP/CPSC observed; exact certification/unit gates open |
| DS-035 | P1 | Bounded selected variants / recall lot scope / alert and image-search privacy | VERIFYING | release engineer — source and engineering gates pass; independent acceptance still open |

2026-10-09 synchronization: DS-031–034 statuses above match their current packets and the bounded engineering receipt `workplane/runs/DS-031-034-CONTINUATION-20261009.json`. VERIFYING is not DONE or release authorization. PR #11 was integrated into the internal PR #9 release branch as merge 7271f9c; PR #9 is the sole draft release gate. Independent A01–D06, representative category calibration, native browser edges and live-provider acceptance remain explicit gates.


Source implementation and constraints: `workplane/tasks/DS-035.md`. The owner subsequently reopened all deferred feature work via DS-036. The implementation uses licensed, locally packaged offline OCR and no-model vector similarity; it does not claim neural embeddings. Signed subscription updates are scheduled with explicit user opt-in. See `workplane/tasks/DS-036.md` and `workplane/runs/DS-036-FEATURE-CONVERGENCE-20261009.json` for exact verification scope.

| DS-036 | P0 | Finish deferred feature set, converge release candidate and lock package | IMPLEMENTED-QA-PENDING | release agent — 34-file package; DS-037 engineering gates passed, independent acceptance open |


| DS-037 | P0 | Remaining implementation closure and bounded live beta | IMPLEMENTED | release agent —267 core /38 distinct hosted Chrome checks; independent acceptance open |
| DS-038 | P1 | Records, provenance, store/privacy and distribution materials | DONE-PREPARATION | /root — assets/docs verified; acceptance/owner release authorization pending |

Current evidence: production `cc315e4690b9a3cc5a16b4d6d6e3b6dd739bb0c6`, tested harness `fe22e27b44424273d4b465d8af5cafbc40178bdb`. Exact **34-file** package, **267** core tests, **9 packaged +29 headed native =38 distinct** real Chrome156 checks; repeated headless checks excluded. DS-037-LIVE-BETA-20261009.json retains executed IDs, screenshots, live providers and blocked surfaces. Independent acceptance/category accuracy remains open; earlier queue rows do not prove completion of their broad test criteria. DS-021 is an ongoing maintenance responsibility, not evidence of an installed scheduled crawler.

| DS-041 | P1 | Canada/Mexico research, sourcing map and eight-stage North American origin utility | IMPLEMENTED | /root — implementation complete; exact-build/native and real-product authentication gates explicit |

DS-041 checkpoint:364 core tests/27 new, eight385-message catalogs,51files/54,864,218bytes. Source a80617685ad796e35cc815f79b356ab4c72c775d; native verification pending. Exact receipt: workplane/runs/DS-041-NORTH-AMERICA-20261010.json.

| DS-042 | P1 | Prior research audit and entity standing categories | IMPLEMENTED | /root —386 core local pass; exact hosted candidate pending |
| DS-043 | P1 | Litigation sources, relevant-party status and regular refresh | IMPLEMENTED | /root —strict local scope/status tests pass; weekly maintenance enabled |

DS-041–043 engineering closure: bounded native checks N30–N33 pass on9d79f414;386core/73distinctChrome passes, CI/CodeQL green. Broader acceptance remains gated by original DS-040 O-hin and independent real-source/category validation. Research maintenance is recurring, not an all-source live crawler. See DS-042-043 run receipt and INTELLIGENCE-MAINTENANCE.md.
