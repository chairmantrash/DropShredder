# DropShredder — REAL CHROME BETA VALIDATION AGENT

**Role:** Independent **QA / browser-testing agent only**. You are NOT the engineering or repair agent.

**Project:** `chairmantrash/DropShredder`
**Candidate:** unified draft PR #9, branch `release/security-performance-hardening`; inspect the exact production source/manifest in the supplied BUILD-INFO.json. PR #11 was already integrated into this release candidate. Never merge to `main` or publish.
**Exact extension build:** commit `[sourceCommit from BUILD-INFO.json]`, Chrome MV3, extension version `0.2.0`, Chrome **133 or newer**.
**Test subject:** the attached `DropShredder-Unpacked/` directory (unzip the supplied Work Agent QA bundle first). The `manifest.json` must be immediately inside this directory.

## NON-NEGOTIABLE ROLE BOUNDARY

You are a **test operator, not a developer**. Do not edit source or built files, patch scripts, modify permissions or manifests, change extension internals, create commits/branches/PRs, merge PR #9, run npm builds, or use GitHub calls to fix anything. Do not uninstall/reinstall to hide a defect. Do not spend cycles researching or designing a fix. Diagnose *only enough* to report an accurate, reproducible failure with evidence. Do not claim a test passed if it was not executed in a real, interactive desktop Chrome/Chromium extension runtime.

**Stop immediately at the first release-blocking failure, security/privacy problem, or blocker.** For ordinary failures, you may retry the identical action **once** to confirm reproducibility, then STOP. Do not proceed to later tests. For sensitive page scanning, credential/card-data access, wrong-tab analysis, misleading severe accusations, or major slowdown, **stop without retrying**. Return the structured **ENGINEERING HANDOFF PROMPT** shown below for the owner to paste to the original DropShredder engineering agent. **Only that agent may fix code.** If an environmental limitation prevents loading an unpacked extension (e.g., a managed cloud browser won't load Chrome extensions), stop and use the same handoff format with status `ENVIRONMENT BLOCKED`; do not claim tests passed or spend time finding a workaround.

## Setup (no development work)

1. Extract the attached Work Agent QA ZIP into a working folder. Keep `DropShredder-Unpacked/` intact; its `manifest.json`, `background.js`, `content-scripts/auto.js`, `sidepanel.html`, `assets/`, and `chunks/` must remain at their packaged relative paths.
2. Use a **real desktop Chrome/Chromium 133+** instance that permits unpacked extensions. Prefer a clean temporary testing profile; do not log into any personal accounts or enter any credit cards.
3. Go to `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select the **`DropShredder-Unpacked` directory** (not the outer QA folder and not a ZIP file). Do not install the Chrome Web Store ZIP.
4. Capture: Chrome exact version (`chrome://version`), OS, extension version, extension ID, test date/time, source commit, and whether any older DropShredder instance was installed. If the extension fails to load, record the Chrome error and stop.
5. Keep a small test log of each executed test: ID, URL stripped of query/fragment, expected, actual, PASS/FAIL/NOT RUN, elapsed time if relevant, relevant screenshots, and errors. Never capture/share passwords, card fields, cookies, private account information, or full URLs with tokens.

## Phase A — FIRST-PASS SHOWSTOPPERS (in order; stop on failure)

**A01 — Install and startup.** With no optional host grants yet, confirm toolbar icon, extension page, side panel, service worker (if Chrome exposes its Inspect link), correct version, and no launch or extension-load errors. Static CI results do not count as a browser test.

**A02 — No unsolicited monitoring before consent.** Open `https://www.apple.com/iphone-17/` or its current manufacturer product-detail equivalent. Before opting in to automatic alerts, there should be **no automatic toast**. The side panel's manual **CHECK THIS PRODUCT** button should remain available. Do not assume Apple itself is a suspicious seller or that its promotional landing page is necessarily a purchasable product detail.

**A03 — Denied auto permission.** Switch **Automatic product alerts** ON, then deny Chrome's site-access permission. Verify checkbox/status reflect denial and no automated verdict appears on a fresh product page. Do not grant silently.

**A04 — Granted auto permission.** Switch ON again and grant Chrome's HTTPS site-access request. Confirm settings remain ON. Navigate to a **clearly purchasable individual product page** (one product, title, price, and Buy/Add to cart). Verify exactly one short **top-right sliding toast**, with useful product facts and any observed red flags; no self-congratulatory or nagging reminder text. If page is an Apple marketing overview with no actual buy/price controls, record it as an *uncertain/quiet page* and use a direct buy-ready listing for this test; do not force success.

**A05 — Evidence quality.** Read the quick verdict critically. It must never say "safe," "clean," "confirmed dropship slop," "scam," or imply high merchant trust from absent evidence. Weak observations must be weakly worded, and platform/country/importing alone must not count as misconduct. Verify title, price, seller (if supplied) and explanatory red flags match the **visible target product**, not unrelated recommendations.

**A06 — Toast click.** Click **Open full check** on the toast. It must open the side panel and automatically start the **full scan of that same tab/document**. It must not display a silent no-op or "open a product page" when you are already viewing a permitted product page. Verify results appear and the controls are usable. Capture the status/error verbatim on failure.

**A07 — Manual scan regression.** On a separate supported HTTPS product page, click **CHECK THIS PRODUCT**. Grant narrow site access if Chrome requests it. The visible product must be analyzed; the right page must be stamped; no account/payment fields inspected.

**A08 — No nuisance on normal browsing.** With automatic alerts enabled, visit a general search results page, news article, Wikipedia or ordinary article page, and YouTube homepage. Expect **no toast**. No full forensic scan or external network requests should run merely because these pages contain product names or ads.

**A09 — No nuisance on store navigation.** Visit a store homepage, category/collection page, Amazon search results, Etsy search results, and Walmart search results. Expect **no toast** even if tiles show prices, reviews, or Add to Cart controls. A "product" in structured data on an article does not alone qualify.

**A10 — Sensitive-page privacy gate.** Use only **public, signed-out** store login/account or checkout landing URLs, without typing information. Expect **no automatic toast or scan**. The manual scanner should refuse sensitive pages. If a form already exposes a password or payment field, do NOT fill it. Any sensitive-data collection or scanning is an **immediate stop**.

**A11 — Repeat and close behavior.** Dismiss a toast; on the same product route and document it must not immediately reappear in a loop. Where possible, let a second toast disappear on its own (about 12 seconds). The close button must work; the toast must not block interaction with the website.

## Phase B — CHROME LIFECYCLE AND NAVIGATION (only if all A tests pass)

**B01 — Tabs.** Keep the side panel open; switch rapidly between two product tabs on distinct origins. A full scan must always target the **current intended tab**, never the prior product. Any wrong-tab scan is an immediate stop.

**B02 — SPA navigation.** On a React/Next/Hydrogen/modern storefront, navigate between products without a full reload. No previous-product toast/result may be applied to the next product. New product toasts are acceptable only when the page clearly qualifies. A route transition during a full scan must abort stale results.

**B03 — Rapid clicks.** Click CHECK THIS PRODUCT twice quickly; no duplicate simultaneous scans, repeated stamps, panel crash, or UI lock.

**B04 — Persistent panel.** Leave the panel open and click a new product toast. It must start the new item's full scan (not only work after closing and reopening the panel). Close/reopen the panel and recheck.

**B05 — Worker lifecycle.** On `chrome://extensions` use the service-worker Inspect control only to view/restart when Chrome permits; then test scan and toast click again. A worker restart or browser restart must not lose consent, confuse tab identity, or break commands.

**B06 — Revocation.** In the side panel choose **REMOVE EXTRA SITE ACCESS**. Confirm the optional grant is removed and automatic checks stop. Re-grant as a user action and verify they resume. Do not manually modify manifest or code.

**B07 — Unsupported schemes.** `chrome://extensions`, a `file://` page, and an extension/settings page must never be scanned or injected. Document only if Chrome itself blocks those pages.

## Phase C — CONTROL AND SURFACE COVERAGE (only after A/B pass)

**C01 — Platform smoke matrix.** Use live, public, single-product pages representing Shopify, WooCommerce, SHOPLINE, Shoplazza, ShopBase, Wix Stores, Ecwid, Squarespace, Amazon product, Etsy listing, Walmart Marketplace, direct manufacturer, and generic commerce. Record the *actual public site URL*, platform evidence, whether classifier/toast worked, and whether full scan reflects the listing. Do not invent links or force unsupported controls. If a page lacks purchase/price/product signals, record `UNCERTAIN — QUIET` instead of forcing a toast.

**C02 — Deep Hunt controls.** On a product already fully scanned, test **FIND OTHER SELLERS**, **SEARCH THIS IMAGE**, **CHECK THIS STORE**, **HOW OLD IS THIS SITE?**, **WHAT ARE BUYERS SAYING?**, **CHECK THE FINE PRINT**, and **WHERE DOES IT REALLY SHIP FROM?**. Each click must produce its advertised action or a clear specific error, never a silent no-op. For image/RDAP requests accept/deny only as directed by the case being tested; note Chrome's prompt. External services may block, rate-limit or change; record that as a distinct external limitation rather than inventing findings.

**C03 — Context menus.** Right-click a public HTTP/HTTPS page, product title/selection, and an image to test page/product/image/store hunts. Commands must produce bounded searches and correct target context. Unsupported/private contexts should not expose unexpected scanning.

**C04 — Product data and false positives.** Check a branded/manufacturer product, a generic commodity with multiple sellers, and an article about products. Absence of independent fraud evidence must remain UNKNOWN/INCONCLUSIVE. Shopify, overseas shipping, platform type, or nationality alone must not cause strong accusations.

**C05 — Heavy pages and network failures.** Visit a very large public category page and a long public product page with many reviews. Check scrolling, page responsiveness, CPU impact if available, and no repeated toast flood. For Deep Hunt use a slow/unavailable endpoint only where safe; operations must time out rather than hang indefinitely. Do not launch load tests or flood requests.

**C06 — Local controls.** Confirm tone/feature settings persist across panel reopen and restart; clearing local history reports success; revoking site access works. Verify visible report URLs do not expose token query parameters in saved history when accessible without invasive inspection.

## Phase D — RECONCILIATION REGRESSIONS (only after A/B/C pass)

**D01 — Target identity.** Verify recommendations-first JSON-LD does not supply the target title/price/image/rating. On ProductGroup variant pages, switch variants and confirm extracted values track a uniquely matched variant URL or remain unknown. Non-URL variant selection is an explicit coverage gap; never claim the displayed price was verified when attribution is unresolved.

**D02 — Settings.** Rapidly change source hunt, origin preference and tone in two open panels; changes must persist independently. Denying automatic-access consent must not enable monitoring. Reopening/restarting must preserve valid settings. QA must not directly alter internal saved data; malformed-state rejection is an engineering fixture result, not a browser pass.

**D03 — Search batches.** FIND OTHER SELLERS must show all destinations, including POD and Reddit. Before choosing, no remote search tabs open. Open at most 8 choices, then the remaining batch. Cancel must launch nothing. The product context-menu hunt uses a local chooser when more than 8 destinations exist. Check modal focus/Escape, keyboard controls and narrow layout.

**D04 — RDAP.** The domain lookup must request the exact registry host. Denial shows no cached result. Subdomains resolve to the registered domain, explicitly labelled; unknown/HTTP-only registries and redirects must give a clear limitation. Revoke during a lookup: no result should be applied. Website age must not be advertised as proof of business age, safety or dishonesty. Failures remain unknown.

**D05 — Display and export.** Test dark/light/system, large text, compact spacing, narrow widths, visible focus, evidence filter counts and appearance-only reset. Actual JSON download must work and omit raw credentials/private data. Report actual reflow and keyboard results, not DOM-test claims.

**D06 — CPSC.** Explicit field/query search only; deny/grant, cancel pending consent, change report during request and revoke access. No automatic request. Results are candidates, may be incomplete and do not alter the verdict; no-results is not a safety clearance. Check service errors/timeouts with no repeated requests.

## PASS / FAILURE POLICY

- Mark a test PASS only if you **observed it in real Chrome**. `CI green`, source inspection, screenshots of static pages, and synthetic Playwright tests are not substitutes.
- If Chrome prevents extensions from loading in your Work environment, immediately return `ENVIRONMENT BLOCKED`, stating precisely what it prevents and what remains untested. **No workaround engineering**.
- For any failure: capture one screenshot (redacted), exactly what was clicked, stripped URL, actual customer-visible message (quote verbatim), Chrome console error if any, expected behavior, and whether reproducible (one retry at most, except privacy/wrong-tab/severe accusation where no retry).
- Do NOT edit files, commit, research fixes, issue a PR, change CI, or continue to later test cases after a failure. A coherent report is the deliverable.
- For an optional external service being down, report `EXTERNAL BLOCKER` with exact control and failure detail; do not treat it as proof the service or app is working.

## ON ANY FAILURE: OUTPUT EXACTLY THIS COPYABLE ENGINEERING HANDOFF PROMPT

> **DROP SHREDDER — BROWSER QA FAILURE / ENGINEERING HANDOFF**  
> **TO:** Original DropShredder continuation engineering agent (not this QA agent).  
> **Action required:** Investigate and fix this failure in the existing `chairmantrash/DropShredder` repo and the supplied candidate branch, while preserving other agents' valid changes. Follow authority/workplane rules. Do not merge without owner authorization. Treat this QA report as evidence, not as a verified root cause.  
> **QA STATUS:** `[FAIL / PRIVACY STOP / ENVIRONMENT BLOCKED / EXTERNAL BLOCKER]`  
> **Build/commit:** `[sourceCommit from BUILD-INFO.json]`  
> **Test ID:** `[A01–D06]`  
> **Chrome exact version, OS, extension ID:** `[...]`  
> **Public page URL (remove query and fragment):** `[...]`  
> **Steps to reproduce:** `1. ... 2. ... 3. ...`  
> **Expected behavior:** `[...]`  
> **Observed behavior and verbatim UI message:** `[...]`  
> **Console errors (context: page / side panel / worker):** `[...]` or `not available`  
> **Screenshot / artifact references (redacted):** `[...]`  
> **Reproducibility:** `[...]`  
> **Completed tests before this failure:** `[...]`  
> **Tests not run:** `[...]`  
> **Security/privacy impact, if any:** `[...]`  
> **QA operator confirmation:** *No source, manifest, settings internals, GitHub branch, PR or release artifact was changed. QA stopped; fixes are delegated exclusively to the original engineering agent.*

Send this handoff **to the owner as copyable text for the original DropShredder engineering conversation**. You cannot assume you can post directly into that existing chat. Do NOT append possible code fixes or a speculative root-cause implementation plan.

## IF EVERY TEST THAT CAN BE RUN PASSES

Provide a concise **REAL CHROME QA PASS REPORT** with tested build, exact browser version/OS, every test ID with PASS/NOT RUN/UNAVAILABLE, actual URLs (without query/fragment), screenshots when useful, any untested platforms, time/CPU observations, and important limitations. Explicitly state that no engineering work was performed and PR #9 was not merged. Do **not** declare Chrome Web Store publication-ready without the owner's separate authorization.
