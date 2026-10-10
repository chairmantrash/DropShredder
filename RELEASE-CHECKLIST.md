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

## Accepted-build identity
Current tested runtime source: cc315e4690b9a3cc5a16b4d6d6e3b6dd739bb0c6.
Tested harness: fe22e27b44424273d4b465d8af5cafbc40178bdb.
Exact candidate: 34 files, 47,483,460 bytes, 267 core tests and 38 distinct engineering browser checks. CI37979166327/CodeQL37979166013/Chrome37979165995 succeeded.
Current version 0.2.0 and minimum Chrome 133 are candidate metadata, not a promise of supported-version accuracy verified on every Chrome version.

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

