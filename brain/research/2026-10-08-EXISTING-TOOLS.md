# DropShredder — existing tools and capability gaps

Research date: 2026-10-08. Eighteen tool comparisons, including deeper examination of previously listed Product BS Detector and TinEye. This supplements earlier defensive-intelligence and research-gap catalogues. No runtime integration, tool execution, browser QA or measured accuracy/performance result.

All recommendations preserve local-first $0 core operation. Provider/tool presence and country of origin have zero risk weight. Third-party grades do not establish product quality or independent corroboration. Source presence means dated retrieval and observations, not a full web archive. Source files are identified with immutable Git blob hashes where fetched; HEAD URLs are navigational and may later change. Original source text/code is linked rather than redistributed. Author validation results and advertised features are clearly distinguished from our observations.

## Capability and decision map

| Capability | Existing tools | Recommended use now |
|---|---|---|
| Review reliability | Fakespot, ReviewMeta, Product BS Detector | Remove retired dependencies; learn transparent explanations; do not inherit grades |
| Merchant reputation | Fake-Shop Detector, urlscan | Local curated-cache pattern; manual existing public results; no passive URL submissions |
| Price/scarcity/policy history | Open Prices, changedetection.io, Distill | Evidence schema and controlled offline observations; no required monitoring backend |
| Structured fields/identity | extruct, Scavenge | Frozen-fixture comparison and cross-subject negative controls |
| Product imagery | imagededup, ImageHash, TinEye | Offline retrieval baselines, explicit external search, bounded candidate evidence |
| Store/app/network signatures | Web-Check, Opentechalyzer | Review isolated source adapters/signatures and neutral matched evidence |
| Policy text/string candidates | Readability, RapidFuzz | Bounded text extraction and offline similarity baselines |
| Evidence capture | SingleFile | Separate manual public-page capture; review redaction before sharing |

## Highest-value gaps for engineering review

1. **Bind contradictions to a product and variant.** Scavenge's small author-run validation exposed cross-subject failures despite accurate values/locators. A cart total, financing amount, second Product or different unit is not a contradictory offer.
2. **Do not score acquisition failure.** Product BS Detector's inspected failure paths use score zero; DropShredder must preserve unknown on API, parse, permission or provider failure. This is a reference-tool observation, not a supplied-build bug report.
3. **Keep observation time separate from origin.** Price samples and image crawl dates cannot establish continuous discount history, first manufacture or copying direction.
4. **Keep licenses attached to data, models and code separately.** MIT wrappers do not erase GPL imported fingerprint terms; AGPL software and ODbL prices are separate artifacts. README claims cannot replace actual license notices.
5. **Use external tools as fallible comparisons.** extruct output is metadata, hashes are retrieval evidence, Readability output may omit clauses, and fuzzy string scores do not resolve identities. None is ground truth.
6. **Make data flow explicit per action.** Local capture can fetch resources; unlisted scans are shared; hosted AI still transmits product context. Browser-safe components need distinct review from Node/Python/server applications.
7. **Build a labelled, rights-cleared negative corpus before adoption.** Include shared images, white backgrounds, copied policy templates, cart/upsell fields, translations, unknown units/currencies and stale third-party reports. Measure false matches/alerts and abstention on unseen merchant/product lineages.

These are candidate work items for the continuation engineering agent, not changes to authority or scoring. Review/port selected material onto the current release: this branch retains the supplied 1507b551 base while the observed release is 2f89ddaac2037dbeb78be5a39ae7254b68394a78. Do not replace release files wholesale.

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

**Reuse:** Apache-2.0 LICENSE fetched (blob a6e09a45199d495dd9ff687399fb4835acb0b843); dependencies/NOTICE and actual runtime not audited.

**Engineering follow-up:** Controlled research comparisons must fix selected variant, currency, geography and observation time. Personalized/login/cart states and fluctuating stock cannot prove deceptive scarcity. No automatic authenticated monitoring or proxy evasion.

**Primary evidence:** [opened](https://github.com/dgtlmoon/changedetection.io); [github-file](https://github.com/dgtlmoon/changedetection.io/blob/master/LICENSE) (Git blob a6e09a45199d495dd9ff687399fb4835acb0b843).

### TOOL-006 — Distill

**Capability:** local page-change monitoring. **Status/depth:** first-party documentation inspected; Official local/cloud docs and pricing search excerpts; no installed extension.

Local monitors require the browser/device running and may open tabs; background mode is for static pages. Web-app monitors default to cloud. Pricing lists a free 25-monitor allowance including five cloud monitors; policy/account synchronization behavior not audited.

**Fit decision:** Useful independent baseline for explicit local observation history and concurrency controls. Five-second capability is not a suitable passive DropShredder default or a performance result.

**Reuse:** No permissive code/data reuse grant verified; API access not assumed free.

**Engineering follow-up:** Evaluate explicit opt-in schedules, per-user observation scope, bounded workers and suspend/stop semantics; compare raw captured evidence rather than claiming persistent 24/7 history from an extension.

**Primary evidence:** [search-excerpt](https://distill.io/docs/web-monitor/cloud-local-monitors/); [search-excerpt](https://distill.io/pricing/).

### TOOL-007 — Open Prices (Open Food Facts)

**Capability:** evidence-backed price history. **Status/depth:** data/API documentation inspected; Primary repository, data guide and API.md; no API calls or dataset analysis.

Public price observations have date, currency, location and proof identifiers; the published dataset also includes discount and receipt fields. Exploration is available without an account; some API endpoints require authentication. Data guide names ODbL, while repository software is AGPL-3.0. Food-oriented coverage is not established apparel coverage.

**Fit decision:** Borrow the observation/proof schema for local history, not a universal apparel-price feed. No receipt uploads, account requirement or server introduced.

**Reuse:** Data and software have distinct licenses; ODbL attribution/share-alike review required for imported databases. Receipt-image rights/PII policy not verified.

**Engineering follow-up:** Separate observed price, claimed compare-at price, selected variant and delivered-cost conditions. Preserve dates and provenance; gaps in sampling must stay gaps. Use public-data fixtures only after rights review.

**Primary evidence:** [opened](https://github.com/openfoodfacts/open-prices); [opened](https://openfoodfacts.github.io/open-prices/guides/data/); [github-file](https://github.com/openfoodfacts/open-prices/blob/HEAD/API.md) (Git blob 25e04f9f0e203ceae6d18624c1863fc4c36d21dd); [primary search-excerpt](https://huggingface.co/datasets/openfoodfacts/open-prices).

### TOOL-008 — SingleFile

**Capability:** manual evidence capture / offline replay. **Status/depth:** documentation and privacy inspected; Primary README, privacy.md and actual LICENSE fetched; implementation/runtime not audited.

Saves a page into one HTML file. Privacy document says processing/storage is local by default, but capture can fetch uncached page resources and temporarily inject data; website detection may be possible. Optional cloud destinations, browser-settings synchronization and proof-of-existence hashing have separate transmissions.

**Fit decision:** Independent manual research capture companion, not silently bundled/autosaved. Local processing does not mean zero resource requests or invisible capture.

**Reuse:** AGPL-3.0 LICENSE verified; README identifies some third-party MIT code. Combination/distribution obligations need review before copying.

**Engineering follow-up:** Capture only explicit public product/policy targets; preview and redact before sharing. Distinguish saved DOM from original response and observed state; hashes establish byte integrity, not truth. No cloud upload or blockchain-hash action.

**Primary evidence:** [opened](https://github.com/gildas-lormeau/SingleFile); [github-file](https://github.com/gildas-lormeau/SingleFile/blob/HEAD/privacy.md) (Git blob c395807662481a448dd0a4e70968c01497924ef9); [github-file](https://github.com/gildas-lormeau/SingleFile/blob/HEAD/LICENSE) (Git blob 0ad25db4bd1d86c452db3f9602ccdbe172438f52).

### TOOL-009 — extruct

**Capability:** structured product extraction. **Status/depth:** documentation/license inspected; README.rst and LICENSE fetched; extraction code/tests not audited.

Python extractor supports JSON-LD, Microdata, Microformats, Open Graph, experimental RDFa and Dublin Core, accepting supplied HTML and optional base URL. Extracting seller-authored metadata does not establish its truth or identify the selected product automatically.

**Fit decision:** Promising offline cross-check for a frozen HTML fixture corpus; Python/lxml-style stack is not a direct Chrome JS dependency.

**Reuse:** BSD-3-Clause actual license verified (blob 737fbfaae515cd1f90c361857a7bca399aface65); dependency licenses still require review.

**Engineering follow-up:** Compare raw channels independently using parent/variant identity. Exercise multiple Products, Offer/AggregateOffer, malformed/large JSON-LD and conflicting visible versus metadata prices. Agreement is one seller's repeated assertion, not independent corroboration.

**Primary evidence:** [opened](https://github.com/scrapinghub/extruct); [github-file](https://github.com/scrapinghub/extruct/blob/HEAD/README.rst) (Git blob 01595119775f16f23ce1cb2e8ea32da499ae0428); [github-file](https://github.com/scrapinghub/extruct/blob/HEAD/LICENSE) (Git blob 737fbfaae515cd1f90c361857a7bca399aface65).

### TOOL-010 — Scavenge

**Capability:** multi-channel field provenance. **Status/depth:** experimental research lead; README, LICENSE and historical final correctness report fetched; no execution or implementation audit.

Current README restricts output to price/availability observations across raw DOM, structured data, embedded state, rendered DOM and network JSON. Its historical author-run 23-page/12-storefront validation says all 16 DIFFERENT relations were spurious: different Products, cart/upsell totals and minor units. Current README removes semantic comparison. These are self-reported results, not our replication.

**Fit decision:** Highly useful negative-case inventory and exact locator/subject/status schema. Python/Playwright experimental tool is an offline candidate, not production Chrome code or a validated semantic oracle.

**Reuse:** Apache-2.0 actual LICENSE verified. Public research reports remain author-controlled material; link/briefly summarize rather than replicate.

**Engineering follow-up:** Require independently established selected-product/variant identity before contradictions. Unknown currency, units or subject prevents comparison. README security-bound claims are unverified; rendered-browser execution and request bounds require source audit before use.

**Primary evidence:** [github-file](https://github.com/aarohim24/Scavenge/blob/HEAD/README.md) (Git blob fc359c8607797deb960c9f5975b9060fe0dc09bd); [github-file](https://github.com/aarohim24/Scavenge/blob/HEAD/LICENSE) (Git blob d645695673349e3947e8e5ae42332d0ac3164cd7); [github-file](https://github.com/aarohim24/Scavenge/blob/HEAD/docs/research/OSS-FINAL-CORRECTNESS.md) (Git blob d80991d73af590bbe2e6ebca15b8412c491fecac).

### TOOL-011 — Web-Check

**Capability:** on-demand merchant/site OSINT. **Status/depth:** documentation/license inspected; Actual .github/README.md and LICENSE fetched; API implementation not audited.

On-demand site analysis has a GUI/API and server/container deployments. Extra checks use optional Google, Shodan, Cloudmersive, Tranco and GitHub credentials. Its full server architecture is not an in-browser dependency, and infrastructure configuration is not evidence of product quality.

**Fit decision:** Investigate as a separately operated research comparison tool; review individual public-data adapters instead of copying the application or exposing a server.

**Reuse:** MIT license verified (blob bee7ddc03c90cc69d10685c0b361facccac675bf); third-party services/dependencies need their own checks.

**Engineering follow-up:** Map each adapter to exact data source, consent, cache age and failure-to-unknown behavior. Shared CDN/IP/certificate services do not prove shared merchant control. Review redirects/private-address handling before any server usage; no vulnerability asserted.

**Primary evidence:** [opened](https://github.com/Lissy93/web-check); [github-file](https://github.com/Lissy93/web-check/blob/HEAD/.github/README.md) (Git blob 704e9cc5f17c6360f079feeaa9e1b28c1a740c0c); [github-file](https://github.com/Lissy93/web-check/blob/HEAD/LICENSE) (Git blob bee7ddc03c90cc69d10685c0b361facccac675bf).

### TOOL-012 — urlscan.io

**Capability:** historical infrastructure / page evidence. **Status/depth:** official API/privacy visibility reviewed; Primary API documentation opened; no submissions/search API calls.

API supports submissions, existing-result retrieval and search, generally with an account/key; unauthenticated quotas are minor. Public scans are searchable; unlisted scans are available to vetted Pro researchers/companies, so unlisted is not private. Docs prohibit wholesale mirroring and require graceful missing-field/429 handling.

**Fit decision:** Manual examination of existing public results may inform investigations; never automatically submit a browsed URL or treat unlisted submission as private. Not a credential-free guaranteed core API.

**Reuse:** No bulk copying or unrestricted data redistribution grant established.

**Engineering follow-up:** An existing result is a dated external-vantage capture, not the current selected variant or logged-in page. Record scan time and original source; similar network dependencies or repeated reports do not establish ownership/independent corroboration.

**Primary evidence:** [opened](https://urlscan.io/docs/api/).

### TOOL-013 — imagededup (idealo)

**Capability:** exact/near-duplicate product imagery. **Status/depth:** documentation/license inspected; Primary README and LICENSE; model code/weights not audited.

Python image deduplication supports perceptual/difference/average/wavelet hashes and CNN encodings, plus dataset evaluation. README explicitly warns its published benchmarks apply only through v0.2.2 and may not hold for later releases.

**Fit decision:** Strong offline baseline candidate for a labelled crop/recolor/watermark/near-match corpus. No transfer of historical speed/accuracy numbers or Python CNN stack to passive Chrome.

**Reuse:** Apache-2.0 actual license verified; pretrained model/weight/training-data terms not verified.

**Engineering follow-up:** Evaluate each transform and false match to visually similar garments separately. Keep cheap hash retrieval distinct from verified product identity; reuse/licensed stock images and similar designs remain negative controls.

**Primary evidence:** [opened](https://github.com/idealo/imagededup); [github-file](https://github.com/idealo/imagededup/blob/HEAD/LICENSE) (Git blob 3ed49f4b9d82b46e529b8ee5221eaf133b4f2f23).

### TOOL-014 — ImageHash

**Capability:** small perceptual/crop-resistant fingerprints. **Status/depth:** selected code inspected; README, LICENSE and imagehash/__init__.py fetched; key hashing/segmentation matching functions reviewed.

pHash/dHash convert to luminance; colorhash models color distribution separately. Crop-resistant matching uses segmented hashes and defaults to allowing one matching region with 25% bit error. Those permissive defaults are not apparel identity thresholds. Code notes segmentation can differ with Pillow versions.

**Fit decision:** Offline reference implementation for compact fingerprints and interoperability tests. A browser port requires pinned resize/color/DCT/bit-order semantics and separate measurements.

**Reuse:** BSD-2-Clause actual license verified (blob bc9678155161ae6ac2b3522e5c48281e359d5dae).

**Engineering follow-up:** Reject shared background/logo-only matches; require garment-relevant regions and corroborating attributes. Test hue changes, white backgrounds, mirrored views, crops and lookalike cuts. Similar pixels alone prove neither supplier nor quality.

**Primary evidence:** [opened](https://github.com/JohannesBuchner/imagehash); [github-file](https://github.com/JohannesBuchner/imagehash/blob/HEAD/imagehash/__init__.py) (Git blob 9e679d02b469f56292d8e3ed542dc1bcbc4c572a); [github-file](https://github.com/JohannesBuchner/imagehash/blob/HEAD/LICENSE) (Git blob bc9678155161ae6ac2b3522e5c48281e359d5dae).

### TOOL-015 — Opentechalyzer / Wappalyzer-format ecosystem

**Capability:** store platform / app signatures / network candidates. **Status/depth:** selected code and mixed licenses inspected; README, package.json, LICENSE, public exports, detect/engine.ts and fingerprints/external.ts fetched.

Node >=18.17 package separates detection from collection. Engine emits matched source/pattern snippets and captured IDs, combines nominal reliabilities with damped same-source repeats, and infers related technologies. External importer fetches a separate GPL-3.0 Wappalyzer-format dataset. Source groups are not proof of statistical/evidentiary independence; percentages are heuristic, not validated DropShredder probabilities.

**Fit decision:** Promising clean-room comparison and pure matching-engine design reference. Do not run its all-in-one crawling/probing/email/MCP paths during ordinary browsing or inherit its scores.

**Reuse:** Actual MIT LICENSE requires notice retention despite README saying no attribution required. Optional imported GPL data is separate; importer separation does not prove any future distribution compliant. Built-in corpus provenance claim not independently audited.

**Engineering follow-up:** Review individual bounded signatures with fixtures and lineage; neutral platform/app presence. Same IDs may come from agencies/test templates, not owners. Inferred and direct detections must stay distinct. Regex cache lacks a visible bound in inspected engine; budget corpus/input/cache before browser reuse.

**Primary evidence:** [opened](https://github.com/Houseofmvps/opentechalyzer); [github-file](https://github.com/Houseofmvps/opentechalyzer/blob/HEAD/README.md) (Git blob 1c1ff5ef2561b4e34fd7a76807edf962188bdb5a); [github-file](https://github.com/Houseofmvps/opentechalyzer/blob/HEAD/package.json) (Git blob 087b07a12b3d07244c376a4dbdcfaf0abdc4cf61); [github-file](https://github.com/Houseofmvps/opentechalyzer/blob/HEAD/LICENSE) (Git blob fd4ea3fc0fc7623ed46a88615fa089b274c333fd); [github-file](https://github.com/Houseofmvps/opentechalyzer/blob/HEAD/src/detect/engine.ts) (Git blob ef3a8ea97c919b85ab0595694af5f3fcf6518d22); [github-file](https://github.com/Houseofmvps/opentechalyzer/blob/HEAD/src/fingerprints/external.ts) (Git blob 7bd49c87e8da09e7a7125f10a626fca91aaa3048).

### TOOL-016 — Mozilla Readability

**Capability:** return/shipping policy text extraction. **Status/depth:** documentation/license inspected; Primary README and LICENSE.md; not executed.

Reader-mode article extraction exposes maxElemsToParse (default unlimited) and character thresholds. Project explicitly does not sanitize untrusted HTML and recommends sanitization/CSP before displaying output. Article heuristics can omit short or tabular policy clauses; no completeness claim established.

**Fit decision:** Candidate for explicit policy-document comparison and boilerplate reduction with a hard element cap, text-only output and original evidence locator. Never replace full-page evidence or imply policy completeness.

**Reuse:** Apache-2.0 actual LICENSE.md verified.

**Engineering follow-up:** Evaluate short return windows, exclusions in tables/accordions, multilingual clauses and appended legal footnotes. Parser success does not mean all obligations captured. Keep untrusted rendered HTML out of the sidebar.

**Primary evidence:** [opened](https://github.com/mozilla/readability); [github-file](https://github.com/mozilla/readability/blob/HEAD/LICENSE.md) (Git blob d645695673349e3947e8e5ae42332d0ac3164cd7).

### TOOL-017 — RapidFuzz

**Capability:** title / policy / address string candidates. **Status/depth:** documentation/license inspected; Primary README and LICENSE fetched; normalization examples reviewed, no benchmarks executed.

Python/C++ fuzzy string matching provides several metrics rather than an entity resolver. Repository notes preprocessing behavior changed in v3: case/whitespace/punctuation normalization is not automatic by default. Algorithm/normalizer versions affect comparable scores.

**Fit decision:** Offline baseline for candidate retrieval and duplicate policy text, not a direct browser dependency or seller-identity authority.

**Reuse:** Actual MIT license verified; copying/ports retain notices and review bundled dependencies.

**Engineering follow-up:** Version Unicode/case/token processing and bound comparisons. Distinguish shared boilerplate from shared operators; numerals such as 14 versus 30 days and model/size codes must not disappear under fuzzy normalization.

**Primary evidence:** [opened](https://github.com/rapidfuzz/RapidFuzz); [README source](https://github.com/rapidfuzz/RapidFuzz/blob/HEAD/README.md) (Git blob ee895b20a09f93b28008fd96ed027b6f6bbc9806); [github-file](https://github.com/rapidfuzz/RapidFuzz/blob/HEAD/LICENSE) (Git blob 42c23b2103346d5439dd72582ed6d4a0d8d7b27b).

### TOOL-018 — TinEye

**Capability:** reverse image search / dated image reuse. **Status/depth:** provider documentation reviewed; existing capability deepened; Official FAQ/search and detailed help excerpts; FAQ direct page requires JavaScript; no actual search performed.

TinEye distinguishes exact/altered image matches from different photos of similar objects. First-found/oldest refers to its crawl date, not initial publication or the image creator. API automation uses paid search bundles; no result means absent from that index, not unique on the web.

**Fit decision:** Explicit user-triggered external investigation link, with upload/URL data flow disclosed; paid API is unsuitable for required $0 core. This deepens an existing reverse-search capability rather than adding one.

**Reuse:** Proprietary service/index; manual-use/API terms and image rights apply. No permission to redistribute found images assumed.

**Engineering follow-up:** Record provider-observed crawl dates distinctly from verified publication/manufacture dates. A supplier page crawled first cannot by itself establish upstream origin; treat both match and no-match as bounded search observations.

**Primary evidence:** [primary search-excerpt](https://help.tineye.com/article/246-can-i-sort-my-results); [primary search-excerpt](https://help.tineye.com/article/248-what-does-tineye-first-found-on-mean); [primary search-excerpt](https://help.tineye.com/article/233-how-does-tineye-work); [primary search-excerpt](https://help.tineye.com/article/275-signing-up).

## Unresolved and untested

ReviewMeta's live API/terms are unresolved; provider excerpts are not availability proof. Selected file inspection is not a full security/license audit. No tools were installed or executed, no datasets/models downloaded, no reverse searches or scans submitted, and no real Chrome QA was possible. Performance, current provider coverage, model accuracy, source rights and practical browser bundle costs require their own tests. This pass intentionally reuses existing tools as research leads, not merchant accusations.
