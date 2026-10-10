# DropShredder research enhancement audit — 2026-10-08

Implementation branch: `feature/research-enhancement-audit-20261008`
Release baseline: `2f89ddaac2037dbeb78be5a39ae7254b68394a78`
Research baseline: `62a46d7be0ffc312b40f3a39fe12fe3f5a3143b0`
Owner task: DS-ENHANCEMENT-AUDIT-20261008
Decision: brain/decisions/20261008-001-research-integration-precision.md

## Outcome

Accumulated research and current release work are preserved together on an isolated branch. This sweep implements precision and performance foundations without changing active Chrome/extractor/classifier ownership, adding runtime dependencies or making passive third-party requests. PR #9 remains unmerged. This is a review candidate, not a Chrome QA approval or an assertion that every research idea is implemented.

## Implemented improvements

| Area | Observable change | Important limit |
|---|---|---|
| Product identity | Valid GTIN, ASIN and brand/model use separate namespaces; Unicode retained; conflicting variants defeat image matches | Seller-authored identifiers and valid check digits do not authenticate goods |
| Local source matching | Strongest candidate wins independently of input order; bounded history/images; sensitive URL query/fragment omitted; unknown/future chronology unscored | Local observation date is not first publication or proof of origin |
| Evidence fusion | Connected/transitive ancestry and explicit source observations count once; malformed numeric scores cannot escalate; coverage alone cannot establish trust | Legacy producers still need parent metadata review |
| Historical claims | Same offer, earlier observation, compatible variant and same currency required; shared local SKU/product is not merchant ownership | Missing attributes cannot establish a perfect selected-variant identity |
| Recall scope | Exact serial/range and attribute/exclusion states; small official Anker/Frigidaire model subset wired into passive rules | Information only; unit scope unknown until official confirmation; subset incomplete and dated |
| Certifications | Claimed case-sensitive identifier, component scope and official lookup context; FDA registration/export distinction | No verification request or authenticated certificate decision |
| Storefront context | Etsy, eBay, TikTok US, Wayfair, Depop and Mercari US policy exceptions | Information only; marketplace presence does not prove policy violations |
| Origin and returns | Business, manufacture, fulfillment and returns separated; aliases equivalent; explicit return-friction evidence | Country alone stays informational; region is not an established quality predictor |
| Image history | Per-call comparison/date reuse; strongest gallery relationship per current image/observation | Max 12 × 250 × 12 comparisons; synthetic budget is not Chrome performance |
| Review checks | CI/CodeQL PR triggers include the release target | No privilege or release-branch change |

## Research traceability

`intelligence/research-integration-audit-20261008.json` enumerates every primary finding in seven research catalogues and points to exact applications. It retains the other agents' research documents and distinguishes partial application from research-only references. The 23 manufacturer/network families and their graph remain research leads, not runtime brand blacklists. Known recall entities must be matched to exact affected products, dates and unit scope before any consumer warning.

Comparable tools and papers informed clean-room methods; none was copied or silently added as a dependency. Existing local core, Chrome 133 consent/document targeting, bounded extraction, foreground research controls, RDAP and report rendering are retained. Tool availability, license, model terms, resource footprint and provider egress require their own review before incorporation.

## Verification and performance

Exact Node 22 commands, results, fixture counts, clean package digest and measurements are in `workplane/runs/DS-ENHANCEMENT-AUDIT-20261008-VERIFICATION.json`. The new test file includes positive independent-evidence controls and adversarial identity, variant, chronology, scope, lineage, domain and certification cases. Updated existing fixtures remove an old false geographic warning expectation and local-SKU ownership inference.

Paired local benchmark, Node 22.20.0, sequential runs after other checks: passive rules 100k characters; 250 history observations/12 images; explicit gallery history 250 × 12 × 12; 512 correlated signals. Benchmark results are workload observations, not an accuracy evaluation. Source matching costs extra milliseconds for stronger identity and stable ranking. Image history no longer returns every gallery pair as a separate observation. There is no DOM, network, browser wall-time or physical-goods measurement.

The sandbox rejects tsx's CLI IPC pipe; checks use Node `--import tsx` with the same source scripts and Node's test runner. No permission escalation or runtime workaround was added. Architecture audit retains existing large-file warnings for sidepanel/main.ts and merchant-networks.ts.

## Remaining work and release gates

`workplane/tasks/DS-RUNTIME-AUDIT-FOLLOWUP-20261008.md` records three findings in active-owner files: overescaped Etsy routing, overescaped visible-price matching, and first-node structured-product attribution. Exact literal Node checks reproduce the first two; the third remains an attribution risk requiring fixtures and real Chrome. No owning-agent file was changed. These can bypass new product-level precision if extraction supplies the wrong item.

Real desktop Chrome 133+ and unpacked-extension installation are unavailable here. No mandatory browser QA test, consent test, toast click, lifecycle action, site scan or observed Chrome performance is claimed. Complete the full QA package on this candidate, stopping at the first reproducible failure.

Deferred: selected ProductGroup attribution with the Chrome owner; opt-in local OCR/embeddings with evaluated budgets and abstention; comprehensive dated regulatory data; entity-resolution/product matching of manufacturer graphs; authenticated certificate lookup; signed inert-data updates; portable evidence exports; calibrated false-warning and category-specific test sets. Fees, provider accounts and data-use terms keep several tools outside the free local core.

## Primary reference checks

- GS1 check-digit method: https://www.gs1.org/services/how-calculate-check-digit-manually
- OEKO-TEX Label Check: https://www.oeko-tex.com/en/label-check
- FDA cosmetic registration certificate clarification: https://www.fda.gov/cosmetics/cosmetics-news-events/fda-clarifies-it-does-not-provide-certificates-or-other-documents-verify-compliance-cosmetic-product
- FDA export certificate scope: https://www.fda.gov/cosmetics/cosmetics-exporters/cosmetics-export-certificate-faqs
- CPSC Anker model notice: https://www.cpsc.gov/Recalls/2025/Anker-Power-Banks-Recalled-Due-to-Fire-and-Burn-Hazards-Manufactured-by-Anker-Innovations-1
- CPSC Frigidaire scope: https://www.cpsc.gov/Recalls/2026/Curtis-International-Expands-Recall-of-Frigidaire-brand-Minifridges-Due-to-Fire-and-Burn-Hazards

The research catalogues retain further official storefront policies, tool repositories and academic references. Reviewed date is 2026-10-08; it is not a guarantee of future freshness.
