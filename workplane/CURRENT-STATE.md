# Current state

**Phase:** Beta completion / verification
**Product:** DropShredder
**Primary constraint:** local-first, no mandatory backend, no paid API dependency

## Current Chrome auto-alert change (2026-10-08)
- Precision product-page classifier: independent product identity, purchase control and price/offer cues, with hard abstention for searches, collections, homepages, articles and sensitive pages.
- Explicit optional HTTPS auto-alert permission: dynamic ISOLATED Chrome content script, no permanent all-sites host permission, no tabs/activeTab permission.
- Short, dismissible top-right evidence toast on qualifying product listings; no trust-clean verdict from insufficient evidence.
- Clicking toast requests side panel for the originating tab/document; manual full forensic scan remains available.
- Auto scan is local and bounded; no background network OSINT, image acquisition, history write, or continuous DOM observers.
- Research and browser test matrix: brain/research/2026-10-08-SHOPPING-PAGE-DETECTION.md and RELEASE-TESTING.md.
- Chrome native code and unit tests passed CI/CodeQL on engineering SHA 7397a7c; **real Chrome runtime smoke still mandatory**.

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
- Load the exact generated unpacked artifact in a real Chrome/Chromium session. CI-green static and simulated checks are not browser verification.
- Run the mandatory browser/site smoke matrix in RELEASE-TESTING.md.
- Record UI/runtime/performance defects and false positives from real pages.
- Do not submit publicly until those browser checks pass.

## Scope lock
Default scan remains focused on provenance, merchant credibility, manipulation, fulfillment, complaints and focused safety. Country/nationality, storefront platform, importing and overseas fulfillment are never negative evidence by themselves.

## Successor reconciliation — 2026-10-09
DS-030 supersedes the open runtime handoffs on feature/runtime-reconciliation-20261009. Local runtime corrections and 230 passing tests are recorded; desktop Chrome remains unverified. All 174 research records have explicit continuation dispositions in intelligence/reconciliation-20261009.json. DS-031 through DS-034 are READY follow-ups, not shipped features. One pinned local runtime domain parser (tldts 7.4.18) replaces the prior zero-dependency baseline; see the current ADR and bundled licenses.

## Browser environment attempt — 2026-10-09
DS-031 is BLOCKED on assistant-side Chromium startup: the host denied process-singleton socket creation before extension loading. Candidate package hashes verified; zero browser passes. This is an environment blocker, not evidence of an extension defect. The owner currently has only a phone. DS-032–DS-034 implementation is independent of this verification gate. Exact receipt: workplane/runs/DS-031-BROWSER-ENVIRONMENT-20261009.json.

## Assistant-side hosted browser path — 2026-10-09
The earlier local startup blocker remains local only. GitHub hosted Chromium 156 now loads the exact candidate, and nine limited packaged-runtime checks pass. A separate native CDP diagnostic opens the actual side panel and observes a source-hunt setting save. CI/CodeQL on harness ef1e7914 are green. No production files changed. DS-031 is VERIFYING, not DONE: native consent/full scans/live merchants/category accuracy remain open. Large-text masthead reflow is an observed visual issue. Receipt: workplane/runs/DS-031-HOSTED-CHROMIUM-20261009.json. Other agents can reuse tools/browser-smoke and the native public-CDP bridge; the owner has only a phone and need not run the setup.
