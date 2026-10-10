# Chrome automatic-alert permission revocation — cross-context idempotence

**Decision date:** 2026-10-09. **Context:** After adding native signed-feed and local-file tests to PR #11, hosted Chromium N13 reproduced an intermittent revocation failure. Chrome reported `Nonexistent script ID 'dropshredder-auto-shopping-v1'` because the side panel and background worker independently reconciled the same registration when site permissions were removed. The side-panel cleanup threw before saving `autoProtection:false`, even though host access was already removed.

## Accepted behavior
- The saved `autoProtection` gate is set to **false before** unregistering or removing optional host grants. Already-injected scripts consult this gate before posting a new toast.
- `setAutoContentRegistration(enabled)` queries exact script ID before mutation. A duplicate-registration or already-unregistered error is accepted **only if a fresh Chrome query confirms the requested final state**. Unexpected errors remain failures when the script state is wrong.
- Both background `permissions.onRemoved` reconciliation and user-initiated panel cleanup may execute simultaneously. No silent forced grants, new host permissions, nonstandard API calls, network requests, or telemetry are introduced.
- The normal uncheck flow also disables the saved flag ahead of unregister/permission cleanup. Revoke reports remaining HTTPS permissions if Chrome retains them.

## Evidence
- Failing hosted run on older source `1a67c113`: https://github.com/chairmantrash/DropShredder/actions/runs/37913673834
- Production fix and four race regression cases `src/runtime/auto-registration.ts`, `entrypoints/sidepanel/main.ts`, `tests/auto-registration-race.test.ts`.
- Fixed exact 14-file candidate pinned in `tools/browser-smoke/candidate-build-info.json`.
- Verified hosted run at last feature head `46cfa212`: https://github.com/chairmantrash/DropShredder/actions/runs/37914518107 — 250/250 core tests; N13, N26, N27 and remaining native checks PASS; packaged, CI and CodeQL green.
- Integrated into internal release branch by PR #11 merge `7271f9c`. PR #9 remains draft pending independent release/category gates.

**Not established:** Chrome behaviors outside the tested Chromium 156 desktop environment, all concurrent panel interleavings, independent A01–D06, or calibrated live merchant/category accuracy.
