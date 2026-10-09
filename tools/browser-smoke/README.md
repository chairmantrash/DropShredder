# Packaged Chromium runtime smoke

This independent tooling package runs the production MV3 extension in full Chromium on GitHub Actions. CI uses the documented Chromium headless channel to avoid flaky Xvfb screenshot capture; a headed Xvfb mode remains available. Both use a real extension runtime. Playwright 1.64.0 is pinned in its own lockfile and is not a runtime extension dependency. No accounts, keys, paid providers, additional production permissions or servers are required.

The runner uses actual Chrome APIs and UI controls. It does not fake APIs, change the manifest, write saved settings directly, grant permissions behind the UI, or invoke private extension methods. Read-only Chrome queries establish state. The owned product fixture supplies page content only; it is not evidence of live-store accuracy. The runner stops at the first failure, with no retries, and preserves a JSON report and screenshots.

Coverage: exact reviewed package hashes, MV3 loading, panel document rendering, missing optional grants, an unsupported-page scan, concurrent panel feature changes, display preferences/reset, absence of pre-consent dynamic scripts/network investigations, and full profile restart persistence.

This is an automated real-browser subset. It is not the independent A01-D06 QA protocol. The panel HTML is opened in a browser tab, so native toolbar/side-panel mounting is untested. Native permission prompts, post-grant product scans/toasts, merchant accuracy, target switching, context menus, search batches and live RDAP/CPSC remain untested. Do not mark DS-031 DONE from this workflow.

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
