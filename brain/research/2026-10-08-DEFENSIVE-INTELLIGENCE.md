# DropShredder defensive intelligence — 2026-10-08

Base: `1507b551c8526b52a7201f3331f765f1735ff847`. Isolated research lane; PR #9 remains unmerged. This note complements current product/evidence authority and DS-021; it does not replace them.

## Incorporated in the research branch

Additional owner-authorized research is indexed in [2026-10-08-RESEARCH-GAPS.md](2026-10-08-RESEARCH-GAPS.md) and `intelligence/research-gaps-catalogue-20261008.json`: 19 findings, six additional paper reviews, and 27 source-presence records. Read `workplane/tasks/DS-RESEARCH-GAPS-20261008.md` for scope and verification. The owner now explicitly authorizes publishing this isolated knowledge branch for worker access; the earlier GitHub-publication rejection is historical. PR #9 remains unmerged.

- Six documented source candidates: Dear-Lover, Trendsi, FondMart, Wholesale7, CC Wholesale Clothing and USAdrop. These feed existing bounded source search and product-observation matching, not a domain-only quality blacklist.
- Additive tooling capability families for image/specification editing, apparel private labels and tracking-origin presentation. Tool-use risk remains zero.
- `intelligence/research-catalogue-20261008.json`: dated findings, links, expiry, review depth, explicit no-promotion status and training watch.
- `brain/research/2026-10-08-SOURCE-PRESENCE-ARCHIVE.json`: public URL/title/retrieval metadata and excerpt hashes. It is not a full-page snapshot archive; no copyrighted full article bodies are redistributed.

## Main implications

| Observation | Defensive application | Limit |
|---|---|---|
| Blind fulfillment and relabeling are advertised | Preserve independent item observations | Packaging is not manufacture proof |
| Tracking origin can be obscured | Separate claimed dispatch from carrier evidence | Do not inspect private tracking without consent |
| Product media and specifications can be edited | Combine identity, variants and independently captured attributes | Similar-looking apparel may differ materially |
| New Chrome APIs postdate the 133 minimum | Gate new features and keep compatible paths | No runtime behavior was changed here |
| Local OCR/ML libraries exist | Benchmark explicit Deep Hunt candidates | Model weights need separate license and resource checks |
| Garment test reports exist | Match tested identifiers and preserve sample limitations | No platform-wide or regional safety conclusion |

## Priority candidates for engineering review

1. Preserve explicit tab/document/route identity and worker-safe state. Validate sender data, keep privileged network destinations bounded, and fail closed on sensitive routes. Existing runtime behavior must be checked before proposing changes.
2. Evaluate suffix-aware hosted-store grouping: Chrome 153 `publicSuffix` versus a bundled PSL parser for 133. Do not equate hosted-domain grouping with ownership.
3. Consider Chrome 148 structured-clone messaging only with explicit safe payloads and a 133 fallback. It is not a zero-copy channel and ignores `toJSON` sanitizers.
4. Benchmark cheap-first candidate retrieval, optional image reranking, and selected label OCR. Keep native IndexedDB unless a measured benefit warrants a dependency. Do not load heavy models while passively browsing.
5. Add independently labelled garment lookalikes, material substitutions, edited photography, rewritten/translated descriptions and honest private-label examples before promoting new rules.

## Academic catalogue

| Paper ID | Use | Review depth |
|---|---|---|
| 2509.15858v2 | Compact multimodal product matching and retrieval bias | Methods inspected |
| 2602.11733v1 | Category attributes and targeted image crops | Relevant methods/evaluation inspected |
| 2501.13351v3 | Deceptive-pattern taxonomy and multimodal assessment | Primary abstract and framework sections inspected |
| 2512.18269 | Visual UI component detection | Primary abstract; performance not transferable |
| 2025.ranlp-1.78 | Product-aware generated review challenges | Primary paper metadata/abstract |
| 2506.13313 | Limits of prose-only authenticity judgments | Primary abstract |
| 2403.11593 | Fashion lookalike matching and human review | Primary abstract |
| 2410.02779 | Variants versus identical-product relationships | Primary abstract |
| 2609.37713 | Fresh bilingual matching benchmark | Search-only; direct page unavailable |

All source URLs and observation dates are in the catalogue. No model/dataset license acceptance, training, runtime integration or claimed extension accuracy follows from this review.

## Regression cases to develop before promotion

- R01: Honest domestic boutique uses an imported blank and clearly discloses it — no deception.
- R02: Original maker is copied by a wholesaler — no assumed upstream direction.
- R03: Same photo but different fabric composition — similarity candidate, identity unresolved.
- R04: Crop, flip, background or logo edit — candidate retention without stronger accusation.
- R05: Branded domestic 3PL dispatch — manufacture location stays separate.
- R06: Translated/syndicated review disclosed — no fake-review verdict from importer alone.
- R07: Color/size variants share reviews — no hijacking verdict without incompatible product evidence.
- R08: Unrelated products inherit reviews — corroborated mismatch candidate.
- R09: Targeted exact tested garment match — show source, date, jurisdiction and limitations.
- R10: Similar-looking tested garment — no inherited chemical/safety finding.
- R11: Hosted shops share a parent suffix — no automatic owner relationship.
- R12: Worker restart or route change during optional inference — stale result rejected; consent survives appropriately.

These are proposed evaluation cases, not executed browser tests.

## Acceptance limits

No repairs to the QA build, new permissions, risk-score changes, browser workaround, merge or public extension release. Real Chrome verification remains blocked. Local checks use Node 24.19.0, while canonical CI expects Node 22. The owner-facing checkpoint report is `DropShredder-Research-20261008.md`; later agents should load that current report and this task before continuing.
