# DropShredder — research beyond the existing workplane

Research date: 2026-10-08. Status: research complete for this pass; 19 catalogued findings and six papers reviewed in selected sections. No implementation or browser QA claimed.

## Scope and continuity

Reviewed the existing 41-finding research report (version 11), the current repository research index, and Stability Gaps Deepening. Existing work already covers supplier concealment, image alteration, reviews, product matching, basic calibration, source independence, domain grouping and Chrome lifecycle. This report deepens specific mechanisms missing from those notes. It is a standalone research handoff. The initial research pass changed no project files. The owner subsequently authorized git edits and pushing knowledge to other workers; this handoff is now being added to the isolated research branch. Runtime code, the supplied build, release branch and PR #9 remain unchanged by this additional research.

Evidence policy: supplier nationality, region, legitimate resale, tooling presence and absent optional credentials receive zero negative weight. A badge, registry entry, signature or resemblance does not prove product quality. Research recommendations below remain unimplemented.

## Findings and engineering applications

### NEW-001 — Verify the scope of textile certifications, not just the logo

Primary sources: [OEKO-TEX labelling guidance](https://www.oeko-tex.com/en/news/infocenter/labelling-and-greenwashing), published 2023-08-16; [official Label Check](https://www.oeko-tex.com/en/label-check). Both opened 2026-10-08.

The issuer says a finished-product certification claim must cover all its components, and identifies the number and institute as verification information. Its lookup treats identifiers as case-sensitive and advises contacting the issuer when no result appears.

Proposed adapter: capture the exact visible claim, standard, certificate number, institute, claim subject (whole garment or component), lookup date and reported scope. Offer the official check as an explicit action; no undocumented API assumed. Preserve raw identifier case separately from normalized search text. Use statuses claim-only, unresolved, current/scope-compatible, expired/withdrawn, and scope-conflict. A missing result is unresolved, not counterfeit. A valid number alone does not connect a garment to that certificate or establish durability, organic fibre content or manufacturing origin.

Acceptance examples: case-sensitive lookup error stays unresolved; certified fabric versus whole-garment claim needs scope examination; an unrelated valid certificate never produces a verified-product badge. No merchant was assessed.

### NEW-002 — GOTS company certification is different from shipment traceability

Primary sources: [GOTS v8.0](https://global-standard.org/images/resource-library/documents/standard-and-manual/GOTS_v8.0_signed.pdf), sections 2.3–2.4; [current certified-supplier directory](https://global-standards.org/suppliers/certified-suppliers). Opened 2026-10-08. The older directory URL redirected to this new domain.

A scope certificate identifies qualified entities, activities and product categories. A transaction certificate links certified products to shipment details. Therefore a factory's scope certificate cannot by itself verify every item a boutique sells. Consumer-visible transaction evidence may be unavailable: that limitation must remain unknown.

Fresh operational gap: the current directory warns that certification bodies are still migrating data into its new repository. Missing entries must not count against a seller. Record original URL, redirect destination and lookup time; domain migration is not evidence of misconduct.

Proposed adapter: separate entity certification, product-category scope and product/shipment linkage. Show which link is actually verified. Do not request private transaction documents automatically or scrape an undocumented endpoint. Negative controls: absent retail transaction certificate; lawful subcontractor; newly migrated database; unrelated certificate-holder name.

### NEW-003 — Certification rules need effective dates and versions

Primary source: [GOTS v8.0](https://global-standard.org/images/resource-library/documents/standard-and-manual/GOTS_v8.0_signed.pdf), introduction and transition notice. Opened 2026-10-08.

Version 8 was released 2026-03-02 and becomes effective 2027-03-01, with early adoption allowed. A newer publication must not automatically make a still-applicable older certificate suspicious.

Proposed registry fields: standardVersion, publishedAt, effectiveFrom, transitionEnds, certificateVersion, verificationDate, scope and issuer. Select the applicable rule at observation time. Before deployment review the currently applicable version and exceptions. The standard's copyright notice restricts reproduction/commercial use: link to it and independently review permitted reuse before embedding any standard text or derived exhaustive rule corpus.

### NEW-004 — Intelligence feeds face rollback and freeze attacks

Primary sources: [The Update Framework security model](https://theupdateframework.io/docs/security/), [specification](https://github.com/theupdateframework/specification/blob/master/tuf-spec.md). Security page opened; specification retrieved in primary-source search 2026-10-08. Detailed client/library feasibility review pending.

TUF distinguishes substituted content, rollback, freeze and fast-forward attacks. In DropShredder an old but valid merchant or recall dataset can be misleading even when the download uses HTTPS. A hash fetched beside a file from the same compromised host does not provide an independent trust anchor (engineering inference).

Proposed design direction: retain packaged baseline data until a complete authenticated update passes validation; keep last-seen signed version, expiry, schema compatibility, content hashes and size bounds; use atomic replacement and explicit stale status. Signing authenticates a publisher, not the accuracy of an allegation. Malicious signatures, expired metadata, huge counts, version jumps and clock skew need tests. Full TUF integration versus packaged-only updates remains undecided; no backend, payment or new dependency is authorized here.

### NEW-005 — Content Credentials can verify an edit history, not garment truth

Primary source: [C2PA v2.2 explainer](https://spec.c2pa.org/specifications/specifications/2.2/explainer/Explainer.html), goals, principles and metadata-removal FAQ. Opened 2026-10-08. This is a verified version, not asserted to be the latest specification.

C2PA can bind provenance assertions to an asset and validate their integrity under a trust model. It does not establish that the depicted garment has the claimed fabric, durability or manufacturing source. Credentials can also be removed; their absence is not an AI-image or fraud signal.

Proposed optional Deep Hunt: display available validated provenance, signer/trust status and documented editing actions without converting them into a fraud verdict. Avoid automatic remote recovery or uploading image fingerprints: the explainer describes cloud discovery, which requires a separate privacy decision. Implementation, current library license and size review remain pending.

### NEW-006 — Measure errors among displayed warnings

Primary paper: [Bai and Jin, Conformal Selective Prediction with General Risk Control](https://arxiv.org/html/2603.24704v1), submitted 2026-03-25. Reviewed sections 2 and 6, including assumptions; proofs and reproduction code not audited.

SCoRE distinguishes average deployment loss across all opportunities from loss among accepted predictions. Its basic guarantee relies on exchangeability and labelled calibration cases; its covariate-shift extension has explicit weighting assumptions. Estimated weights do not provide the same unconditional finite-sample promise.

Application: report false warnings among the warnings actually shown, alongside alert coverage, missed known positives and abstentions. A quiet detector can appear accurate by declining almost everything. Keep the existing severe-evidence gate outside any statistical threshold. Evaluate offline with frozen model/rules and separate training, calibration and test sets grouped by merchant/product lineage; do not tune on test labels. Require time, language, platform and garment-category slices. No numerical reliability guarantee for DropShredder follows from this paper.

### NEW-007 — Prefer offline threshold calibration to costly per-page recomputation

Primary paper: [Xu, Guo and Wei, Selective Conformal Risk Control, v2](https://arxiv.org/html/2512.12844v2), revised 2026-04-27. Reviewed two-stage framework and assumptions, not all proofs.

The authors contrast a transductive variant requiring per-test recomputation with an inductive variant reusing thresholds under a PAC-style guarantee. Selection and uncertainty calibration are separate stages. Their reported benchmarks are not ecommerce validation.

Application: investigate an offline calibrated, versioned abstention threshold for future matching models. Ship only bounded parameters plus validation metadata; preserve visible evidence requirements. Use an explicit insufficient-evidence state where candidate identity is ambiguous. Benchmark threshold lookup separately from feature extraction. Do not copy a paper's stated coverage target into a consumer accuracy claim.

### NEW-008 — Freshness weighting does not remove distribution-shift risk

Primary paper: [Farinhas et al., Non-Exchangeable Conformal Risk Control, v2](https://arxiv.org/html/2310.01262v2), revised 2024-01-26. Reviewed methods equations 7–8 and accompanying bound discussion; older foundational paper, not a new 2026 release.

The guarantee contains an additional distribution-mismatch term; weighting recent or similar observations can tighten bounds but does not make arbitrary drift harmless.

Application: include unseen merchant networks, new language packs, changed supplier imagery and future time periods in evaluation. Preserve the calibration corpus's dates, lineage and detector version. If labels or population coverage are insufficient, retain evidence-strength labels rather than probability percentages. Recency alone is not enough: newly observed templates may be highly correlated.

### NEW-009 — Future AI extraction must have no authority over browser actions

Primary source: [OWASP LLM Prompt Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html), opened 2026-10-08. Reviewed multimodal, persistent injection and tool-boundary controls.

OWASP describes instructions in external documents/images and stresses that prompt delimiters do not enforce permissions. This matters if Deep Hunt later passes storefront text, OCR or fetched reports to a local generative model. Local inference removes a hosted-model dependency but does not eliminate hostile inputs (application inference).

Proposed contract: the model may return typed candidate observations with evidence references; it cannot request hosts, change consent, write history, initiate requests, select the scanned tab or assign final severity. Deterministic code validates fields and links every supported statement to the captured product context. Show model output as escaped text. Unknown fields, fabricated source references and generated action requests are rejected. Never provide cross-tab/history content unnecessarily. This is a future architectural control, not a finding of a vulnerability in the supplied build.

### NEW-010 — Test contamination across a research chain

Primary paper: [StepJack](https://arxiv.org/html/2608.06477v1), submitted 2026-08-06. Reviewed attack model, results, limitations and license heading. Its evaluation is a single run on computer-use agents, with 480 examples; results cannot be transferred to DropShredder's deterministic scanner.

The relevant defensive idea is multi-page contamination: individually innocuous-looking steps can together redirect a research workflow. Proposed offline fixture family: product text to linked certification page to cached supplier note, where none may alter the original task, permissions, history or target. Measure unauthorized effects separately from whether a keyword detector notices the text. Include harmless quoted instructions and educational pages as negative controls. The paper is CC BY-NC-SA 4.0; review dataset/code licenses independently before reuse. Do not bundle benchmark material on the basis of paper access alone.

### NEW-011 — A browser C2PA tool exists, with important resource and trust choices

Primary sources: [official c2pa-web README](https://github.com/contentauth/c2pa-js/blob/main/packages/c2pa-web/README.md), [project license](https://github.com/contentauth/c2pa-js/blob/main/LICENSE), opened 2026-10-08. License text verification still being completed.

The browser SDK documents bundled WASM, an inline option with a significant bundle-size cost, configurable trust validation and explicit Reader cleanup. Its documented one-gigabyte rejection limit is much larger than an extension should accept.

Recommendation: candidate only for selected-image Deep Hunt; use local executable assets, strict input-byte/decode/memory limits, cancellation and cleanup. Decide trust anchors, revocation and network behavior explicitly. Parsing a manifest without validating signer trust must never receive a trusted badge. Size, full dependency licenses, trust-list freshness and actual Chrome 133/CSP compatibility require measurements. No SDK was installed or executed.

### NEW-004 verification update

The primary TUF specification was opened and identifies itself as version 1.0.36, dated 2026-08-05. Its scope includes opaque target files, so signed inert intelligence data is within the framework's conceptual scope. Root-key bootstrap and threshold key rotation are part of the design. This still does not validate the truth of the data or make a partial implementation TUF compliant. The tuf-js client page/source retrieval failed; it is not approved as a browser dependency on this evidence.

### NEW-012 — GTIN validation is not product authenticity or country evidence

Primary sources: [GS1 identifier structure](https://support.gs1.org/support/solutions/articles/43000734137-what-is-the-gs1-barcode-commonly-used-for-trade-item-identification-), [prefix/origin clarification](https://support.gs1.org/support/solutions/articles/43000734188-does-the-gs1-prefix-first-3-digits-of-the-ean-13-barcode-number-show-the-country-of-origin-), opened 2026-10-08; [Verified by GS1 access guidance](https://www.gs1.org/services/selling-online/verified-by-gs1-marketplaces), primary search retrieved; direct open failed.

GS1 says the check digit supports number integrity; item references differ for trade-item variations. The issuing prefix does not establish manufacturing country. Its public-access guidance describes 30 free daily lookups and membership-mediated advanced access, not an unlimited keyless browser API.

Application: preserve identifiers as digit strings, validate syntax/check digit, and then verify association with the selected variant. Keep retailer SKU in a separate merchant namespace. A valid copied barcode is not evidence of authorization or textile composition. Expose optional manual registry lookup without consuming a shared quota or embedding credentials. Negative controls: leading zeros, retailer SKU collision, copied GTIN on an unrelated product, and barcode prefix contradicting no genuine origin claim. Recheck access limits before integration.

### NEW-013 — Confusable text must never become an authorization identity

Primary source: [Unicode UTS #39](https://unicode.org/reports/tr39/), opened 2026-10-08; retrieved revision 34 identifies Unicode 18.0.0 and date 2026-08-27. Reviewed identifier scope and confusable-skeleton notes.

The standard's skeleton is an intermediate comparison form, not display text; its results can change between Unicode versions. This is a deeper distinction than normalizing review-obfuscation keywords.

Proposed contract: maintain three values separately—raw observed text, parsed exact URL origin/ASCII hostname, and a versioned similarity form. Authorization, host permissions, cache keys and tab identity use exact parsed identities. A confusable match may suggest a comparison; it cannot merge merchants or authorize a request. Display both readable and ASCII hostnames when ambiguity matters. Legitimate internationalized names and mixed scripts carry no standalone misconduct weight. Include bidi text, punycode, Unicode-version migration and unrelated same-skeleton merchants in fixtures. Do not apply review-text normalization to certificate IDs or security boundaries.

### NEW-014 — ProductGroup markup can explain legitimate shared reviews and variants

Primary source: [Google product-variant documentation](https://developers.google.com/search/docs/appearance/structured-data/product-variants?hl=en), opened 2026-10-08. This capability dates from 2024; it is newly examined here, not a newly released Chrome feature.

The documented parent/child structure uses ProductGroup, hasVariant, variesBy and productGroupID, with common brand/review information and child-specific properties. Single-page and multi-page patterns differ.

Application: reconstruct only a bounded local parent/child graph from markup already on the eligible page. Resolve the currently selected child's price, availability, material, size, colour and URL against visible selection. Preserve parent review scope. Do not call related colours review hijacking or assign the first JSON-LD offer to every variant. Seller-supplied markup remains a claim; conflicting DOM/markup becomes unresolved extraction evidence rather than an automatic severe accusation. No recursive fetching of every variant. Fixtures: nested graph, isVariantOf reference, material-changing variant, stale offers, and multiple recommendation products beside the selected item.

### NEW-015 — Fibre marketing offers a more concrete quality-claim check

Primary source: [FTC bamboo textile guidance](https://www.ftc.gov/bamboo-textiles), opened 2026-10-08. Historical guidance retrieved from the current regulator site; jurisdiction and current rule applicability require review for release use.

The FTC distinguishes actual bamboo fibre from rayon/viscose manufactured using bamboo as feedstock. These terms describe different claims, even though marketing often conflates them.

Proposed US-specific claim adapter: preserve the visible marketing statement and the independently available care/composition label for the same garment and variant. A headline claiming bamboo and composition saying rayon can prompt a clearly scoped materials explanation and further verification. Do not declare a legal violation from a missing label, an OCR guess or geography. Mechanically processed bamboo is a legitimate control; so are accurately disclosed rayon-from-bamboo descriptions. Add a claim/label discrepancy view before any inferential material-quality model. Fibre type itself is not a durability score.

### NEW-011 verification update

The opened c2pa-js project license is MIT, copyright Adobe 2025. This verifies the top-level JavaScript project license only; separately inspect the WASM/native dependencies, notices and trust-list reuse terms before bundling. The earlier documentation page produced no readable content, so the repository README was the direct implementation reference.

### NEW-016 — A fabric model trained on merchant labels learns declared composition

Primary paper: [Can et al., Image2Garment, v4](https://arxiv.org/html/2601.09658v4), revised 2026-03-19. Reviewed dataset curation, evaluation tables and failure cases; earlier v2 was checked before opening current v4.

FTAG uses vendor-provided garment metadata, with filtering for ambiguity and multilayer cases. The paper reports cotton/viscose confusion and limitations for layered garments. Its composition benchmark is not independent chemical verification of every training garment.

Application inference: a model trained on merchant descriptions cannot independently establish that another merchant's composition claim is false. Use visual attributes for candidate retrieval or suggesting which label to inspect; do not report synthetic percentages as measured fibre content. Distinguish vendor annotation, physical measurement and prediction in every dataset record. Benchmark deliberately mislabeled listings against genuine measured specimens before any quality claim. Paper is CC BY 4.0; code, datasets and model reuse terms remain separate pending checks. The generative/simulation pipeline is not a recommended passive extension dependency.

### NEW-017 — Modern cotton-recognition research supports triage, with limits

Primary paper: [Wiedemann et al., A hybrid deep-learning-architecture for identifying cotton content in fabric materials](https://pmc.ncbi.nlm.nih.gov/articles/PMC13143062/), PLOS ONE, 2026-05-05, DOI 10.1371/journal.pone.0346583. Reviewed abstract, evaluation discussion, use-case implications and limitations; model/data not run.

The study reports 14.01% RMSE under stratified five-fold validation and explicitly limits visual-only use for correct fabric labelling. The authors discuss repeated fabric images as an evaluation issue. Ordinary garment marketing photographs are a further unvalidated domain shift.

Engineering inference: require physical-fabric/garment grouping in any DropShredder evaluation split; ordinary stratification alone does not prove absence of repeated-specimen leakage. Test lighting, compression, crop, overlays and unseen fabric constructions. A photo estimate may aid manual triage, but cannot substantiate exact composition, chemical safety or durability. The article's CC Attribution terms do not automatically cover third-party datasets/weights. An NIR-imaging paper was also located, but primary full-text retrieval failed; no NIR method is treated as reviewed or usable here.

### NEW-018 — Portable archives preserve observations, not automatic truth

Primary sources: [WACZ 1.2.0](https://specs.webrecorder.net/wacz/1.2.0/), [WACZ signing 0.1.0](https://specs.webrecorder.net/wacz-auth/0.1.0/), [ArchiveWeb.page privacy policy](https://webrecorder.net/legal/archivewebpage-privacy-policy/), [license](https://github.com/webrecorder/archiveweb.page/blob/main/LICENSE.md). Opened 2026-10-08; policy dated 2024-09-27.

WACZ packages web responses, indexes and metadata for portable replay. Signing distinguishes anonymous integrity from externally managed identity/time attestations. ArchiveWeb.page states local storage and no default sharing; its optional IPFS sharing publishes selected archives. Its project license is AGPL v3 (package metadata identifies or-later).

Recommendation: evaluate as a separate, explicit researcher tool on public pages, with license/privacy review before any embedding. Keep account, checkout and personal records excluded. For DropShredder's own default export, prefer a small redacted evidence package with exact claim, source URLs, variant/context, observed UTC time, detector/data versions and local digest. A locally recorded time or digest does not prove original publication date or merchant ownership. Redaction creates a new artifact with a new digest. No WACZ capture, signing service, public archive or extension installation was performed in this pass; the delivered catalogue preserves reviewed source presence and notes, not complete web snapshots.

### NEW-019 — Represent evidence derivation explicitly for agent handoffs

Primary source: [W3C PROV-DM](https://www.w3.org/TR/prov-dm/), Recommendation 2013-04-30, opened 2026-10-08. Reviewed entity/activity/derivation and revision/quotation/primary-source relationships. This is an older interoperability standard, not new research.

Application beyond the existing independence-key notes: represent observed page, extracted claim, match candidate and verdict as distinct records connected by typed derivation edges. A screenshot and JSON-LD observation from one page share ancestry; five copied reports can point to one primary source. Track revisions without silently overwriting the basis for an older verdict. JSON with a small PROV-inspired vocabulary is sufficient initially; importing a full RDF stack is unnecessary. Source independence remains a reviewed evidence judgment, not something a graph automatically proves. Bound graph size and reject self-references/cycles in generated derivation records. Make unsupported edges unresolved so missing lineage never earns an independent-evidence bonus.

## Suggested engineering order

| Priority | Research application | Promotion gate |
|---|---|---|
| P0 | Exact origin versus text normalization; selected-variant attribution | Deterministic adversarial and legitimate fixtures, then real Chrome QA |
| P0 | Textile certificate scope and composition-claim evidence view | Official lookup UX and category/jurisdiction review; unresolved states preserved |
| P1 | Warning precision, abstention and grouped/time-separated evaluation | Independently labelled corpus; frozen evaluation and minimum coverage criteria |
| P1 | Evidence lineage and compact redacted export | Reproduction and privacy review; source traceability without full-page collection |
| Conditional | Authenticated intelligence updates | Only if updates are introduced; complete trust/bootstrap/expiry design |
| Deferred | C2PA/visual composition/AI extraction | License, size, memory, CSP, attack-resistance and device benchmarks; explicit Deep Hunt |

## Academic review ledger

| Paper | Version/date examined | Reading depth | Direct incorporation |
|---|---|---|---|
| SCoRE, Bai & Jin | v1, 2026-03-25 | Setup, deployment risks, covariate-shift assumptions | Offline evaluation research; no guarantees adopted |
| Selective Conformal Risk Control | v2, 2026-04-27 | Two-stage method, guarantee distinctions and assumptions | Offline threshold candidate |
| Non-Exchangeable Conformal Risk Control | v2, 2024-01-26 | Methods and shift-bound interpretation | Evaluation methodology |
| StepJack | v1, 2026-08-06 | Threat model, evaluation, limitations, license heading | Defensive fixture inspiration; benchmark reuse pending |
| Image2Garment | v4, 2026-03-19 | Curation, evaluation, documented failure modes | Retrieval/annotation research; no composition verdict |
| Cotton-content hybrid model | 2026-05-05 publication | Evaluation discussion, use-case implications and limits | Triage/evaluation research; no model installed |

No paper proofs were independently verified and no benchmark was reproduced. Dates above describe the retrieved versions, not claims of exhaustive literature coverage.

## Publication and current-release checkpoint

The owner explicitly authorized git publication for worker access after the initial research checkpoint. Published branch: `research/20261008-defensive-intelligence`; first verified remote commit: `6ed2a05c37aea00ef53a1e32242148ba1a7d35e7`. The GitHub-published tree matched the complete locally validated research tree. The branch also contains the prior 41-finding catalogue, nine prior paper records, source-presence archive and previously validated informational source/tooling additions. No further detector/source-registry change was made in this additional research pass.

At publication verification, release/security-performance-hardening was `2f89ddaac2037dbeb78be5a39ae7254b68394a78`, while this research branch deliberately retains supplied build `1507b551` as its base. Read current release code and authority before integrating any candidate; do not overwrite the later release with this research tree. Current release AGENTS and CURRENT-STATE were re-read and retain the beta scope, deferred heavy features and real-Chrome requirement. PR #9 was verified open, draft and unmerged. No release branch or PR mutation was performed.

Worker entry points: [research report](https://github.com/chairmantrash/DropShredder/blob/research/20261008-defensive-intelligence/brain/research/2026-10-08-RESEARCH-GAPS.md), [catalogue](https://github.com/chairmantrash/DropShredder/blob/research/20261008-defensive-intelligence/intelligence/research-gaps-catalogue-20261008.json). Follow-up publication-receipt commits may advance the branch; the SHA above records the first independently checked checkpoint.

## Resume protocol

Each numbered finding includes public sources, limits and an application. Promote none directly into merchant risk scoring. The companion JSON catalogue indexes all 19 findings and preserves source-presence metadata, including retrieval failures. The original engineering continuation agent can use these files alongside the existing 41-finding research report; real Chrome QA remains environment-blocked. Research was checkpointed after each finding batch. The owner subsequently authorized repository publication of this research. See DS-RESEARCH-GAPS-20261008 for publication evidence. No new runtime feature or Chrome QA pass follows from publishing research.
