# DropShredder release packet / operator checklist
Prepared October 9,2026. State: PREPARED; acceptance and owner release authorization pending. This checklist does not authorize merge, tag, upload, submission or publication.

## Prepared materials
- STORE-LISTING.md: customer copy, current scope and permissions.
- STORE-PRIVACY-DECLARATIONS.md and PRIVACY.md: complete local/optional-provider handling.
- DATA-PROVENANCE.md and intelligence/PROVENANCE-20261009.json: data lineage, rights evidence, limitations and maintenance roles.
- store-assets/: four 1280x800 actual-UI compositions, 440x280 promo, 1400x560 marquee, original captures and manifest.
- Existing16/32/48/128PNG runtime icons are valid and retained; store128 icon is copied without modifying runtime assets.
- DS-037 exact build/test/live receipt and DS-038 preparation receipt.
- DISTRIBUTION-REVIEW-20261009.zip: docs/asset review packet, not an accepted extension release.

## Current candidate identity — not accepted
DS-040 production ba9c51a74a9d914d5e75710902bfb1c4a431dbe5; tested harness b9d6bad55ac5f9d81a5300eae498e1ee4ac87774.
Exact candidate:51files,54,767,122bytes.337core/CI/CodeQL and69distinct Chromium156 checks pass; full native suite is BLOCKED at Hindi OCR O-hin (reproduced unchanged). Historical34/42-file receipts do not certify this candidate. See DS-040 run and handoff. Refresh affected current-UI OCR/settings assets before any submission. Version0.2.0/minimumChrome133 remain metadata; Chrome133 is not exercised here.

Independent A01-D06, representative precision/recall/abstention, real-photo OCR, native browser edges and performance acceptance remain open. Keep failures/blocked cases visible. No severe unsupported accusation, wrong-page scan, private data capture or serious performance issue may be waived silently.

## Final operator sequence after acceptance
1. Record acceptance receipt for the exact package/source including residual limitations; obtain owner's explicit release authorization.
2. Re-read PR9/head/main and open claims to prevent overwriting concurrent work. Compare accepted runtime bytes with the eventual release build. Docs-only commits do not invalidate unchanged runtime evidence; any runtime/package/version change needs an updated fingerprint and appropriate checks.
3. Confirm code/model/data notices, source scope and no unresolved imported dataset is included. DATA-PROVENANCE.md does not grant a new root open-source license; don't claim one.
4. Merge draft PR9 into main only when accepted/authorized. Create a release tag pointing to that accepted main commit; choose/record tag/version without guessing an existing Store item's update version.
5. Build/preserve the exact install ZIP and unpacked QA folder assistant-side; publish source commit, hashes, changelog and reviewable artifacts. Do not re-use a stale or asset/document review ZIP as the install ZIP.
6. Verify public privacy/support URLs and fill the live Dashboard fields from the worksheet. Reconcile changed Dashboard category wording, publisher/contact/distribution/region settings; do not infer the owner's account or an existing Store item ID.
7. Upload accepted ZIP,128 icon,440 promo and selected current screenshots; optional marquee. Images are demo-owned Chrome captures, not accuracy endorsements.
8. Submit for review only under owner authorization, and record item ID, uploaded version/hash, visibility and approval/rejection. Google review is an external gate, not a promised result. Enable publication only according to the authorized visibility plan.
9. Preserve first-release rollback/replacement build, issue/security intake and maintenance responsibilities. A rollback/update still requires accurate accepted versioning and Store constraints.

## Account-specific prerequisites
A Chrome Web Store publisher account, verified contact and applicable developer registration are required by Google. Account state/item ID are not known in this conversation; do not create accounts, pay fees, accept legal agreements or ask for secrets as part of this preparation task. This is separate from DropShredder's $0/month standard runtime. Official setup: https://developer.chrome.com/docs/webstore/register/ and https://developer.chrome.com/docs/webstore/set-up-account .

No merge or Store submission was performed by DS-038.

DS-039 adds localized runtime bytes: require its fresh fingerprint/Chrome receipts rather than applying unchanged-runtime DS-038 evidence to it. Review translations with native speakers and localized consent/full scans before declaring language acceptance. Existing DS-038 screenshot crops predate this UI disclosure addition; refresh affected current-UI assets from the new build before submission.


DS-040 candidate adds multilingual merchant detection and seven selected offline OCR models (51files). Refresh affected OCR/settings screenshots and review the new merchant-language/browser receipt before acceptance; older34/42-file inventories and DS-039 passes do not certify these new bytes. Multilingual fixtures/synthetic OCR cannot certify category or photograph accuracy.

## DS-041 regional utility acceptance
- [ ] Native exact-build origin-file preview/review/apply/clear/navigation/export and directory links; no automatic external requests.
- [ ] Representative Canadian English/French and Mexican Spanish marketplaces/manufacturer catalogues; separate product/seller/variant/dispatch scope and false-origin review.
- [ ] Native-speaker/legal-copy review of 38 new origin/directory messages; no certified/100% claims from source types or legal logos alone.
- [ ] Source authenticity and complete real-product/actual-shipment dossiers; no proof inferred from fixture passes.
- [ ] Refresh store screenshots affected by the origin utility before submission.
DS-040 O-hin remains a separate blocker. Existing independent A01–D06 and release authorization requirements remain in force.
