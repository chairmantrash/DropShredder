# Work queue

| ID | Priority | Task | Status | Owner | Depends on |
|---|---:|---|---|---|---|
| DS-001 | P0 | Scaffold WXT/TypeScript MV3 extension | VERIFYING | runtime | — |
| DS-002 | P0 | Define typed Product/Merchant/Evidence contracts | RUNNING | lead | DS-001 |
| DS-003 | P0 | Generic JSON-LD/OpenGraph product extraction | RUNNING | lead | DS-002 |
| DS-004 | P0 | Shadow-DOM right-side stamp | RUNNING | runtime | DS-001 |
| DS-005 | P0 | Side-panel evidence viewer | RUNNING | runtime | DS-002 |
| DS-006 | P0 | Rule/evidence engine + independence model | READY | — | DS-002 |
| DS-007 | P1 | IndexedDB/Dexie evidence history | READY | — | DS-002 |
| DS-008 | P1 | Etsy adapter + fixtures | READY | — | DS-003,DS-006 |
| DS-009 | P1 | Amazon adapter + fixtures | READY | — | DS-003,DS-006 |
| DS-010 | P1 | Walmart adapter + fixtures | READY | — | DS-003,DS-006 |
| DS-011 | P1 | Fake scarcity/price chronology | READY | — | DS-007 |
| DS-012 | P1 | Image hashing/local similarity | READY | — | DS-007 |
| DS-013 | P1 | Reverse-image/supplier search launchers | READY | — | DS-003 |
| DS-014 | P1 | RDAP/DNS merchant intelligence | READY | — | DS-006 |
| DS-015 | P1 | Review anomaly engine | READY | — | DS-006 |
| DS-016 | P1 | Policy/storefront fingerprinting | READY | — | DS-007 |
| DS-017 | P2 | Merchant relationship graph | READY | — | DS-007,DS-016 |
| DS-018 | P2 | OCR Deep Hunt | READY | — | DS-012 |
| DS-019 | P2 | Marketplace result-page badges | READY | — | DS-008,DS-009,DS-010 |
| DS-020 | P2 | Local embeddings/semantic similarity | READY | — | DS-012,DS-015 |
