# Work queue

| ID | Priority | Task | Status | Owner | Depends on |
|---|---:|---|---|---|---|
| DS-001 | P0 | Scaffold WXT/TypeScript MV3 extension | DONE | runtime | — |
| DS-002 | P0 | Define typed Product/Merchant/Evidence contracts | DONE | lead | DS-001 |
| DS-003 | P0 | Generic JSON-LD/OpenGraph product extraction | VERIFYING | lead | DS-002 |
| DS-004 | P0 | Shadow-DOM right-side stamp | VERIFYING | runtime | DS-001 |
| DS-005 | P0 | Side-panel evidence viewer | VERIFYING | runtime | DS-002 |
| DS-006 | P0 | Rule/evidence engine + independence model | RUNNING | lead | DS-002 |
| DS-007 | P1 | Native IndexedDB evidence history | RUNNING | runtime | DS-002 |
| DS-008 | P1 | Etsy adapter + fixtures | READY | — | DS-003,DS-006 |
| DS-009 | P1 | Amazon adapter + fixtures | READY | — | DS-003,DS-006 |
| DS-010 | P1 | Walmart adapter + fixtures | READY | — | DS-003,DS-006 |
| DS-011 | P0 | Fake scarcity/price chronology | RUNNING | forensics | DS-007 |
| DS-012 | P0 | Image hashing/local similarity | VERIFYING | forensics | DS-007 |
| DS-013 | P0 | Reverse-image/supplier search launchers | VERIFYING | runtime | DS-003 |
| DS-014 | P1 | RDAP/DNS merchant intelligence | RUNNING | forensics | DS-006 |
| DS-015 | P0 | Review provenance/anomaly engine | RUNNING | forensics | DS-006 |
| DS-016 | P1 | Policy/storefront fingerprinting | READY | — | DS-007 |
| DS-017 | P2 | Merchant relationship graph | READY | — | DS-007,DS-016 |
| DS-018 | P1 | OCR Deep Hunt | READY | — | DS-012 |
| DS-019 | P2 | Marketplace result-page badges | READY | — | DS-008,DS-009,DS-010 |
| DS-020 | P1 | Local embeddings/semantic invariant matching | READY | — | DS-012,DS-015 |
| DS-021 | P0 | Weekly dropshipper enablement intelligence watch | RUNNING | research | — |
| DS-022 | P1 | Technology signature registry (informational-first) | RUNNING | research | DS-021,DS-006 |
| DS-023 | P1 | Fulfillment-claim vs carrier contradiction engine | RUNNING | forensics | DS-007,DS-021 |
| DS-024 | P0 | Auto Source Hunt toggle + indexed-source matching | VERIFYING | forensics | DS-007,DS-012,DS-013 |
| DS-025 | P0 | Merchant complaint / reputation sweep | RUNNING | forensics | DS-006 |
| DS-026 | P1 | Return/refund friction detector | READY | — | DS-006 |
| DS-027 | P2 | Focused imported-product safety checks | READY | — | DS-003,DS-006 |
