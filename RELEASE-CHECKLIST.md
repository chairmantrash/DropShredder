# DropShredder release packet / operator checklist
Prepared October 9,2026. State: PREPARED; acceptance and owner release authorization pending. This checklist does not authorize merge, tag, upload, submission or publication.

Scope clarification, DS-049: this is the **general release / main / Chrome Web Store promotion** checklist. The owner separately authorized the experimental GitHub beta prerelease on October12; `brain/decisions/20261012-002-beta-entry-and-promotion.md` and `BETA-TESTING.md` govern that route. Independent acceptance remains open during beta. The later main/Store sequence below is unchanged.

## Prepared materials
- STORE-LISTING.md: customer copy, current scope and permissions.
- STORE-PRIVACY-DECLARATIONS.md and PRIVACY.md: complete local/optional-provider handling.
- DATA-PROVENANCE.md and intelligence/PROVENANCE-20261009.json: data lineage, rights evidence, limitations and maintenance roles.
- store-assets/: four 1280x800 actual-UI compositions, 440x280 promo, 1400x560 marquee, original captures and manifest.
- Existing16/32/48/128PNG runtime icons are valid and retained; store128 icon is copied without modifying runtime assets.
- DS-037 exact build/test/live receipt and DS-038 preparation receipt.
- DISTRIBUTION-REVIEW-20261009.zip: docs/asset review packet, not an accepted extension release.

## Current candidate identity — awaiting independent acceptance

Production source `5e3dc52bc54630753cf37619225be49d42043a2d`, tree `e5841d40c6b22a6bdd7eb685956e221eceff0bcd`. Candidate: 51 files / 54,941,299 bytes; exact CI install ZIP 25,849,056 bytes, SHA256 `6f29e93c4cd02c9f48e4cde3f6ded408c7a822449998b6416e2c9ccd430ab74c`. QA artifact 11755200538/archive SHA256 `c779fbd557e0e02d05b6513740e6d596cfcccfe9efb09d97a0a50ea4edceaedf`; every unpacked/ZIP entry, size and hash is verified. Current dependency-gated Store artifact 11754903493 has a different outer wrapper; payload is identical.

DS-048 full canonical head `2fa7d0a75998e6b1691060011fada9735309c94f` passes 405 core tests, CI 38266197583, CodeQL 38266197621 and Chromium 38266197484:117 browser executions / 99 unique IDs. Native/lifecycle coverage uses 156; 133/155 cover 9 packaged checks each. Full SARIF has zero findings. Subsequent workflow-only dependency followup passes CI 38267549335 and finding-free CodeQL 38267549288; current complete root/browser-tool audit inventories show zero advisories. No permission/model/dependency/severe-verdict-policy change. PRs #15–17 are integrated into release; PR #9 remains draft. Current exact receipt: `workplane/runs/DS-048-COMPLETION-20261012.json`.

Current Store assets come from the same payload's actual green Chrome frames, with traceable source/crop hashes and no UI pixel edits. Generated owned labels and test signer demos are scoped accurately. Independent A01–D06/F01–F07, rights-cleared merchant/product-disjoint accuracy and approved thresholds, native-language/legal/photo and resource/long-duration review, applicable real publisher/elapsed-week acceptance remain open; distribution to people requires identified authorized channels. `workplane/evals/ACCEPTANCE-INPUTS.md` supplies concrete input formats; proposals/empty templates do not grant approval. Account/contact/Store settings apply only to the later Store route. No unsupported severe accusation, sensitive capture, wrong-page scan or material slowdown may be waived silently.

## Final operator sequence after acceptance
1. Record acceptance receipt for the exact package/source including residual limitations; obtain owner's explicit release authorization.
2. Re-read PR #9/head/main and open claims to prevent overwriting concurrent work. Compare accepted runtime bytes with the eventual release build. Docs-only commits do not invalidate unchanged runtime evidence; any runtime/package/version change needs an updated fingerprint and appropriate checks.
3. Confirm code/model/data notices, source scope and no unresolved imported dataset is included. DATA-PROVENANCE.md does not grant a new root open-source license; don't claim one.
4. Merge draft PR #9 into main only when accepted/authorized. Create a release tag pointing to that accepted main commit; choose/record tag/version without guessing an existing Store item's update version.
5. Build/preserve the exact install ZIP and unpacked QA folder assistant-side; publish source commit, hashes, changelog and reviewable artifacts. Do not re-use a stale or asset/document review ZIP as the install ZIP.
6. Verify public privacy/support URLs and fill the live Dashboard fields from the worksheet. Reconcile changed Dashboard category wording, publisher/contact/distribution/region settings; do not infer the owner's account or an existing Store item ID.
7. Upload accepted ZIP,128 icon,440 promo and selected current screenshots; optional marquee. Images are demo-owned Chrome captures, not accuracy endorsements.
8. Submit for review only under owner authorization, and record item ID, uploaded version/hash, visibility and approval/rejection. Google review is an external gate, not a promised result. Enable publication only according to the authorized visibility plan.
9. Preserve first-release rollback/replacement build, issue/security intake and maintenance responsibilities. A rollback/update still requires accurate accepted versioning and Store constraints.

## Account-specific prerequisites
A Chrome Web Store publisher account, verified contact and applicable developer registration are required by Google. Account state/item ID are not known in this conversation; do not create accounts, pay fees, accept legal agreements or ask for secrets as part of this preparation task. This is separate from DropShredder's $0/month standard runtime. Official setup: https://developer.chrome.com/docs/webstore/register/ and https://developer.chrome.com/docs/webstore/set-up-account .

No merge or Store submission was performed by DS-038.

DS-039 adds localized runtime bytes: require its fresh fingerprint/Chrome receipts rather than applying unchanged-runtime DS-038 evidence to it. Review translations with native speakers and localized consent/full scans before declaring language acceptance. Existing DS-038 screenshot crops predate this UI disclosure addition; refresh affected current-UI assets from the new build before submission.


DS-040 candidate adds multilingual merchant detection and seven selected offline OCR models (51 files). Refresh affected OCR/settings screenshots and review the new merchant-language/browser receipt before acceptance; older34/42-file inventories and DS-039 passes do not certify these new bytes. Multilingual fixtures/synthetic OCR cannot certify category or photograph accuracy.

## DS-041 regional utility acceptance
- [ ] Native exact-build origin-file preview/review/apply/clear/navigation/export and directory links; no automatic external requests.
- [ ] Representative Canadian English/French and Mexican Spanish marketplaces/manufacturer catalogues; separate product/seller/variant/dispatch scope and false-origin review.
- [ ] Native-speaker/legal-copy review of 38 new origin/directory messages; no certified/100% claims from source types or legal logos alone.
- [ ] Source authenticity and complete real-product/actual-shipment dossiers; no proof inferred from fixture passes.
- [ ] Refresh store screenshots affected by the origin utility before submission.
DS-040 O-hin is repaired with unchanged original assertions under DS-045. Existing independent A01–D06 and release authorization requirements remain in force.

DS-042/043: review exact candidate standing/litigation controls and seven-day stale behavior; source licenses/access and exact-party scope must be checked before machine ingestion. Refresh standing/origin screenshots and obtain native-language/legal-copy review. Scheduled research maintenance does not replace the release acceptance gates. DS-045 repairs and verifies the original Hindi/Arabic fixtures; independent photographed-label accuracy remains open.
