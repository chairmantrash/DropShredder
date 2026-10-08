# DropShredder — existing tools and capability gaps

Research checkpoint: 2026-10-08. Six tools documented; additional comparisons in progress. This report supplements earlier defensive-intelligence and research-gap catalogues. No runtime integrations, browser tests or accuracy claims.

All recommendations preserve local-first $0 core operation. Provider/tool presence and country of origin have zero risk weight. Third-party grades do not establish product quality or independent corroboration. Source presence means retrieval and dated observations, not a full web archive. Original source text/code is linked rather than redistributed.

## Catalogue

### TOOL-001 — Fakespot / Firefox Review Checker

**Capability:** review reliability. **Status/depth:** retired; Official shutdown announcement opened.

Mozilla announced Fakespot website/apps/extensions unavailable from 2025-07-01 and Firefox Review Checker ending 2025-06-10. Historical examples are not current integration candidates.

**Fit decision:** Exclude from live dependencies; retain historical UX comparison only.

**Reuse:** No reusable code or dataset examined.

**Engineering follow-up:** Add availability checks to all provider registries; unavailable services must fail to unknown, never a negative product verdict.

**Primary evidence:** [opened](https://blog.mozilla.org/en/mozilla/building-whats-next/?pubDate=20250522).

### TOOL-002 — Product BS Detector

**Capability:** product research / reviews / dropship claims. **Status/depth:** source-inspected prototype; sidepanel.js and manifest.json fetched; LICENSE request returned 404.

Code uses Gemini 2.0 Flash, stores a user API key locally, sends a truncated page title to Google, and renders model verdict/score/source_count without binding displayed claims to grounding citations. Error and parse-failure paths return score 0. Manifest requests all hosts. These are code observations, not executed browser failures.

**Fit decision:** Do not adopt hosted model, credentials, ungrounded grades or error-as-zero behavior. A locally stored key does not make inference local.

**Reuse:** README claims MIT in the discovery result; conventional LICENSE missing at checked path. Rights unresolved, not proven unlicensed.

**Engineering follow-up:** Use as a negative-control design review: ambiguous title, changed tab, API failure and missing citations must yield unknown. Review current model support separately before any external prototype; none recommended for core.

**Primary evidence:** [github-file](https://github.com/dynamicwebpaige/product-bs-detector/blob/main/sidepanel.js) (Git blob dd169f27b462e2f6f110c720851c7be19fe5effe); [github-file](https://github.com/dynamicwebpaige/product-bs-detector/blob/main/manifest.json) (Git blob 796b0c2c88301f93665ab525ba81b546592a7a23); [404](https://github.com/dynamicwebpaige/product-bs-detector/blob/main/LICENSE).

### TOOL-003 — ReviewMeta

**Capability:** review anomalies / adjusted rating. **Status/depth:** methodology lead; live API unverified; Official homepage and historical methodology search excerpts; homepage open 403, guessed /api unavailable.

Official excerpts describe removing/downweighting reviews and showing an adjusted rating with individual tests; the older methodology includes timing and reviewer-profile signals. No current API, operational reliability, terms or independent ecommerce accuracy validation established.

**Fit decision:** Learn transparent per-test explanations; do not inherit a rating, query an assumed endpoint or claim current service functionality.

**Reuse:** Service/data reuse rights not verified.

**Engineering follow-up:** Resolve actual API link, terms and supported stores before integration consideration. Separate reviewer-pattern anomalies from product quality; do not combine correlated tests as independent evidence.

**Primary evidence:** [search-excerpt](https://reviewmeta.com/?id=pro-WSTA0071.html); [search-excerpt; historical 2016](https://reviewmeta.com/blog/fakespot-vs-reviewmeta-for-analyzing-reviews/); [403](https://reviewmeta.com); [unavailable](https://reviewmeta.com/api).

### TOOL-004 — Fake-Shop Detector (ÖIAT / AIT / X-Net)

**Capability:** merchant reputation. **Status/depth:** privacy architecture documented; Official privacy policy opened; no extension execution or source audit.

Known-shop judgments use a local curated cache refreshed at restart and every 24 hours. Optional unknown-site classification transmits the page URL to a server; policy describes IP/request logging retained 14 days. Keeping core local and offering server analysis are different data flows.

**Fit decision:** Useful precedent for a local curated baseline, explicit unknown and separate network consent. No inherited verdicts, protected dataset copying or passive browsing uploads.

**Reuse:** Dataset redistribution and extension code reuse rights not examined.

**Engineering follow-up:** Evaluate dated, expiring, correction-capable entries with provenance; same third-party assessment appearing in several places remains one evidence lineage.

**Primary evidence:** [opened](https://www.fakeshop.at/en/about-us/privacy/).

### TOOL-005 — changedetection.io

**Capability:** price / scarcity / return-policy history. **Status/depth:** documentation-inspected research-lab candidate; Primary repository README and repository license identification opened; implementation not audited.

Project documents CSS/XPath/JSON filters, diff history, HTTP versus Playwright fetchers and price/restock extraction. Python/self-hosted operation is separate from its paid hosted service; June 2026 hosted AI features are not evidence all advertised behavior belongs to free core.

**Fit decision:** Potential offline research instrument for lawful public policy/price observations; not a Chrome dependency or zero-operating-cost backend. Prefer small local snapshot/diff concepts in DropShredder.

**Reuse:** Repository identifies Apache-2.0; exact license/NOTICE and dependency review still pending.

**Engineering follow-up:** Controlled research comparisons must fix selected variant, currency, geography and observation time. Personalized/login/cart states and fluctuating stock cannot prove deceptive scarcity. No automatic authenticated monitoring or proxy evasion.

**Primary evidence:** [opened](https://github.com/dgtlmoon/changedetection.io).

### TOOL-006 — Distill

**Capability:** local page-change monitoring. **Status/depth:** first-party documentation inspected; Official local/cloud docs and pricing search excerpts; no installed extension.

Local monitors require the browser/device running and may open tabs; background mode is for static pages. Web-app monitors default to cloud. Pricing lists a free 25-monitor allowance including five cloud monitors; policy/account synchronization behavior not audited.

**Fit decision:** Useful independent baseline for explicit local observation history and concurrency controls. Five-second capability is not a suitable passive DropShredder default or a performance result.

**Reuse:** No permissive code/data reuse grant verified; API access not assumed free.

**Engineering follow-up:** Evaluate explicit opt-in schedules, per-user observation scope, bounded workers and suspend/stop semantics; compare raw captured evidence rather than claiming persistent 24/7 history from an extension.

**Primary evidence:** [search-excerpt](https://distill.io/docs/web-monitor/cloud-local-monitors/); [search-excerpt](https://distill.io/pricing/).

