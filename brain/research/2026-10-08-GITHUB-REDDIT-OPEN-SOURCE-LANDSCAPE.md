# GitHub + Reddit open-source research for DropShredder — 2026-10-08

**Research scope:** shopper-facing product provenance, merchant identity, cross-marketplace image matching, review integrity, storefront fingerprinting, phishing intelligence, MV3 reliability, and false-positive controls. References were inspected as public GitHub/Reddit material on 2026-10-08. A README claim or anecdote is not independently validated performance.

**Disposition:** Research catalog only. NO dependencies, copied source, feeds, permissions, network calls, model, verdict weight, browser behavior, or release artifacts changed. Draft PR #9 stays unmerged. Engineering must perform license/security review, offline unit/e2e measurements, and real Chrome regression testing before adopting anything.

## Non-negotiable selection constraints
- No recurring spend, mandatory external API keys, credentials stored, injected tracking, telemetry, silent third-party product-photo uploads, or customer-facing page slowdown.
- Passive page alerts: bounded local-only analysis, opt-in across-site permission, high-precision product-page prefilter. Deep external research must remain explicit and user-initiated.
- Platform/theme, payment processor, country of origin, and language are **informational**, never negative by themselves. Seller deception must be established by sources and contradictions; dropshipping is not by itself a scam.
- Product photos replicated between suppliers and artisans do not establish the direction of copying. Never assert the earlier/original seller from a reverse-image search alone.
- Continue to use evidence independence tiers A/B/C/D, severe gating and ABSTAIN / UNKNOWN from brain/authority/EVIDENCE-POLICY.md. Preserve source/time/provenance on every claim.
- Treat code licenses, dataset licenses, service TOS and merchant image copyrights separately. No automatic legal permissions arise from GitHub visibility.

## Tier 1 — Highest-value projects and direct action

### 1. AliBadge — image-matched AliExpress price/markup and measured hard negatives
Source: https://github.com/navotvolkgroundup/alibadge
License: MIT, LICENSE confirmed from repository; repo non-archived as checked.
Observed: published Shopify variant-specific price extraction; uses /products/<handle>.js where accessible; source listing lookup via AliExpress image-search endpoint, dHash distance gate before match/markup display; candidate variant price sanity check; labelset/ fixture scoring, Playwright end-to-end, worker interruption/resumption checks. README claims 0 false positives for its 32 legitimate-brand product tests, but this is **author-reported on a small set**, not DropShredder's accuracy. Prior ungated label test reportedly made 4 Spigen and 4 OtterBox false accusations.
Fit: VERY HIGH for matched-product evidence, precision evaluation and quantitative negative sets.
Implement path: adapt IDEA of candidate retrieval separated from visual verification, exact variant/currency checks, and hard-negative fixtures; require a trustworthy user-reviewed candidate and at least another independent provenance signal to make a serious inference. Retain local hash calculation, bounded image acquisition and independent tests.
Hard blockers: AliBadge's documented flow uploads product photos to AliExpress infrastructure and manipulates an AliExpress currency cookie; undisclosed background uploads or user-cookie mutation would violate our privacy/least-side-effect requirements. Upstream undocumented endpoints may break or be rate-limited; verify TOS and restrictions. NO direct background pipeline adoption.
Proposed tests: 20 original established-brand hard negatives, 20 suspect resellers, shared-stolen-image cases, variant-vs-compare-at-price, multiple currencies, empty search, and CDN no-CORS. Record precision/recall separately and never imply 0 false positives universally.

### 2. Vibeprint — measured abstention and true built-MV3 tests
Source: https://github.com/erkanrzgc/vibeprint
License: MIT confirmed. Non-archived.
Observed: deterministic page snapshot/isolated rules, documented real-site corpus 71 sites, negative controls, confidence-calibrated wording, build-vs-test ordering, manifest-test gate, WXT/Playwright testing. Reported corpus stats are its own project not proof of DropShredder's scoring.
Fit: VERY HIGH for avoiding recent DropShredder live Chrome permission/sidepanel failures.
Implement path: require checked-in locally redacted actual commerce/normal/sensitive page fixtures and hard-negative labeled regression corpus; coverage gating for **false product-page alerts and false accusations**; Playwright against built MV3 extension in un-managed real Chromium with service worker active; plus owner-run real Chrome 154 matrix. Keep negative fixture fail reasons explicit, not just absence of badge.

### 3. Stackpeek extension — storefront technical-fingerprint architecture
Source: https://github.com/tonic20/stackpeek-extension
License: MIT confirmed. Non-archived.
Observed: open-source MV3 side panel, page-origin-stripping, script/link asset patterns, store theme/app/pixel fingerprints and page collection bridge. Upstream may submit fingerprint data to proprietary backend: their backend and corpus are **not open source**.
Fit: HIGH for Shopify ecosystem fingerprinting and shared merchant infrastructure investigation.
Implement path: build an *original*, bounded local fingerprint dictionary from publicly observed assets: themes, review widgets, shipping/fulfillment app families, Shopify/Shopline/BigCommerce/WooCommerce. Expose 'observed technology', not 'fraud'; only cross-site owner links corroborated independently can influence verdict. Collect no tracking identifier or upload from Upstream.
Test: similar Shopify CDN rewritten asset URLs, minified scripts, ordinary well-known retail controls, stale/missing assets, false shared-analytics 'same owner' inference.

### 4. tldts — robust effective-domain grouping
Source: https://github.com/remusao/tldts
License: MIT confirmed at repo/package. Public suffix parser and hostname normalization.
Fit: HIGH as a compact, well-maintained domain-parsing primitive.
Implement path: compare with existing URL/domain utility; add only if need proven. Determine eTLD+1 using public suffixes, handle co.uk, com.au, punycode, private suffixes, localhost, IP, storefront subdomains, IDN lookalikes. Do not cluster unrelated Shopify stores by *.myshopify.com or pages under hosting platforms.

### 5. Phishing.Database — curated free threat-intelligence seed
Source: https://github.com/Phishing-Database/Phishing.Database
Community review/false-positive processing: https://github.com/Phishing-Database/phishing
License: MIT as published in database LICENSE; *check licensing of each downloaded feed/artifact independently*.
Fit: HIGH for a distinct exact-match 'known reported phishing' security evidence track, not for generic dropshipping detection.
Implement path: offline build-time snapshot / optional local differential update with explicit version, attribution, domain-vs-URL match semantics, false-positive/allowlist, TTL/stale-state, no query leakage. A reported hit should explain feed, last update, type, and whether URL/domain matches. Treat false positives/reused domain as critical.
Budget: feed can be very large; never ship huge uncompressed whole-world database unless benchmarked. Investigate filtered compact matching/opt-in update. Do not turn absence from feed into 'safe'.

## Tier 2 — useful patterns with conditions

### 6. Free Reverse Image Search
Source: https://github.com/benjaminc-tech/free-reverse-image-search
License: MIT confirmed.
Observed: standalone JS UI with Google Lens, Yandex, Bing, TinEye user-click links; on-device aHash, dHash, pHash, EXIF/C2PA inspection and test fixtures. No own world-scale image index, and cross-origin remote fetches can be restricted.
Use: one visible Deep Hunt fan-out to user-selected reverse search service(s); optional local image-hash robustness checks; no automatic external image upload or false C2PA/authenticity implication.

### 7. Image Tools extension
Source: https://github.com/scorvus99/image-tools-extension
License: MIT confirmed.
Observed: direct image context menus and multi-engine visual/product lookup, including AliExpress, privacy/no-own-server design. Some source options involve sensitive face recognition, which is OUT OF SCOPE.
Use: UX patterns only for product-image right click, explicit engine selection, result tab limit, no credentials.

### 8. TrueKart / AI product-image detector
Source: https://github.com/yshraj/ai-product-image-detector
License: MIT confirmed.
Observed: product-grid image badges, selective vendor adapters, evidence UI, optional token-based model/ONNX. Its no-token preview heuristic is not robust proof that imagery is AI generated.
Use: platform-specific image-selector fixtures and transparent uncertainty controls. Do not turn on heuristic 'AI fake' alerts, mandatory HF tokens or big local models without independent real-photo adversarial measurement and performance budget. Not beta blocker.

### 9. Knockoff — Amazon pseudo-brand UI/feedback and brand lists
Source: https://github.com/Shpigford/knockoff
**License: FSL-1.1-MIT future license** (confirmed in current LICENSE, NOT currently plain MIT); public code is a frozen snapshot, upstream updates proprietary. Check FSL terms and conversion date before reuse.
Observed: local allow/blocklist first, configurable badge/dim, user correction flow, community brand data, unbranded/name-shape heuristics.
Use: design inspiration for override and 'wrong flag' feedback; NEVER copy licensed code/data casually; do not penalize name language, regional ownership, nationality or unknown brand without relevant independent evidence. A new brand can be genuine.

### 10. ColdStamp — documented checkout dark patterns and forensic privacy
Source: https://github.com/antonefremov/coldstamp
License: AGPL-3.0 (confirmed), license compatibility counsel review required before copying.
Observed: optional local checkout consent snapshots, redaction, recurring-payment/confirmshaming checks, deterministic release hashing.
Use: conceptual test fixture taxonomy and redaction patterns only; DropShredder deliberately refuses sensitive checkout/payment/account surfaces, so do not inject there or intercept requests.

### 11. eBay DS Research Extension — read-only multi-retailer adapter patterns
Source: https://github.com/moiz-za/eBay-ds-research-ext
License: not inspected; do not import code until verified.
Observed per author: eBay/Amazon product extraction, sourcing to Walmart/Target/AliExpress/CJ, SPAs, no required keys.
Use: negative/positive DOM fixtures, differing marketplace price/variant/seller fields. Note original tool serves sellers, not independent shopper evidence; calculations and assumptions differ.

### 12. Legacy Wappalyzer fingerprints / WhatWeb
Sources: https://github.com/dochne/wappalyzer and https://github.com/Ardynai/whatweb
Observed: technology fingerprinting using meta/script/style/DOM/header evidence; legacy Wappalyzer fork of now-private original; WhatWeb GPLv2.
Use: taxonomy reference only. Audit per-fork/per-file licensing, freshness, regex ReDoS, fingerprint side effects. Better to write tiny bounded local storefront observations than embed massive stale full-stack databases.

## Tier 3 — useful intelligence but NOT for product embedding
- DuckDuckGo Tracker Radar: https://github.com/duckduckgo/tracker-radar — rich third-party ownership dataset **CC BY-NC-SA 4.0**, restrictive for free public software potentially used commercially. Avoid redistributing/reusing dataset without terms review. Shared analytics domains DO NOT prove common ownership.
- urlscan.io: https://urlscan.io/docs/api/ — upstream API requires authentication for some result endpoints since 2026-05-04; scan submission may publicize URLs and sensitive query contents. Do not add implicit scans, secret API dependencies or URL leakage. Manual navigation to public site may be informational but no core dependency.
- Gemini Product BS Detector: https://github.com/dynamicwebpaige/product-bs-detector — external Gemini account/key, network grounding; incompatible with *no API keys / free-local default*. Research concept of independent forum complaint confirmation only.
- Fake Review Detector: https://github.com/BAOSDEV/fake-review-detector — backend FastAPI and unverified dataset/model generalization; rule ideas can be measured offline, but do not label real customer reviews fake from style alone.
- Seller automation tooling (e.g. https://github.com/bagisto/laravel-aliexpress-dropship-chrome-extension and https://github.com/BuzzGoMax/dropshipping-mcp-dsers): adversarial research on how imported SKUs/photos/variants/reviews can retain upstream fingerprints; don't run these against stores, access accounts, import products, or automate commerce.

## Reddit shopper findings + critical counterevidence (anecdotal, not labels)
1. https://www.reddit.com/r/EtsyCommunity/comments/1dc3ghl — poster and replies cite repeated identical product photos at inconsistent prices and **artists reporting photos stolen by manufacturers**; thus image duplication is bidirectional and ambiguous.
2. https://www.reddit.com/r/Etsy/comments/1mv13l6 — real furniture image duplicates and reply indicating independent makers' photos also copied. Add hard-negative fixtures for original artisans with downstream knockoffs.
3. https://www.reddit.com/r/Etsy/comments/1ora1w1 — shoppers explicitly unable to distinguish resold AliExpress goods from AliExpress copies of handmade pieces.
4. https://www.reddit.com/r/Etsy/comments/18d6qfj — user methods include reverse image, exact-title phrase search, product material checks; note legitimate artisans also sell on Amazon Handmade.
5. https://www.reddit.com/r/Etsy/comments/125zcyg — same imagery and widely different prices can identify a **price-comparison lead**, but still not authorship or quality.
6. https://www.reddit.com/r/chrome_extensions/comments/1phhfo2/i_built_a_free_alternative_to_koala/ — community announces ShopLens tech-app detection, including newer Shopify CDN path tricks; commercial store link, **not verified open source**. Treat 80–90% accuracy claims in replies as anecdotal.
7. https://www.reddit.com/r/dropship/comments/1q8ocn1/is_dropshipping_actually_a_real_business_or/ — community emphasizes that dropshipping is a legitimate fulfillment model used honestly or dishonestly; don't label every direct-shipped listing a scam.

**Derived false-positive fixture matrix:** original Etsy handmade photographed then copied onto wholesale listings; white-label legitimate brand selling identical supplier item transparently; original manufacturer with many resellers; POD designs using outside printing; a seller stocking foreign goods domestically; legitimate low-reputation new brand; Shopify store with review-import app but authentic reviews; Asian-established brand with unusual English name; product image CDN resizes/crops; affiliate sites linking original photographs; country/host shared without common ownership.

## Buildable DropShredder research backlog (not yet implemented)

**R1/P0: Product match evidence calibrator**
- Pure module takes matched candidate URLs, image hashes, exact product identifiers, title tokens and variants; records independent evidence and rejects high-risk conclusions for mere image duplicates; compare actual current sale price and currency, never strike-through compare-at pricing. Test negative controls from AliBadge + Reddit counterexamples. Ship only after measured precision.

**R2/P0: Real-page labeled corpus + Chrome end-to-end tests**
- Build redacted fixture corpus from a range of true product/collection/search/blog/login/checkout/SPAs on supported stores, along with normal shopping pages from reputable brands, false-shop storefronts and wrong-tab scenarios.
- Gate auto-toast false positive rate and false severe verdicts independently, manifest worker active, live sidePanel.open from user click; CI simulations plus owner-run real Chrome. Compare performance and permission side effects.

**R3/P1: Local storefront fingerprints**
- Bounded metadata/script/link-origin fingerprint classifier, independent from fraud scoring; optional reviewer/fulfillment app identity labels and human-readable evidence. Do not ingest external analytics tracker databases unexamined.

**R4/P1: Optional local threat-intelligence seed**
- Validate exact-match Phishing.Database license and source update integrity; compact privacy-preserving feed refresh, source timestamp, false-positive override, no scraping or silent third-party scans. Threat category shown separately from quality/dropshipping suspicion.

**R5/P1: Precise domain graph foundation**
- Benchmark tldts against the current domain utility; normalize internationalized hosts, tenant boundaries, and public suffixes, and never equate shared hosting with merchant ownership.

**R6/P2: Product image Deep Hunt ergonomics**
- Give the user clearly labeled source search buttons (Lens/Yandex/Bing/TinEye), a bounded local hash comparison, and human-understandable 'same picture' vs 'same physical SKU' vs 'unknown origin' distinctions. No silent uploads.

**R7/P2: User-facing bad-verdict reporting**
- Offer local correction/allowlist and an optional sanitized issue template without automatic telemetry; anonymize site URL sensitive query info.

### Adoption gates
1. Verify exact dependency/data license, update and provenance; security scan every imported file and limit permissions.
2. Establish measured value over current DropShredder in positive **and** hard-negative fixtures.
3. Enforce explicit opt-in for any external lookup, no secret image uploads or user-cookie side effects.
4. Verify worst-case CPU, image bytes, DOM traversal, network and storage; preserve the fast, nonintrusive toast path.
5. Manual browser compatibility for Chrome 154 on Linux including already-open panel, SPA, tab switch, navigation races.
6. Preserve PR #9 draft; do not merge without owner permission.

**Key conclusion:** prioritize AliBadge's calibration/variant logic and Vibeprint's browser/corpus gates, then Stackpeek's bounded technical fingerprints, then tldts and vetted threat-feed options. Reuse *ideas and evidence methodology* ahead of code. Absent true market-wide image indexing, an extension cannot guarantee it has discovered the original factory or price source.
