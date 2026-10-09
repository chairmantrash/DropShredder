# Packaged Chromium runtime smoke

This independent tooling package runs the production MV3 extension in full Chromium on GitHub Actions. CI uses the documented Chromium headless channel to avoid flaky Xvfb screenshot capture; a headed Xvfb mode remains available. Both use a real extension runtime. Playwright 1.64.0 is pinned in its own lockfile and is not a runtime extension dependency. No accounts, keys, paid providers, additional production permissions or servers are required.

The runner uses actual Chrome APIs and UI controls. It does not fake APIs, change the manifest, write saved settings directly, grant permissions behind the UI, or invoke private extension methods. Read-only Chrome queries establish state. The owned product fixture supplies page content only; it is not evidence of live-store accuracy. The runner stops at the first failure, with no retries, and preserves a JSON report and screenshots.

Coverage: exact reviewed package hashes, MV3 loading, panel document rendering, missing optional grants, an unsupported-page scan, rejection of settings messages from regular extension tabs, display preferences/reset, absence of pre-consent dynamic scripts/network investigations, and full profile restart persistence of display/default state. Regular-tab settings rejection is a distinct sender guard check, not a native-settings success. The initial R05 fixture incorrectly attempted settings changes from regular tabs; its failures are retained as historical test-context evidence.

This is an automated real-browser subset. It is not the independent A01-D06 QA protocol. The panel HTML is opened in a browser tab, so native toolbar/side-panel mounting is untested. Native permission prompts, post-grant product scans/toasts, merchant accuracy, target switching, context menus, search batches and live RDAP/CPSC remain untested. Do not mark DS-031 DONE from this workflow.

The separate `probe-native.mjs` uses the browser-scoped public `Extensions.triggerAction` API on a `tab` target. It opens the native side panel without a source/manifest change. Playwright does not expose that WebContents in its normal page list, so the diagnostic attaches using public `Target` protocol messages. Trusted `Input.dispatchMouseEvent` clicks the actual native controls; only read-only DOM/storage queries verify the result. It observes native-panel mounting and one saved source-hunt toggle, with a screenshot. It does not test native permission prompts, multiple panels, all settings, or full product scans. Its unsafe-extension-debugging flag is limited to the disposable test profile and is never part of the delivered extension.

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

The candidate hash manifest identifies source 764e892a2cdddcfc8ac08f70d159d3e965fe9181. If production code changes, review and regenerate that manifest explicitly; a mismatch fails rather than silently testing a different build. Reports also record the exact harness checkout SHA and browser version.

Primary methods: https://playwright.dev/docs/chrome-extensions and https://playwright.dev/docs/ci.
