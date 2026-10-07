# Current state

**Phase:** Beta completion / verification
**Product:** DropShredder
**Primary constraint:** local-first, no mandatory backend, no paid API dependency

## Implemented beta scope
- WXT/TypeScript Manifest V3 extension and active-tab scanner
- Generic structured product extraction plus Amazon, Etsy and Walmart marketplace handling
- Conservative evidence/verdict engine with independence/deduplication and severe-accusation gates
- Local IndexedDB history with bounded retention
- Longitudinal scarcity, price, review-change and stateful dark-pattern analysis
- Review integrity/provenance, complaint consensus and adjusted visible-review rating
- Exact-first product fingerprinting, local image hashing and cross-history image evidence
- Merchant/origin/fulfillment/return-policy contradiction analysis
- Explicit Deep Hunt source, image, store, reputation and RDAP investigations
- Informational commerce/payment/supply-chain context with zero country/nationality risk weight
- Exact-first regulatory safety matching primitive; fuzzy title matches remain candidate-only
- Security, privacy, performance, data, architecture, release and CodeQL gates
- Customer-facing report renderer extracted from the side-panel controller
- Beta testing and release smoke-test protocols

## Deliberately deferred outside beta core
These are not required for the beta mission and must not block it:
- OCR Deep Hunt
- local embeddings/semantic models
- marketplace result-page badges
- broad merchant relationship graph exploration
- broad policy/storefront fingerprinting beyond current return/fulfillment checks
- aggregate trade/factory intelligence

They may be revisited only with a concrete shopper decision use case and performance/privacy justification.

## Remaining external verification
- Load the exact generated unpacked artifact in Chrome/Chromium.
- Run the mandatory browser/site smoke matrix in RELEASE-TESTING.md.
- Record UI/runtime/performance defects and false positives from real pages.
- Do not submit publicly until those browser checks pass.

## Scope lock
Default scan remains focused on provenance, merchant credibility, manipulation, fulfillment, complaints and focused safety. Country/nationality, storefront platform, importing and overseas fulfillment are never negative evidence by themselves.
