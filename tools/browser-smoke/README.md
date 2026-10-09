# Packaged Chromium runtime smoke

This independent tooling package runs the production MV3 extension in full Chromium on GitHub Actions. CI uses the documented Chromium headless channel to avoid flaky Xvfb screenshot capture; a headed Xvfb mode remains available. Both use a real extension runtime. Playwright 1.64.0 is pinned in its own lockfile and is not a runtime extension dependency. No accounts, keys, paid providers, additional production permissions or servers are required.

The runner uses actual Chrome APIs and UI controls. It does not fake APIs, change the manifest, write saved settings directly, grant permissions behind the UI, or invoke private extension methods. Read-only Chrome queries establish state. The owned product fixture supplies page content only; it is not evidence of live-store accuracy. The runner stops at the first failure, with no retries, and preserves a JSON report and screenshots.

Coverage: exact reviewed package hashes, MV3 loading, panel document rendering, missing optional grants, an unsupported-page scan, rejection of settings messages from regular extension tabs, display preferences/reset, absence of pre-consent dynamic scripts/network investigations, and full profile restart persistence of display/default state. Regular-tab settings rejection is a distinct sender guard check, not a native-settings success. The initial R05 fixture incorrectly attempted settings changes from regular tabs; its failures are retained as historical test-context evidence.

This is an automated real-browser subset. It is not the independent A01-D06 QA protocol. The panel HTML is opened in a browser tab, so native toolbar/side-panel mounting is untested. Native permission prompts, post-grant product scans/toasts, merchant accuracy, target switching, context menus, search batches and live RDAP/CPSC remain untested. Do not mark DS-031 DONE from this workflow.

The separate `probe-native.mjs` uses the browser-scoped public `Extensions.triggerAction` API on a `tab` target. Playwright does not expose native panel WebContents in its page list, so the runner attaches using public `Target` protocol messages. Trusted `Input.dispatchMouseEvent` and `Input.dispatchKeyEvent` operate the actual controls; read-only DOM/storage queries verify results. N01–N07 assert native mounting, source/origin/tone saves without lost patches, full-profile restart with nondefault preferences, a product scan failing closed without host access, safe no-grant access removal and no uncaught errors/external investigations. Failures return a nonzero exit and preserve evidence. Its unsafe-extension-debugging flag is limited to the disposable test profile and is never part of the delivered extension.

After those assertions, a separately accounted exploration clicks the real automatic-alert control and records whether Chrome's request settles, host access and registered scripts. It never accepts/denies a browser prompt through an override. A pending or implicit result is not explicit permission-UI QA. N08 runs an actual full scan on an owned HTTPS fixture only if Chrome has granted access and the UI settles. Otherwise that scan remains blocked. Owned fixtures cannot establish merchant/category accuracy. Genuine permission UI, granted-access revocation, concurrent panels and broad browser/category coverage remain open.

R06 now measures large-text layout at 320, 380, 420 and 640 pixels and saves each screenshot. It rejects horizontal overflow and title squeezing; human visual inspection remains a separate check.

Run on a desktop/CI host permitting Chromium sockets:

```sh
npm ci
npm run build
npm ci --prefix tools/browser-smoke
node tools/browser-smoke/node_modules/playwright/cli.js install --with-deps chromium
DS_BROWSER_HEADLESS=1 node tools/browser-smoke/run.mjs
# Alternative headed desktop mode:
xvfb-run -a -s '-screen 0 1920x1080x24' node tools/browser-smoke/run.mjs
```

The candidate hash manifest identifies source 4fd0b24c8cb5a11009d14bb1833b39656a210422, whose only production change from the previous candidate is masthead CSS. If production code changes, review and regenerate that manifest explicitly; a mismatch fails rather than silently testing a different build. Reports also record the exact harness checkout SHA and browser version.

Primary methods: https://playwright.dev/docs/chrome-extensions and https://playwright.dev/docs/ci.
