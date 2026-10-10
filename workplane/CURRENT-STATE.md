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
Current owner requests finish remaining non-testing work, then resume live beta. The DS-036 implementation audit closes stale OCR fingerprint/provenance/license assembly, outdated privacy/feature disclosures, supplier-search stale consent status and broad revocation cancellation. 267 core tests, typecheck and static security/Chrome/data/architecture gates pass. Upstream OCR license notices and actual core7 provenance are retained; no WASM engine was patched. Receipt: workplane/runs/DS-037-IMPLEMENTATION-20261009.json and DS-037 task.

## DS-037 live beta started — October 9, 2026
Implementation sweep complete; release acceptance remains open. Production cc315e4690b9a3cc5a16b4d6d6e3b6dd739bb0c6, harness fe22e27b44424273d4b465d8af5cafbc40178bdb, exact 34-file package pass 267 core tests, CI37979166327, CodeQL37979166013 and Chromium37979165995. Chrome156.0.8078.4 passes 9 packaged +29 distinct headed native checks (38); repeated headless-native coverage excluded. Actual Deny/Allow/revoke, signed-feed onboarding, Chrome file-input and packaged synthetic-image OCR ran; real-photo accuracy untested.

Live Amazon Noctua fan and Walmart LEGO toy titles observed with correct page attribution and UNKNOWN verdicts; structured identity/offers unresolved. Genuine RDAP reserved example.net, CPSC candidate search and exact-LEI GLEIF returned; no seller legitimacy/product safety authentication. Etsy403/Noctua429 unavailable. No uncaught extension errors/unapproved monitored origins or severe allegation. Screenshots preserved hosted; local archive download403 prevented visual review here. Receipt workplane/runs/DS-037-LIVE-BETA-20261009.json retains full executed reports/remaining tests. Historical raw notTested templates are superseded by executed tests/liveProviders and receipt scope correction.

Still open: independent A01-D06, full toast/context-menu/concurrent-panel/OS-picker cases, weekly-refresh lifecycle, real-photo OCR and representative category calibration, paid-key Brave live request, Chrome133 and large real-page CPU/memory tests. Draft PR9 only; main unchanged; no public publication.

## DS-038 release preparation complete — October9,2026
The owner authorized completing records, release documentation, provenance and public-distribution preparation, followed by release only after acceptance/authorization. WORK-QUEUE and DS-036/034 records now cite the current34-file package and DS-037 outcomes. STORE-LISTING, PRIVACY refinements, STORE-PRIVACY-DECLARATIONS and RELEASE-CHECKLIST describe actual OCR, signed updates, neutral badges, transient optional key, alarms and third-party network metadata. No runtime/package byte changed.

DATA-PROVENANCE and intelligence/PROVENANCE-20261009.json record sources, obligations and freshness. IANA CC0 protocol-registry terms verified and bundled RDAP services exactly match live publication2026-09-30. GLEIF CC0 Access Service terms checked.18 merchant records remain within recorded windows;31 neutral source-index rows and platform/tool patterns lack individual dates and are not advertised as universally current. Proprietary/research datasets and unverified publisher license declarations are not granted redistribution rights. No root source-reuse license selected. REGISTRY-MAINTENANCE assigns owner accountability and reviewer/release roles; no scheduled DS-021 researcher/shared hosted publisher silently installed.

Recovered DS-037 screenshots now available for selected visual review. Four actual-UI1280x800 compositions, valid replacement440x280 promo,1400x560 marquee,128icon and source/transform manifest are in store-assets. Blank initial/pre-paint and Nuclear captures excluded.6 output PNGs decode, match dimensions/hashes and reproduce deterministically;4 UI crops match source pixels exactly. Data lint/security/diff/package-fingerprint checks pass. Full original beta matrix not newly repeated. Receipt: workplane/runs/DS-038-DISTRIBUTION-20261009.json.

Release packet prepared for review. Independent acceptance, account-specific publisher settings and explicit owner release authorization remain pending. No main merge, release tag, Store upload/submission or publication.

## Verified seven-language localization — 2026-10-10
DS-039 production df803fec2c91ee72aedbdc8984a9c99c09ae982a, tested63056a30b8a32ce45989b8ded302c237292df3e9:42packaged files/48,018,147bytes,278core tests, CI/CodeQL and45distinct Chrome156 checks pass (9packaged+29native headed+7native-locale UI runs; headless repeats excluded). Seven additional336-message packs: Simplified Chinese/Hindi/Spanish/Arabic/French/Bengali/Brazilian Portuguese, English default. Chrome display language resolves offline; Arabic direction/isolation and320/420px enlarged-text reflow observed. Original detector notes/source data/raw exports and English OCR remain unchanged and disclosed. Locale tests render real extension documents in tabs; native consent/full scans remain English regression scope. Native-speaker/per-language full acceptance and broader independent/calibrated release gates remain open. Research/maintenance saved in Brain/TRANSLATIONS.md, exact evidence workplane/runs/DS-039-LOCALIZATION-20261010.json. New42-file/278/45results supersede old34/267/38 only for this tested localized package; historical receipts retained. Draft PR9/main7000cc3a remain release-gated.


## DS-040 multilingual merchant verification — October10,2026
Production ba9c51a74a9d914d5e75710902bfb1c4a431dbe5, tested b9d6bad55ac5f9d81a5300eae498e1ee4ac87774,51files/54,767,122bytes.337core tests, CI/CodeQL,9packaged,7locale profiles and53headed checks pass (69distinct; headless repeats excluded). All eight languages pass product/schema-free detection, native toast attribution/manual repeats, exclusions, source quotations/reviews/policies; modeled translated DOM and bounded20,000-element page pass. The seven added compressed OCR models total6,637,028bytes in this checked Node/zlib package.

**BLOCKED at O-hin:** Hindi text is recognized but Latin MODEL12345 becomes |॥0/05। 42345. Chinese OCR passes; five later model checks and N12/N13/N14 were not executed. One unchanged repeat requested; no OCR repair or assertion relaxation. Original continuation engineering agent receives workplane/handoffs/DS-040-O-HIN-20261010.md; full actual results and screenshot limitations are in workplane/runs/DS-040-MULTILINGUAL-20261010.json. No universal live-language/category accuracy, native-speaker review, real-photo OCR or independent release acceptance claimed. Draft PR9 remains unmerged/unpublished.
