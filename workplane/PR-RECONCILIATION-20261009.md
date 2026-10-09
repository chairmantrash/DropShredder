# Release branch reconciliation — October 9, 2026

## Canonical development / release boundary
- **Single open consumer-release PR:** #9, `release/security-performance-hardening` -> `main`, remains **DRAFT**.
- **Internal engineering integration:** PR #11 was merged into that release branch, merge commit `7271f9cafd54f6e2187a1bd4cc1835f9b09419c5`. Its verified source head was `46cfa212cf92e9db8ad624741cff2a760449347d`.
- **PR #10:** Its research branch head `0c826f9dc5c02f65760a203469bc218dd75fd9ba` was an ancestor of PR #11 and is integrated transitively. The redundant PR was closed after that merge. Do not cherry-pick.
- **PR #8:** Closed as **superseded, not merged**. Its former file paths are represented in newer release code but implementations have diverged. This is not a semantic-parity assertion; retain old history for targeted comparisons, do not overwrite current code.
- **PR #5:** Internal-only diagnostic export; not included in the consumer release.
- **Public release:** No changes to `main`, no Web Store submission, no declaration of independent release acceptance.

## Latest verified engineering candidate
- Source production build was pinned from commit `82e5c22a957bccab72c1bf480d7ed62f5f0d432e`, source tree `04dee382eab58c36392bd4ba01d7e5d748e2d31c`. Full 14-file SHA-256 manifest: `tools/browser-smoke/candidate-build-info.json`.
- The last feature head `46cfa212cf92e9db8ad624741cff2a760449347d` passed CI, CodeQL and all browser-runtime jobs: https://github.com/chairmantrash/DropShredder/actions/runs/37914518107
- Core tests: **250 passed, 0 failed**. Hosted Chromium: **9 packaged + 27 distinct native headed = 36 checks**; previously repeated headless checks must not be counted again.
- Regression N13 proved permission revocation now removes the dynamic script and disables alert settings despite panel/service-worker cleanup races. N26 verifies user-pinned ephemeral test signing key and signed-feed UI; N27 verifies actual extension-panel file-input dispatch and malformed JSON refusal, **not** the graphical OS chooser.
- Workflow retains an exact-head unpacked QA-only artifact with `BUILD-INFO.json`: https://github.com/chairmantrash/DropShredder/actions/runs/37914518107/artifacts/11609385758 . It expires November 8, 2026.

## Still required before release
1. Independent real-browser A01–D06 acceptance, including concurrent panels, native context-menu UI, OS file picker, malformed Chrome-storage recovery, and full visual/accessibility behavior.
2. Representative rights-cleared, merchant/product-disjoint storefront-category false-positive, miss and abstention calibration. Small live samples and fixture passes do not establish accuracy.
3. Live RDAP/CPSC endpoint behavior and certification issuer/lot/serial/model exclusion verification.
4. Real external feed issuer/rights/freshness review if signed subscriptions are to be advertised beyond user-pinned trust; current update/reminder and key-rotation are **manual**, not automatic.
5. Explicit owner authorization for `main` merge/publication. OCR and embeddings remain optional post-beta research, not hidden mandatory blockers.

Preserve the guardrails: free local-first core, no mandatory account/backend, no credential storage, user-chosen HTTPS requests, low passive CPU/network use, independence-weighted evidence and genuine UNKNOWN outcomes. See `START-HERE.md`, `brain/authority/PRODUCT-CONTRACT.md`, `brain/authority/EVIDENCE-POLICY.md`, and `workplane/evals/WORK-AGENT-TEST-PROMPT-20261009.md`.

## Implementation continuation DS-035
After PR #11 merged, the only development branch remains `release/security-performance-hardening` under draft PR #9. Additional source changes cover named storefront swatches + report invalidation, bounded lot/serial regulatory scope, automatic-toast signal visibility, and privacy-safe explicit reverse-image launchers. Source-to-artifact exact-hash and browser gate receipts must be regenerated for the new production bytes; the previous 250-test / 36-browser count is historical, not verification for DS-035. Do not treat these engineering enhancements as representative merchant accuracy or an independent A01–D06 acceptance pass.
