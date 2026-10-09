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

## Findings applied / expanded hosted verification — 2026-10-09
Latest production candidate 4fd0b24c fixes the large-text masthead with three CSS rules; production permissions, dependencies and forensic logic are unchanged. Harness cb85efb0 verifies all 14 package hashes. Nine packaged and fourteen distinct native headed checks pass (23 distinct; seven native repeats in headless). CI and CodeQL pass. Genuine Chrome Deny/Allow, one owned product alert, full title/SKU/price scan, quiet article/sign-in fixtures/manual refusal and accepted-grant revocation are observed through real desktop input. Reflow passes at 320/380/420/640px at 130% light/compact. The earlier native-consent and visual gaps are closed only for these bounded cases. Report-control enablement is not an export-download pass.

Current authority: workplane/runs/DS-031-NATIVE-CONSENT-20261009.json and tools/browser-smoke/README.md. Historical receipts above are retained. DS-031 stays VERIFYING: independent A01–D06, live merchant/category accuracy, correct-tab/SPA and in-flight cases, searches/context menus, actual exports, RDAP/CPSC and concurrent panels remain open. DS-032–DS-034 stay READY. All 174 research records remain reconciled (33 scoped runtime plus further validation; 141 references/candidates not promoted to detectors). Research record counts are not shipped feature counts. Updated QA bundle/evidence and draft PR11 are available; no merge or extension publication. The owner has only a phone and needs no desktop setup for the proven hosted engineering workflow.

## Active DS-031–034 continuation — 2026-10-09

Owner: /root. Owner directive: “Do those things.” 245 core tests pass locally. Typecheck/security/Chrome-runtime/data/professionalism/build/package/performance checks pass. New candidate adds inert reference-list previews/signatures/manual subscriptions/rollback/expiry/role-separated unscored matching, exact LEI lookup, domain cancellation, stale-export guards and explicit same-URL variant attribution. Hosted verification is pending; do not reuse prior 23 passes as verification of the new bytes. Branch remains draft. Read brain/decisions/20261009-002-user-intelligence-and-runtime-gates.md and USER-LISTS.md.

## Verified continuation — 2026-10-09

This entry supersedes the pending continuation status above. Production source cb82ea8a06f987a529dc8fc70914aa36eb6c5377, exact 14-file clean package; harness 2fd69e5de3fb48121a1c5d938048af669a70eaf0. 246 core tests pass. Hosted Chromium 156.0.8078.4 passes 9 packaged plus 25 distinct native checks (34 total); 7 headless native repeats are not additional coverage. CI/CodeQL pass. Receipt: workplane/runs/DS-031-034-CONTINUATION-20261009.json; runtime workflow 37912196853, CI 37912196825, CodeQL 37912196901.

Verified additions: actual redacted download; field-only sensitive refusal; tab/SPA/in-flight/selection invalidation; focus/Escape and max-eight search batches; same-URL selected SKU/price; RDAP/CPSC fixture cancellation/errors and zero-score candidates; unsigned feed preview/save/update/rollback/reset and exact zero-score role leads; live exact-LEI GLEIF. Amazon accessibility-heading extraction defect was reproduced, fixed and verified on both owned regression and the live Noctua listing. Walmart title observed. Etsy 403 / Noctua manufacturer 429 are unavailable, not accuracy passes. No severe allegation resulted from these live observations; structured identity/offers remain unresolved.

DS-031–034 remain VERIFYING for their broader acceptance criteria. Native file-picker/signed-key onboarding/malformed storage, concurrent panels/full context-menu UI, live RDAP/CPSC, broader certifications, representative calibrated accuracy and independent A01–D06 remain open. Automatic weekly refresh/key rotation and OCR/embedding candidates were not shipped. Research application ledger: intelligence/application-continuation-20261009.md. PR9 -> PR10 -> PR11 ancestry verified; workplane/PR-RECONCILIATION-20261009.md records the proposed future sequence. Draft PR11 contains the work. Nothing merged, closed or published. No desktop action is required from the phone-only owner for this engineering workflow.
