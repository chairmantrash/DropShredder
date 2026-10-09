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

## Canonical unified release state — 2026-10-09 (supersedes preceding PR status)
PR #11 has now been **merged** into the internal release branch as `7271f9cafd54f6e2187a1bd4cc1835f9b09419c5`. Its engineering head `46cfa212cf92e9db8ad624741cff2a760449347d` passed 250 core tests (zero failures), nine packaged and 27 distinct native headed Chromium checks (36 total), CI and CodeQL. The previously observed revocation race was corrected with state-checked idempotent content-script registration and disabling auto-monitoring before permission cleanup. Native signed-key onboarding and CDP-dispatched actual file-input preview/malformed-file refusal now have bounded headed-browser passes, but neither authenticates an external issuer nor proves the graphical OS file picker. The exact 14-file package SHA list is pinned in `tools/browser-smoke/candidate-build-info.json`.

PR #10 is integrated transitively and closed; older divergent PR #8 is closed as superseded, **not** merged; PR #5 remains internal-only. **PR #9 is the sole DRAFT consumer-release integration**, still targeting `main`. No public release, no main merge. A fresh unpacked QA-only Actions artifact is available from run `37914518107`. The independent A01–D06 matrix, representative calibrated category accuracy, concurrent native panels/context-menu, native OS file picker/malformed Chrome-storage, live RDAP/CPSC and certification-unit exclusions remain open. Optional OCR/embeddings/automated feed refresh/key rotation were not shipped. For the exact release sequence and evidence, read `workplane/PR-RECONCILIATION-20261009.md` and the latest PR #9 description.

## Implementation-only continuation — 2026-10-09 (DS-035)
Following the PR11-to-PR9 internal merge, the owner requested completing feasible **implementation** work ahead of independent acceptance. The single active integration target stays draft PR #9, `release/security-performance-hardening`. Production changes add bounded same-URL ProductGroup attribution from explicitly named selected swatches/selectors, invalidate stale report selection stamps for those controls, and extend the pure recall scope matcher to fixed-width lot numbers/ranges alongside exact serial scopes. Unnamed/ambiguous controls abstain; no arbitrary DOM widgets or credential fields are inspected. This matcher does not scrape users' serials/lot data or declare a unit recalled.

Two additional corrections: the automatic evidence toast no longer suppresses itself merely because passive evidence meets a high-severity gate; it still makes no categorical fraud/safety claim. Explicit reverse-image search launchers fall back to a provider's manual search entry when the image URL is signed, fragmented, untrusted or private, rather than sharing potentially secret URL parameters. All remote searches remain user-selected and local passive scanning remains network-free.

**Scope decision:** OCR models, local embeddings, background feed refresh and automatic publisher-key rotation are not bundled into the beta by default: they need rights/performance/security evidence, an approved voluntary user action model and licensing review. Treat these as optional research candidates, not secretly shipped features or claims that beta must wait for them. Real issuer authentication, category-calibrated accuracy, and live RDAP/CPSC scope are external verification/onboarding, not code completion. No `main` merge or Web Store publication.

## DS-035 final engineering receipt — 2026-10-09
Implementation complete; independent release QA remains open. The canonical production source is `f8b74a93f520a8d2982083283cfa6a9869a89143`, reproducibly packaged as 14 locked files in `tools/browser-smoke/candidate-build-info.json`. The current evaluated branch head before this receipt is `c18953c641972f7330b12c765c2747a76433fa10` (subsequent commits only adjust tests and documents). GitHub Actions CI `37917272765` passes **255/255 core tests**, CodeQL `37917272754` passes, and all three hosted Chromium jobs `37917272818` pass (**9 packaged + 27 distinct native headed checks**). This engineering suite remains distinct from independent A01–D06. Exact unpacked QA artifact: https://github.com/chairmantrash/DropShredder/actions/runs/37917272818/artifacts/11610420835 . Receipt: `workplane/runs/DS-035-IMPLEMENTATION-20261009.json`. Do not ship merely because of these engineering results.

## Owner-directed full feature convergence — October 9, 2026 (DS-036)
The owner explicitly rejected treating the earlier beta scope as project-complete. **Supersedes earlier statements in this file that OCR, automatic feed refresh and marketplace badges are unimplemented or deferred.** The only consumer release branch remains draft PR #9; changes are fully implemented on that branch but publication remains unauthorized.

Implemented in the release source: (1) weekly opt-in signed intelligence feed refresh via Chrome alarms, only pre-authorized source URLs and pinned verified Ed25519 keys; no silent account or permission requests, no automatic issuer alias/rotation; (2) Amazon/Etsy/Walmart search-result badges, neutral manual-product navigation without background remote lookups; (3) bounded local 192-dimensional feature-hash product candidate similarity and separate source-scoped manufacturer/importer/seller relationship leads, unscored; (4) bundled English Tesseract worker/WASM/language data to run offline only for user-selected product label image with GTIN check and native BarcodeDetector fallback; (5) optional user-provided session-only Brave Search API key for single chosen supplier search, no storage or use in passive scan, may require a paid account/plan; all primary features function without it. Current UX/control toggles are in the native side panel.

A local hashed lexical vector is **not** a neural sentence embedding; it provides a lightweight search feature within privacy and performance constraints. Exact manufacturer/retailer affiliation is not proven by text or matching products. Browser OCR availability and accuracy on real photographs, provider rights, and merchant/category false-positive calibration remain independent tests, not features asserted from code. No user secrets, raw photos or browser history should leave the core. New packaged 27-file Chrome candidate is pinned in `tools/browser-smoke/candidate-build-info.json` and GitHub Actions conducts genuine Chrome acceptance; the exact most recent acceptance result must be read rather than guessed.

## DS-037 successor implementation closure — October 9, 2026
Current owner requests finish remaining non-testing work, then resume live beta. The DS-036 implementation audit found and closes stale OCR fingerprint/provenance/license assembly, outdated privacy/feature disclosures, supplier-search stale consent status and broad revocation cancellation. 267 core tests, typecheck and static security/Chrome/data/architecture gates pass. Upstream OCR license notices and actual core7 provenance are retained; no WASM engine was patched. Exact current clean package must be independently pinned and tested before prior browser successes can be applied. Hosted native OCR/provider/store observations are the next gate; no main merge or public submission. Receipt: workplane/runs/DS-037-IMPLEMENTATION-20261009.json and DS-037 task.
