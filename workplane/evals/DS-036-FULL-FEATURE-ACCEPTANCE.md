# DropShredder complete-feature acceptance — independent QA packet
Date: October 9, 2026
Release integration: draft PR #9, branch `release/security-performance-hardening`
Engineering receipt: `workplane/runs/DS-036-FEATURE-CONVERGENCE-20261009.json`
Candidate manifest: `tools/browser-smoke/candidate-build-info.json`.

## Contract
A full-feature candidate is **ready for testing**, not proven safe, accurate, or fit for publication. No main merge, Web Store publication, credentials, paid services, mandatory backend or account setup. Use the **exact unpacked artifact from a green Chromium run at the pinned source tree** rather than an older ZIP or editor directory. Every test must record Chrome version/OS/URL/time, expected and observed result, screenshots, browser console and scrubbed traces, and whether the subject was truly observed or blocked by anti-bot restrictions. No independent verdict counts without trusted merchant/product truth labels.

## P0 — common functional pathways
- A01 launch Chrome as an unpacked extension; ensure action opens native side panel, no required broad host permission or console errors; test small/narrow and scaled text layouts.
- A02 open ordinary article, checkout, login, account, banking and search pages; ensure no unwanted toast, no secret/form interaction. A genuine product detail with visible offer and permitted auto mode should show one top-right passive, bounded, user-dismissable toast, with UNKNOWN rather than unsupported accusations.
- A03 toast click opens full native analysis for originating tab; tab switching, SPA variant changes, closed tabs, replaced documents and multi-window/multi-panel races must cancel/reject stale content and exports.
- A04 remove optional site access, disable protection, restart browser, verify stored prefs preserved, dynamic content registration removed, already injected scripts fail closed, and zero passive external investigations.
- A05 external site/merchant/supplier/image searches display real target domains and require explicit user choice, open no more than 8 tabs, and do not forward signed image URL query tokens.
- A06 run repository audits, full core tests, CodeQL, Chrome packaged/headed smoke jobs, verify SHA-256 inventory and actual zip/unpacked artifacts correspond to same source tree.

## P0 — newly completed features
- F01 local product vectors: compare brand/model distinct negatives and cross-brand near-copy positives. Verify no unscored candidate becomes automatic supplier/dropship verdict. Different colors/sizes/GTINs must not be merged as exact identities.
- F02 entity role graph: import references with separately sourced manufacturer/importer/seller including conflicting roles and copied legal names. Confirm no inferred factory ownership and no fraud-risk weight.
- F03 marketplace result badges: Amazon search, Etsy search, Walmart search. Only product cards receive neutral “Check with DropShredder” links, no bogus badges on home/category/navigation, no silent third-party requests. Clicking badge must navigate to legitimate same-origin product URL with tracker parameters removed. Dynamic lazy-load cards require explicit re-entry/navigation if unsupported; verify no DOM observer CPU spike.
- F04 weekly intelligence auto-refresh: off by default, Chrome alarms registered only on opt-in, no recurring page scans. With an **owned fixture publisher** provide verified Ed25519 signed v1/v2 with independent pubkey pin and existing Chrome host grant; simulate 7 days, verify v2 succeeds, rollback/expired/tampered/unsigned/wrong-origin/wrong-key and revoked permissions all do not replace data. Removing keys/turning off disables network; no new permission dialogs from alarms. Review rate limits, retry throttling, Web Store privacy disclosure.
- F05 offline OCR: generated controlled English label, real photographed packaging and deliberately blurry/rotated/multilingual negatives. Product label selected via native OS file picker must remain on device, under size/dimension limits; Tesseract code/WASM/English data must load from `chrome-extension://` only after click, never from CDN. Barcode checksum candidate and OCR text must stay informational. Cancellation before/after worker init must not leave background workers running. Verify 60 MB package budget.
- F06 optional BYO-key Brave Search: user must explicitly supply key and query and approve API host. Verify key is never saved to chrome.storage, logs, report, artifacts, screenshot, URL or persistent DOM; one-shot request sends only query and provider auth header, no cookies, no redirects. Denied permission, invalid key, HTTP 429, timeout, oversize JSON, revoked permission and mismatched results fail closed. Potential provider account fees must be disclosed; core works with no key.
- F07 safety issuer/role scope: packaged notices are snapshots and CPSC results are retrieval candidates. Verify no rating or authenticity judgment from unverified issuer/certificate or missing recall, and negative serial/lot/unit exclusions take precedence.

## P0 — representative model performance
Construct an independently rights-cleared, merchant and product-disjoint ground-truth corpus for:
- Shopify, Shopline, Shoplazza, Wix, Squarespace, WooCommerce, custom storefronts
- Amazon/Etsy/Walmart, manufacturer-direct goods, local sellers, wholesale private labels, made-to-order, print-on-demand, legitimate resellers
- apparel, accessories, electronics, furniture, pet goods, cosmetics and toys, domestic and international shipping
- high-risk and benign adversarial lookalikes, duplicate generic photos, counterfeit claims without proof, swapped variants, inactive stores

Compute per-stratum precision, recall, false-positive rate and UNKNOWN/abstention share. Report confidence intervals and sample counts; DO NOT convert raw heuristic evidence scores to probability of fraud. Declare a launch gate failed if the user has not accepted thresholds or independent ground truth is insufficient. Avoid commercial sites' private/internal endpoints and do not bypass paywalls/captchas.

## P1 — accessibility, usability, operations
Contrast and keyboard navigation, reduced-motion notifications, text scale, side-panel empty states, manual feed preview/signing source explanation, live CPSC/RDAP requests with consent, provider API license disclosure and unknown issuer handling, work on 32+ page tabs with memory caps, clear observation/history/store keys, signed-list outage recovery, and long-running idle background chrome. Confirm no mandatory user action on laptop required just to exercise hosted synthetic tests.

## Stop/escalation protocol
- Do not change source or guess paths/keys to make tests pass. Produce failing test ID, actual URL (strip auth/query), browser event/result and reproduction steps for the engineering agent.
- Do not claim release approval or main merge.
- If app/site provider access unavailable, record **NOT EVALUATED**, never PASS.
- Pin the tested artifact SHA and source tree, not an individual test outcome on an unpinned checkout.
