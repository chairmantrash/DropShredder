# Work queue

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
| DS-016 | P1 | Policy/storefront fingerprinting | DEFERRED-DEEP-HUNT | — | DS-007 |
| DS-017 | P2 | Merchant relationship graph | DEFERRED-DEEP-HUNT | — | DS-007,DS-016 |
| DS-018 | P1 | OCR Deep Hunt | DEFERRED-DEEP-HUNT | — | DS-012 |
| DS-019 | P2 | Marketplace result-page badges | DEFERRED-POST-BETA | — | DS-008,DS-009,DS-010 |
| DS-020 | P1 | Local embeddings/semantic invariant matching | DEFERRED-POST-BETA | — | DS-012,DS-015 |
| DS-021 | P0 | Weekly dropshipper enablement intelligence watch | RUNNING | research | — |
| DS-022 | P1 | Technology signature registry (informational-first) | DONE | research | DS-021,DS-006 |
| DS-023 | P1 | Fulfillment-claim vs carrier contradiction engine | DONE | forensics | DS-007,DS-021 |
| DS-024 | P0 | Auto Source Hunt toggle + indexed-source matching | DONE | forensics | DS-007,DS-012,DS-013 |
| DS-025 | P0 | Merchant complaint / reputation sweep | DONE | forensics | DS-006 |
| DS-026 | P1 | Return/refund friction detector | DONE | forensics | DS-006 |
| DS-027 | P2 | Focused imported-product safety checks | DONE | — | DS-003,DS-006 |

## Current reconciliation queue (2026-10-09)

Earlier DONE rows describe historical implementation, not a real Chrome gate pass. DS-030 addresses the DS-003/008/013/014 and DS-028/029 follow-ups without changing their original receipts.

| ID | Priority | Task | Status | Owner |
|---|---|---|---|---|
| DS-030 | P0 | Runtime and research reconciliation | VERIFYING | successor Work agent |
| DS-031 | P0 | Chrome/category validation | VERIFYING | /root — hosted engineering covered; independent and category gates open |
| DS-032 | P1 | Controlled data imports/subscriptions | VERIFYING | /root — bounded imports shipped to draft; issuer/onboarding gates open |
| DS-033 | P1 | Product matching/manufacturer graph | VERIFYING | /root — exact informational leads; broad accuracy/model gates open |
| DS-034 | P1 | Safety/certification/API capabilities | VERIFYING | /root — exact GLEIF; live CPSC/RDAP/certification gates open |
| DS-035 | P1 | Bounded selected variants / recall lot scope / alert and image-search privacy | VERIFYING | release engineer — source implemented; exact package and independent browser review pending |

2026-10-09 synchronization: DS-031–034 statuses above match their current packets and the bounded engineering receipt `workplane/runs/DS-031-034-CONTINUATION-20261009.json`. VERIFYING is not DONE or release authorization. PR #11 was integrated into the internal PR #9 release branch as merge 7271f9c; PR #9 is the sole draft release gate. Independent A01–D06, representative category calibration, native browser edges and live-provider acceptance remain explicit gates.


Source implementation and constraints: `workplane/tasks/DS-035.md`. Unshipped optional OCR/embeddings/automated feed/key rotation are documented research candidates, not required beta implementations.
