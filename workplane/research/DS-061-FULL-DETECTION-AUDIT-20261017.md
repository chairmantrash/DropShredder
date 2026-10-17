# DropShredder detection audit and replacement checkpoint

**The requested 59% detection rate is not established. The current accuracy gate is NOT_ACCEPTED / NOT_EVALUABLE.** The previous 233-site exercise measured availability, extraction and selected functions; it supplied no independently adjudicated current positive/negative holdout labels. It did not demonstrate a rate below50%, either. Rewriting the whole repository would not resolve that missing denominator or the lack of upstream evidence on fresh installs.

This audit inventories all 68 detection-related modules, traces the actual scan workflow, reexamines every retained website outcome, researches primary technical/merchant sources, reproduces25 failures in 32 new regression controls and replaces the demonstrated faulty rules. It is a source/pipeline audit with explicit validation limits, not a claim that every tool passed independent field acceptance.

## What the last beta actually measured

| Retained DS-060 measurement | Result | Interpretation |
|---|---:|---|
| Website outcomes |233 across 11 assigned groups|Breadth of attempts; category labels need review|
| Successful native scans |158/233 (67.8%)|Availability/extraction, not detection accuracy|
| Current structured identity resolved |82/158 (51.9%)|Product binding coverage; unresolved is not proof of fraud|
| Priced reports |53/158|Another limited extraction capability|
| Individual-review analyses |3 stores,15 reviews|Very limited input to review detectors|
| Numerical dropship score UNKNOWN |157/158|Abstention, not a correct negative|
| Successful pages with weighted evidence |32/158|Warnings from several different tasks; not a true-positive count|
| Severe verdicts |0|No recall or false-positive rate can be inferred|
| Independently adjudicated holdout labels |0|59% cannot be evaluated|

The corpus also contains selection errors: SITE-0023, pact.com, was assigned apparel while the retained product is “Club Timer III - Shot Timer.” Some leads are catalog/brand pages. Historical-source membership is not current deceptive-product truth. Preserve this corpus as development evidence and correct future sampling; do not relabel it a blind accuracy test.

## Audit of the tool chain

| Capability | Actual runtime path / limitation | Required disposition |
|---|---|---|
| Shopping-page and product identity |Bounded main-world safety check plus serialized ISOLATED extraction; JSON-LD, selected variants and limited visible identifiers. Many listings remain unbound. Generic commerce/category pages can still produce reports.|Separate merchant-page coverage from exact-product coverage; label real identity misses before changing selection rules.|
| Supplier/product matching |Default `autoSourceHunt` is off. When enabled, indexed matching compares only with up to250 local prior observations. Imported lists supply unscored leads. A fresh installation has no supplier-history corpus.|Replace the assumption that local history is discovery. Build an explicit, bounded, source-authenticated candidate acquisition and comparison path.|
| Deep Hunt |Main source/image/store buttons primarily open a search chooser. Optional Brave search requires a user key and returns leads; it does not authenticate supply relationships.|Present discovery honestly; bind retrieved candidates to product/variant and evidence before a decision. No mandatory paid API.|
| Upstream provenance |`upstream-candidate.ts` has tests but no runtime import path. No production rule emits a literal Tier-A/direct severity. Severe-gate fixtures therefore prove gate arithmetic, not an acquisition pipeline.|Implement a real evidence producer and its integration after identity/chronology validation; do not simply wire an unverified candidate to a warning.|
| Image matching/OCR |Image hashing is user-triggered and compares with local history. OCR reads user-supplied labels. Neither supplies an authenticated upstream manufacturer or physical-quality test.|Retain useful local primitives; validate real-photo/variant inputs and acquisition separately.|
| Review extraction |Runtime adapters cover Amazon-shaped and scoped Judge.me DOM. Static verified sources contain Yotpo-shaped candidates on 11 pages/102 rows, but these lack uniformly supported current-product/stable-ID attribution. Presence alone is not extractable or fraudulent reviews.|Add adapters only after product binding, visibility, deduplication and provider-state semantics are demonstrated. Do not ingest all `.review` elements.|
| Review decisions |Provenance and integrity rules execute only after reviews arrive. Small visible samples and seller-selected/syndicated populations limit conclusions.|Measure extraction recall and anomaly precision separately. Missing verification is unknown.|
| Dispatch/claim consistency |English clause order and vendor vocabulary had demonstrated misses; broad wording also accepted questions, future plans and inbound warehouse movements.|Parser replaced and negative controls added. Broader native-language acceptance remains open.|
| Merchant networks |Registry membership and simple cross-domain text produced adverse identity weight, even though the explanation said affiliation alone was not fraud. Hostname substring matches were also possible.|Replaced with unscored, sourced affiliation context; domain-specific complaint/enforcement findings remain separate.|
| Scarcity/price history |Runtime history analysis requires actual repeat observations; resets cannot be established on the first visit. Separate `dark-patterns.ts` and `price-manipulation.ts` utilities are not imported by runtime.|Keep longitudinal proof requirements; consolidate alternatives only after comparing behavior. Negated urgency now abstains.|
| Quality/defects |`defect-consensus.ts` is disconnected. `qualityClaimEvidence` is imported but never called. Defect observations expose an optional product key without establishing exact product binding in consensus.|Do not market these as automatic product-quality detections or blindly connect store-wide complaints to individual products.|
| RDAP, GLEIF, CPSC, security and historical lookups |Explicit tools retrieve domain/entity chronology, recall candidates, separate security reports or historical opinions. They are not automatic current dropshipping/fraud ground truth.|Retain source/scope boundaries; validate exact subjects and population.|
| North American origin / business standing |Structured user-reviewed dossiers and sources support separate assessments; local records are not independent certification.|Keep these separate from accusation scores; source authenticity and completeness require review.|
| Scoring/fusion |Heuristic weighted evidence is not a calibrated probability. Severe gates constrain provenance/fulfillment and independence, but cannot create missing evidence.|Preserve those gates; evaluate per task with valid labels before tuning weights.|

The AST inventory identifies11 modules without a runtime value-import path: adversarial-normalization, dark-patterns, defect-consensus, price-manipulation, upstream-candidate, basic-page, structured-product, signature-registry, tool-signatures, scamferret-results and trustpilot. Some are intentionally retired/alternative implementations. In addition, the quality-analysis import is unused. Import reachability is an upper bound on execution, not proof a function runs. The complete file/export/importer inventory is in [module-inventory.json](../runs/DS-061/module-inventory.json).

## Replacements implemented

1. **Dispatch statement parser:** recognizes supplier/manufacturer subjects and vendor origins; checks bounded clauses instead of unrelated surrounding sentences. Questions, quotations, definitions, planned/hypothetical operations, denials/contractions, invalid sources/dates and inbound retailer-warehouse deliveries abstain. Disclosures stay attributed merchant claims with zero adverse weight.
2. **Merchant/review attribution:** review/quotation bodies are excluded from merchant page text. Amazon-shaped review fields now use the same bounded visibility/private-subtree reader as Judge.me. Missing verification badges remain unknown. The serialized scanner shrinks48,190→48,145 bytes, with no increased work/privacy caps.
3. **Urgency rules:** negated, quoted and explanatory urgency no longer automatically becomes pressure-to-buy evidence; affirmative urgency still works.
4. **Affiliation policy:** registry and cross-brand references remain visible, sourced identity information with zero merchant-risk weight. Future-dated references are not fresh, and lookalike hostname substrings cannot create a reference. This intentionally replaces earlier tests that expected adverse weight merely for membership.
5. **Evaluation infrastructure:** an explicit holdout checker reports recall, precision, FPR, abstention, unavailable positives and Wilson95% intervals. It rejects merchant/product-lineage split leakage, duplicate groups, invalid observation dates and unadjudicated holdout omissions. Unknown truth never becomes a benign label, and no-positive predictions never become perfect precision. The checker verifies declared records and arithmetic; it cannot authenticate its own ground truth.

No new backend, paid provider, runtime dependency, extension permission or weakened severe gate.

## What improved, and what did not

| Check | Before | After | Scope |
|---|---:|---:|---|
| Primary-source dispatch statements correctly extracted |9/12|11/12|Search-selected, visible during development; English parser challenge, no representative negative sample|
| New regression controls |25 demonstrated failures across 32 controls|32/32 pass|Owned engineering cases, not customer accuracy|
| Core tests |474 pass on prepared baseline|506 pass|Algorithm/regression validation|
| Verified static-source extraction outcomes |215|215|Detached HTML; no Chrome/CSS/script acceptance|
| Reviews in static replay |59|59|Review bodies retained while merchant text attribution changes|
| Weighted-warning pages in affiliation-only stored-report replay |32/158|27/158|Same stored evidence; not a fresh website scan or detector-wide rate|
| Independent deceptive-provenance recall |Not measurable|Not measurable|No accepted truth labels|

The remaining statement miss is Wayfair's general declaration of its primary fulfillment model, rather than an explicit current-product dispatch sentence. We did not add a brand-specific lookup just to make the12-case diagnostic perfect. Even the old parser scored75% on that narrow positive-only challenge; this illustrates why such a number cannot be presented as the requested customer detection rate.

Six stored reports lose unsupported affiliation-based risk contributions; five affiliation-only warning pages become neutral. Other findings remain. This does not certify those merchants as safe.

The source replay accounts for all 233 outcomes:215 extractions,8 unavailable captures,5 private-region-budget refusals and5 hash mismatches. Changed files SITE-0010,0014,0129,0209,0211 are quarantined in both phases with expected/actual hashes; receipts were not rewritten. Initial fail-closed replay attempts are preserved. Five other sources still exceed private-region budgets. Native availability is not inferred from this replay.

## Validation and hard blockers

Production checkpoint: `578d4603c4fb886acb0454ca6d089375bf0dbcb7` (identical tree to local build `1c32e3498af6ffb285b54ca6d5a5ef47ca914d49`), tree `2dcea105f97e23e563c824b5b6256ea19fc09f34`, branch `feature/detection-audit59-20261017`. Candidate54 files /55,556,575 bytes. Build, prepared typecheck,506 core tests,12 evaluator tests and local security/runtime/data/localization/professional/package/performance gates pass. Existing architecture warnings remain for large orchestration/extraction files and the reviewed domain-parser dependency. Initial fresh-worktree missing generated types/model assets are preserved separately from actual source failures. A typed summary-helper annotation failure was corrected and typecheck repeated; its original log is retained. Both current dependency advisory inventories report zero advisories.

Fresh browser verification is **blocked**. The Playwright CDN returned a195-byte unavailable HTML document. The official Google Chrome156.0.8078.4 archive was then downloaded, upstream-size/MD5 checked and ZIP integrity verified; desktop utilities were extracted into an isolated scratch directory. Both genuine packaged and headed native starts still fail with `process_singleton_posix.cc:297 socket() failed: Operation not permitted`. Packaged R01 verifies all 54 candidate files; R02 cannot start Chrome; native N01 fails at startup. No new native behavioral check passed. No attempt was made to bypass the socket restriction, fake browser APIs or relabel a blocked run a pass. Four new native controls and an unchanged genuine N01–N09 permission bootstrap are ready for a permitted host; they have not executed successfully here. No hosted Actions minutes were consumed, and no new CodeQL acceptance is claimed.

## The59% acceptance criterion and replacement order

The owner supplied59%; this audit interprets it as **recall on known positive cases**, with a provisional95% precision /5% FPR ceiling and50 positive plus 50 negative unique merchant groups in a disjoint holdout. Report class/task breakdowns and confidence intervals as well as the point estimate. These engineering bounds are not a satisfaction survey or population guarantee.

All233 old cases remain explicitly unadjudicated **development** observations. Their present evaluation is NOT_ACCEPTED / NOT_EVALUABLE, with zero eligible holdout labels. Do not drop unavailable known positives, count UNKNOWN as benign, count templates/variants as independent merchants, reuse development cases as holdout, or combine ordinary retail resale with deceptive provenance into one label.

The necessary sequence is:

1. Define and adjudicate separate current tasks: disclosed supplier-direct fulfillment, independently matched mass-resale, contradicted provenance, review anomalies and observed scarcity resets. Retain exact merchant/product/variant/source/time binding. A source is an asserted fact only within its verified scope; missing complaints do not prove a negative.
2. Replace candidate acquisition and identity binding first. A fresh install needs an explicit permitted path to original product/supplier evidence, not only empty local history or search links. Keep product-model identification separate from an adverse deception decision.
3. Run the repaired extraction and acquisition path on development data; freeze a merchant/product-lineage-disjoint holdout with independently reviewed labels; execute the genuine browser checks on a host that permits Chrome sockets. Only then tune and measure the59% recall target with false alarms and abstentions visible.

The request remains open at this checkpoint. The code/evidence are preserved on an isolated draft branch with an explicit `[skip ci]` marker to avoid hosted runner use. No public beta, main/Store merge or customer-ready claim was made. The report and code are reviewable; the detection-rate target has not been met by assumption.

## Primary research and evidence

The repair follows original merchant/provider statements and technical documentation, rather than assuming dropshipping is inherently deception. Sources were opened during this audit on 2026-10-17. Short, original statement excerpts and12 source URLs are preserved in `tools/beta/audit59/disclosure-cases.json`; timestamps use day precision after correcting an initial future placeholder without changing text/labels.

- [Shopify: what dropshipping means](https://help.shopify.com/en/manual/products/dropshipping/what-is-dropshipping) and [Wayfair's own fulfillment explanation](https://sell.wayfair.com/start-beginners-guide): operational fulfillment and deception are different tasks.
- [B&H shipping](https://www.bhphotovideo.com/c/find/HelpCenter/Shipping.jsp), [At Home supplier shipping](https://help.athome.com/hc/en-us/articles/47260880918797-Products-Shipped-Directly-from-Supplier), [Viking supplier shipping](https://www.vikingdirect.ie/en/shipped-directly-from-supplier) and [Montana Decor shipping](https://montanadecor.com/pages/shipping-policy): real wording, retailer/mixed fulfillment and conditional item scope.
- [Yotpo's official widget installation](https://support.yotpo.com/generic-other-platforms-installing-yotpo-reviews-v3) and [widget FAQ](https://support.yotpo.com/docs/general-reviews-widgets-faq): product identifiers and site-review widgets require different handling.
- [Wayfair's public brand family](https://www.aboutwayfair.com/category/company-news/wayfair-announces-first-quarter-2026-results-reports-strong-share-capture-and-a-return-to-active-customer-growth), [FULLBEAUTY brands](https://www.fbbrands.com/company-profile/our-brands/), [Harem Pants' own cross-brand account](https://www.harempants.com/blogs/our-mission/ep-01-how-it-started): publicly disclosed affiliation is identity information.
- [Google: recall, precision and FPR](https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall) and [primary selective-classification evaluation research](https://arxiv.org/abs/2407.01032): abstention/coverage and prediction error need separate reporting.
- [Chrome scripting API](https://developer.chrome.com/docs/extensions/reference/api/scripting): injected function serialization and isolated execution inform the scanner constraints.

Machine-readable summary: [audit-summary.json](../runs/DS-061/audit-summary.json). Acceptance result: [accuracy-result.json](../runs/DS-061/accuracy-result.json). Reproduction commands and scope: [audit59 README](../../tools/beta/audit59/README.md). All failed attempts and completed evidence are retained under `workplane/runs/DS-061/`.
