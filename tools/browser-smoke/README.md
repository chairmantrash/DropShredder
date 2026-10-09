# Packaged Chromium runtime smoke

This independent tooling package runs the production MV3 extension in full Chromium on GitHub Actions. CI uses the documented Chromium headless channel to avoid flaky Xvfb screenshot capture; a headed Xvfb mode remains available. Both use a real extension runtime. Playwright 1.64.0 is pinned in its own lockfile and is not a runtime extension dependency. No accounts, keys, paid providers, additional production permissions or servers are required.

The runner uses actual Chrome APIs and UI controls. It does not fake APIs, change the manifest, write saved settings directly, grant permissions behind the UI, or invoke private extension methods. Read-only Chrome queries establish state. The owned product fixture supplies page content only; it is not evidence of live-store accuracy. The runner stops at the first failure, with no retries, and preserves a JSON report and screenshots.

Coverage: exact reviewed package hashes, MV3 loading, panel document rendering, missing optional grants, an unsupported-page scan, rejection of settings messages from regular extension tabs, display preferences/reset, absence of pre-consent dynamic scripts/network investigations, and full profile restart persistence of display/default state. Regular-tab settings rejection is a distinct sender guard check, not a native-settings success. The initial R05 fixture incorrectly attempted settings changes from regular tabs; its failures are retained as historical test-context evidence.

This is an automated real-browser subset. It is not the independent A01-D06 QA protocol. In `run.mjs`, panel HTML is opened in a browser tab; native mounting and consent are covered separately below. Calibrated merchant/category accuracy, the full context-menu UX and live RDAP/CPSC provider behavior remain unverified. Target switching and search batches are covered by the expanded native suite. Do not mark DS-031 DONE from this workflow.

The separate `probe-native.mjs` uses the browser-scoped public `Extensions.triggerAction` API on a `tab` target. Playwright does not expose native panel WebContents in its page list, so the runner attaches using public `Target` protocol messages. Trusted `Input.dispatchMouseEvent` and `Input.dispatchKeyEvent` operate the actual controls; read-only DOM/storage queries verify results. N01–N07 assert native mounting, source/origin/tone saves without lost patches, full-profile restart with nondefault preferences, a product scan failing closed without host access, safe no-grant access removal and no uncaught errors/external investigations. Failures return a nonzero exit and preserve evidence. Its unsafe-extension-debugging flag is limited to the disposable test profile and is never part of the delivered extension.

After those assertions, a separately accounted exploration clicks the real automatic-alert control and records whether Chrome's request settles, host access and registered scripts. It never accepts/denies a browser prompt through an override. A pending or implicit result is not explicit permission-UI QA. In headless mode the Chrome permission request remains pending; no full scan is claimed.

The headed `DS_NATIVE_HEADED=1` runner uses Xvfb and `scrot` to capture the actual X11 desktop, including Chrome browser chrome and native dialog. Screenshot evidence on b9eef2e9 established focused Deny and following Allow buttons. `xdotool` sends Return to Deny, then Tab/Return to Allow after a fresh genuine request and the button-enable delay; N08/N09 assert resulting permission, UI, feature state and registration. Headed panel clicks use X11 pointer input mapped from DOM geometry to the observed Chrome window bounds, with strict size/visibility/hit-test guards and recorded insets. Headless mode retains trusted CDP input. If geometry, focus or dialog behavior differs the checks fail; no permission override is used. N10–N14 then verify one owned-product alert, full product scan (title/SKU/price), quiet article and sensitive sign-in fixtures/manual refusal, revocation of accepted access and absence of uncaught errors/external investigations. These are owned fixture checks, not live merchant/category accuracy or the independent desktop protocol. Every decision has before/after desktop screenshots. Concurrent panels and broader browser/category coverage remain open.

R06 now measures large-text layout at 320, 380, 420 and 640 pixels and saves each screenshot. It rejects horizontal overflow and title squeezing; human visual inspection remains a separate check.

Run on a desktop/CI host permitting Chromium sockets:

```sh
npm ci
npm run build
npm ci --prefix tools/browser-smoke
node tools/browser-smoke/node_modules/playwright/cli.js install --with-deps chromium
DS_BROWSER_HEADLESS=1 node tools/browser-smoke/run.mjs
node tools/browser-smoke/probe-native.mjs
# Genuine Chrome permission UI on Linux with scrot and xdotool installed:
DS_NATIVE_HEADED=1 xvfb-run -a -s '-screen 0 1920x1080x24' node tools/browser-smoke/probe-native.mjs
# Alternative headed desktop mode:
xvfb-run -a -s '-screen 0 1920x1080x24' node tools/browser-smoke/run.mjs
```

The candidate hash manifest identifies production source `cb82ea8a06f987a529dc8fc70914aa36eb6c5377`. It includes controlled reference intelligence, manual exact-LEI lookup, lifecycle/variant/export guards, native dialog focus retention and an Amazon product-title correction. Review and regenerate all file hashes from a clean build when production changes. Both runners also reject unexpected or missing files. Reports identify the exact harness checkout and browser version.

Expanded headed checks N15–N25 cover actual redacted downloads, dynamically introduced sensitive fields, SPA/in-flight and tab-switch invalidation, focus/Escape and max-eight search batches, same-URL variants, RDAP/CPSC cancellation/error behavior, explicit feed preview/save/update/rollback/reset, live GLEIF and an owned Amazon accessibility-heading regression. Provider fixtures intercept public HTTP responses only; they do not override Chrome APIs or consent. N24 uses the live GLEIF endpoint with no interception. Optional `DS_LIVE_SURFACES=1` records four convenience-sample storefront observations separately; blocked sites and unknown results are not accuracy passes.

Feed cryptography/corruption/expiry/key trust and mutation serialization are covered by core tests. Native signed-key onboarding, file-picker import, malformed browser storage, concurrent panels, full context-menu interaction, live RDAP/CPSC and independent release/category acceptance remain separate gaps. Manual weekly refresh is a saved reminder, with no background scheduling.


Primary methods: https://playwright.dev/docs/chrome-extensions, https://playwright.dev/docs/ci, https://chromedevtools.github.io/devtools-protocol/tot/Extensions/ and https://developer.chrome.com/docs/extensions/reference/api/permissions. Permission requests require Chrome's genuine user gesture and prompt; X11 desktop input supplies that gesture without granting behind the UI.
