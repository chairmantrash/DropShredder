# DropShredder — popular retail category detection gaps

2026-10-08. Twenty-two findings across seven category groups, including three academic study leads and issuer/tool access boundaries. Selection fills thinner category-specific coverage in the existing research corpus; it is not a sales-ranked or representative market sample. This document and the catalogue are research inputs only; no runtime detection rule, risk weight or browser behavior changed.

## Category map

| Category | Useful identifiers and claims | Strongest source reviewed | Detection gap to close in engineering | Limits |
| --- | --- | --- | --- | --- |
| Batteries, charging and cables | Exact model, serial, watts, data speed, certification scope/date | CPSC 25-466; Anker serial guidance; USB-IF product search | Model versus affected serial; cable power versus data capability; certification-date filtering | No serial checks or physical capacity/e-marker tests performed |
| Cosmetics and skincare | Product/package name, ingredients, batch, responsible person, exact FDA/certificate claim | September 2026 FDA registration statement; tested-product table | Fake authority implication; ingredient claims versus measured contents; drug/cosmetic classification | Listing/registration is not FDA product approval; ingredient absence does not prove chemical absence |
| Small appliances | Manufacturer, importer, marketing brand, exact model suffix and serial family | CPSC Frigidaire-brand minifridge original/expansion | Exclusion predicates, dated notice lineage and licensed-brand role separation | Official source chronology conflicts; do not guess the correction |
| Fitness equipment | Model, serial families, seller/purchase period and remedy | BowFlex 25-311 | Old versus new importer and serial-limited scope | Photos cannot verify load/retention strength; full serial table not transcribed |
| Decorative lighting | Exact model/packaging, battery type, hazard component, issuer mark | Happiness Light 26-403; Room2Room 25-204 | Battery-ingestion hazards across product categories; USB-switch hazards | No inferred LED toxicity, flicker or brightness claims |
| Jewelry | Set composition, package, FNSKU, seller ID; child/adult use | Newmemo 24-366; Yaomiao 25-082; Health Canada FY2024–25 | Identifiers beyond ASIN; chemical evidence tied to tested sample and jurisdiction | Silver color/low price cannot establish lead/cadmium content |
| Outdoor and water safety | Approval number, manufacturer, model, production date, jurisdiction, use restrictions | USCG CGMIX status definitions | Expired versus Former-May Use versus Former-May Not Use; MRA coverage exceptions | Approval database misses are unresolved; serviceability/fit/buoyancy not tested |

## Useful current findings

FDA's 2026-09-09 update says it does not issue documents certifying cosmetic registration/listing. Capture the exact claimed issuer and meaning before comparing a listing's certificate claim to FDA guidance. A third-party registration service may document its own work; that differs from a purported FDA-issued approval. Small-business exemptions and drug/device overlap prevent a missing-record rule. [CG05]

The FDA laboratory table supplies named sampled products, sellers, test years and statuses across Etsy, eBay and other channels. Use exact sample/package identities; a newer page update does not make an old 2022 sample current. Toxicant assay results support safety findings about a linked tested item, not a platform defect rate or generic accusation about origin. [CG06]

The battery recall requires model and serial verification. Vendor character-confusion warnings are a useful OCR fixture: preserve the original serial and user verification instead of silently replacing characters. Do not transmit serials, purchase proof or personal details from ordinary browsing. Explicitly linking the official remedy/lookup is a possible free-core action; no public serial API is assumed. [CG01–CG02]

USB-IF certification is capability-specific, and its public-search default hides certifications older than two years. A lookup needs preserved filters/date. Power delivery, connector geometry, data speed and device compatibility are separate claims. A cable certificate does not certify the attached charger, battery or appliance. Current 60W/240W logo guidance does not by itself invalidate older 100W hardware. [CG03–CG04]

The minifridge expansion points to a prior recall as July 2024, but the linked original is dated July 24, 2025. Both source claims are recorded. The original also excludes EFMIS129-B/C; prefix matching alone would produce false warnings. Source conflict and explicit exclusion states are needed in the ingestion model. [CG07, CG22]

BowFlex's recall separates pre-bankruptcy BowFlex/Nautilus units from Johnson Health Tech Trading sales and remedies. Store notice-time seller and purchase period separately from current brand identity. Serial bounds must be interpreted within their documented family; do not apply a generic string comparison across unrelated prefixes. [CG08]

Decorative LED products supply two distinct safety examples: accessible coin cells and an overheating USB switch. Intended decorative use must not suppress component hazards. Hazard matching needs a documented exact product, not a photo-based assumption about battery doors or power electronics. [CG09–CG10]

Newmemo's FNSKU and seller ID are different identifier namespaces from ASIN or GTIN. Yaomiao lacks a unique SKU in the reviewed record, so package/set composition provides a candidate match that still needs corroboration. Product/package scope stays narrow. [CG11–CG12]

## Verification tools and integration boundaries

| Source/tool | Access observed | Suggested role | Unverified |
| --- | --- | --- | --- |
| USB-IF Product Search | Public description/search; separate member integrators list | User-initiated logo/capability record check, with date filters | No exact query, automation API, CORS, bulk reuse terms or accuracy measured |
| UL Product iQ | Complimentary account described by UL | Optional official certification research link | No account/login/API or certificate authentication performed |
| Intertek directories | Public directory links | Correct mark/program lookup; maintain Listed versus Verified distinction | Downstream access, exact record, quotas and redistribution rights not tested |
| USCG CGMIX | Public database/search documentation | Approval scope/status/jurisdiction reference | No exact approval query or browser integration tested |
| FDA named tested-product list | Public agency table | Product/sample hazard reference and current notice refresh | No new laboratory testing; no assumed product-clearance database |

UL mark country codes describe the standards geography, not where a product was manufactured. Keep certification geography in a separate field. Mark variants can be legitimate; generic logo recognition cannot authenticate a certificate. Intertek similarly supplies multiple programs with distinct scopes. No severe counterfeit-certification conclusion should rest on a missing result or an unfamiliar logo alone. [CG15–CG17]

CGMIX's Expired state does not simply invalidate pre-expiry manufactured items. Former-May Use and Former-May Not Use have different meanings; preserve serviceability/use conditions and relevant jurisdiction. Some MRA approvals appear in other sources. [CG13–CG14]

## Academic and inspection evidence

| Record | Review depth | Useful transfer | Boundary |
| --- | --- | --- | --- |
| 2023 adult-jewelry study, DOI 10.1016/j.jhazmat.2023.132167 | Metadata/abstract opening; eight samples | Physical pXRF assay as a testing lead | Not a current market prevalence estimate or photo classifier; full methods not reviewed |
| 2026 NYC mercury surveillance paper, DOI 10.1038/s41370-026-00961-9 | Abstract/metadata; deeper retrieval failed | Product labels can omit measured mercury; publication and collection dates must be distinct | Samples collected 2009–2022; no current-platform prevalence inference; no denominator percentages reproduced |
| 2025 online skin-lightening study, PMID 40754048 | Primary abstract search excerpt; direct open empty | Follow-up lead for 134-product XRF study and provenance/selection analysis | Methods/sample identities/confirmation not verified; no regional coefficient adopted |
| Health Canada FY2024–25 jewelry inspections | Method and result rows read | Screening versus laboratory confirmation; retain product-level findings and no-action rows | Targeted systematic sampling bias explicitly stated; not a random survey |

Health Canada's project includes 38 imported products, three recalls, two alerts and 33 no-corrective-action instances. The China-origin table contains both adverse and no-issue-detected rows. Preserve that product distinction. A no-action sample is limited evidence for the tested requirements/time; it is not permanent all-brand safety clearance. [CG18]

## Handoff fields and evaluation cases

Each candidate needs a product subject, typed raw identifier, source URL/locator, observation/publication/sample dates, jurisdiction, actual issuer/company role, notice status, model/serial/batch inclusions and exclusions, conflicting claims and refresh requirement. Distinguish claimed, verified-scope, unresolved, explicitly excluded and historical states.

Suggested fixtures: listed model but unknown serial; recalled prefix with excluded suffix; confusable serial character; cable power certification with unsupported data-speed claim; cosmetic registration marketed as FDA-issued approval; legitimate exemption; old assay promoted as new prevalence; FNSKU mistaken for ASIN; importer mistaken for manufacturer; expired production approval applied to pre-expiry item; authority page date conflict. These are engineering proposals, not tests executed here.

Product safety, advertised performance, manufacturing provenance and deceptive marketing should have separate evidence conclusions. The existing repository evidence gate still controls severe accusations. Region is sourced metadata; category-controlled representative validation would be needed for a predictive weight.

## Remaining gaps

No live retailer listing, issuer lookup, physical sample, laboratory assay, login, API request, production adapter or Chrome test was performed. Food/supplements, automotive parts, tools, infant products beyond existing toy/furniture records, and connected-home cybersecurity remain expansion areas. The next requested batch compares additional storefronts and seller tutorials.

## Findings and source presence

### CG01 — Serial numbers matter in a major battery recall

Recall 25-466 (2025-09-18) names Anker A1647/A1652/A1257/A1681/A1689; CPSC directs consumers to verify serial numbers. Reported fire/burn incidents are product-specific.

Application: Match model first, then official serial scope; do not collect/upload serial numbers or identity passively. Preserve exact model/serial distinction.

Limits: No all-Anker warning; no current listing inspected or serial lookup submitted.

[Primary source](https://www.cpsc.gov/Recalls/2025/Anker-Power-Banks-Recalled-Due-to-Fire-and-Burn-Hazards-Manufactured-by-Anker-Innovations-1) — opened; checked 2026-10-08.

### CG02 — Vendor serial-check guidance is not an open lookup API

Vendor lists the same five models and a serial/proof-of-purchase recall form; warns about confusable characters.

Application: Offer explicit official lookup; retain raw OCR and ask user to verify confusable characters.

Limits: No undocumented API or automatic claim submission; never silently correct a serial.

[Primary source](https://www.anker.com/rc2506) — primary manufacturer search excerpt; checked 2026-10-08.

### CG03 — USB certification is capability-specific

USB-IF public search covers products certified for its logo, maintained by member firms; default filter shows only two years. Older records require date filtering.

Application: Preserve lookup filter and age before declaring missing certification; a found record supports its own tested scope.

Limits: No exact product lookup made. Absence is unresolved, not counterfeit; USB compliance is not general electrical/fire certification.

[Primary source](https://www.usb.org/products) — opened; product-search description read, no lookup submitted; checked 2026-10-08.

### CG04 — Power rating and data speed are separate claims

USB-IF cable program distinguishes purposes/capabilities; its current USB-C-to-C certification label guidance lists 60W or 240W power icons.

Application: Extract power/data features independently; retain label-claim versus certification-verified states.

Limits: Do not call a legacy 100W cable unsafe based on a newer logo scheme; no physical/e-marker/protocol test performed.

[Primary source](https://www.usb.org/cable_connector) — primary official search excerpt; checked 2026-10-08.

### CG05 — FDA registration certificates are a misleading-claim gap

FDA's 2026-09-09 update says it does not issue cosmetic registration/listing verification certificates. Registration/listing does not establish FDA approval; some small businesses are exempt.

Application: A claim of FDA-issued cosmetic registration certificate deserves source/issuer checking. Compare exact claim to FDA statement and preserve quote/locator.

Limits: A third-party registration service is not automatically fraud; missing listing is not proof of illegality. Drug/medical claims require separate classification.

[Primary source](https://www.fda.gov/cosmetics/registration-listing-cosmetic-product-facilities-and-products) — opened; checked 2026-10-08.

### CG06 — A tested-product list supplies precise safety leads across platforms

FDA's product-specific laboratory table includes Collagen Plus Vit-E Night Cream sold on Etsy (2022: mercury 3,670ppm; hydroquinone 2.0%) and Deluxe Silken Bleaching Cream sold on eBay (2026: mercury 19,027ppm; reported Jamaica origin). Those sampled products are not a platform prevalence estimate.

Application: Match exact name/package and sample year; source hazard to tested product; keep listing-removal, warning and recall states separate.

Limits: Current listings and same-name batches unverified; no new product laboratory testing. Region is table metadata, not inferred.

[Primary source](https://www.fda.gov/consumers/health-fraud-scams/fda-warns-consumers-skin-products-containing-mercury-andor-hydroquinone) — primary FDA search excerpt; checked 2026-10-08.

### CG07 — Serial-restricted licensed-brand appliance recall

Recall expansion 26-199 (2026-01-15) names red EFMIS121 minifridges, serials A2001–A2310, Target sales. Manufacturer ShangYu North Electron Manufacture; importer Curtis International of Canada; origin China. CPSC reports at least six fires with property damage.

Application: Separate brand license/marketing identity, manufacturer and importer; preserve bounded serial scope and expansion lineage.

Limits: Expansion text says July 2024, but its linked original 25-395 is dated July 24, 2025. Preserve source conflict. Serial scope and EFMIS129 suffix exclusions govern; do not warn on every Frigidaire model.

[Primary source](https://www.cpsc.gov/Recalls/2026/Curtis-International-Expands-Recall-of-Frigidaire-brand-Minifridges-Due-to-Fire-and-Burn-Hazards) — opened; checked 2026-10-08.

### CG08 — Historical seller changes can alter recall remedy

Recall 25-311 (2025-06-05) covers BowFlex 552/1090 and listed serial ranges. Notice distinguishes units sold by pre-bankruptcy BowFlex/Nautilus from Johnson Health Tech Trading and different remedies. Origin China.

Application: Use exact serial-family ranges and purchase period; importing brand-wide current safety or remedy status would be wrong.

Limits: Weights/capacity cannot be verified from listing photos. No physical retention/strength test, exhaustive serial transcription or current notice refresh beyond this retrieval.

[Primary source](https://www.cpsc.gov/Recalls/2025/Johnson-Health-Tech-Trading-Recalls-BowFlex-Adjustable-Dumbbells-Due-to-Impact-Hazard-Including-3-7-Million-Sold-by-Nautilus-Inc) — primary regulator search excerpt; checked 2026-10-08.

### CG09 — Small coin-battery lights can create household hazards

26-403 (2026-04-09): Happiness Light 24-pack, two CR2032 cells per round light, accessible batteries/missing warnings. Retailer J U Kai Technology; China origin.

Application: Classify components as well as intended decor use. Store exact package/count/design scope.

Limits: No general battery-accessibility judgment from a photo. Factory unknown; no unique SKU obtained.

[Primary source](https://www.cpsc.gov/Recalls/2026/LED-Lights-Recalled-Due-to-Risk-of-Serious-Injury-or-Death-from-Battery-Ingestion-Violates-Mandatory-Standard-for-Consumer-Products-with-Coin-Batteries-Sold-on-Amazon-by-Happiness-Light) — primary regulator search excerpt; checked 2026-10-08.

### CG10 — USB low-voltage products can still have fire hazards

25-204 (2025-04-03): Room2Room bear-light USB switch overheating/melting, with burns/property damage. Distributor 1616 Holdings; retailer Five Below; China origin.

Application: Match exact model/packaging and hazard component; avoid a rule that all USB-powered products are safe.

Limits: No all-Five Below or all-LED warning; performance/brightness/flicker untested.

[Primary source](https://www.cpsc.gov/Recalls/2025/Five-Below-Recalls-Room2Room-LED-Iridescent-Bear-Lights-Due-to-Fire-and-Burn-Hazards) — primary regulator search excerpt; checked 2026-10-08.

### CG11 — Packaging identifiers can outperform title aliases

24-366 (2024-09-19) names Newmemo 36-ring sets, pink heart case, FNSKU X0034COQMP; importer Memovan Technology Industrial dba Newmemo. Lead/cadmium violations; China origin.

Application: Keep FNSKU, ASIN, seller ID and GTIN as different identifier types. Product matching must retain 36-ring/case scope.

Limits: No chemical-composition inference from silver-colored appearance. Historical seller ID does not prove present identity.

[Primary source](https://www.cpsc.gov/Recalls/2024/Childrens-Jewelry-Sets-Recalled-Due-to-Risk-of-Lead-and-Cadmium-Poisoning-Violations-of-the-Federal-Lead-Content-Ban-and-Federal-Hazardous-Substances-Act-Sold-Exclusively-on-Amazon-com-by-Newmemo) — primary regulator search excerpt; checked 2026-10-08.

### CG12 — Set descriptions and retailer identity matter without a SKU

25-082 (2025-01-02) names three Yaomiao sets, retailer Wuhannuoyunxindianzikejiyouxiangongsi dba LordRoads, lavender packaging; lead/cadmium violations, China origin.

Application: Combine package phrase, set composition, source images and retailer history as identity candidates.

Limits: Phrase alone is nonunique; no all-Yaomiao product warning, no chemical tests executed.

[Primary source](https://www.cpsc.gov/Recalls/2025/Yaomiao-Childrens-Jewelry-Sets-Recalled-Due-to-Risk-of-Lead-and-Cadmium-Poisoning-Violations-of-the-Federal-Lead-Content-Ban-and-Federal-Hazardous-Substances-Act-Sold-Exclusively-on-Amazon-by-LordRoads) — primary regulator search excerpt; checked 2026-10-08.

### CG13 — USCG equipment lookup has explicit coverage exceptions

CGMIX lists approved/certified vessel/boat equipment, with some European Notified Body MRA approvals located elsewhere.

Application: Offer official approval lookup; preserve jurisdiction and exceptions before evaluating a missing result.

Limits: Database/API access, exact product searches and other-jurisdiction coverage untested. Unknown is not fake approval.

[Primary source](https://cgmix.uscg.mil/equipment/Default.aspx) — primary official database description read; checked 2026-10-08.

### CG14 — Approval expiry does not always invalidate an existing item

CGMIX distinguishes Approved, Former-May Use, Former-May Not Use and Expired. Its Expired definition says items manufactured before expiration are considered approved.

Application: Store approval status and manufacture date together; avoid a simplistic expired=unsafe rule.

Limits: Current serviceability, intended use, size/fit and physical buoyancy untested; no product approved by this research.

[Primary source](https://cgmix.uscg.mil/Equipment/Definitions.aspx) — primary official definitions read; checked 2026-10-08.

### CG15 — UL country codes describe standards geography, not origin

UL says enhanced-mark country codes identify standards geography. File/unique IDs can be checked in Product iQ; Listed/Classified/enhanced variants have legitimate meanings.

Application: Record label claim and exact lookup scope; do not treat a US mark as Made in USA or a nonpreferred mark variant as forged.

Limits: Logo is not self-authenticating; component recognition and end-product scope still need verification; no exact product lookup made.

[Primary source](https://www.ul.com/thecodeauthority/knowledge/faq-enhanced-and-smart-ul-certification-mark) — primary official FAQ search excerpt; checked 2026-10-08.

### CG16 — UL Product iQ is an account-based research option

UL describes a complimentary Product iQ account for manufacturer certification/category records.

Application: Explicit user research action; confirm access/API terms before any engineering integration.

Limits: No account created, login, requests or certificate authentication performed. No keyless bulk API assumed.

[Primary source](https://code-authorities.ul.com/about/certifications/) — primary official description read; checked 2026-10-08.

### CG17 — ETL Listed and ETL Verified scopes differ

Intertek directories distinguish ETL Listed product safety scope from other verification directories, including cabling and specific modules.

Application: Select correct directory and compare complete model/category; keep multiple-listing brands and basic listee roles distinct.

Limits: No automated endpoint/CORS/quota/redistribution license or exact certificate tested; a directory miss is unresolved.

[Primary source](https://www.intertek.com/directories/) — primary provider description read; checked 2026-10-08.

### CG18 — Targeted inspection results include both failures and no-action samples

Health Canada's 2024–25 project tested 38 imported children's-jewelry products after market survey/XRF screening, reporting three recalls, two alerts and 33 no-corrective-action instances. Several China-origin rows report no compliance issue detected.

Application: Use exact adverse product rows; retain jurisdiction/method/sampling selection. XRF screening and confirmatory laboratory testing are distinct.

Limits: This is targeted selection, not population failure rate or proof all no-action products are safe forever. Country alone cannot reproduce the observed product distinctions.

[Primary source](https://www.canada.ca/en/health-canada/services/consumer-product-safety/reports-publications/industry-professionals/enforcement-summary-report/compliance-verification-project-2024-2025-children-jewellery-regulations.html) — opened; sampling method and selected result rows read; checked 2026-10-08.

### CG19 — Small XRF study is a physical-test lead

2023 DOI 10.1016/j.jhazmat.2023.132167 describes pXRF analysis of eight low-cost adult jewelry samples from Chinese e-commerce platforms.

Application: Physical-assay evidence design lead; source sample/package identity must connect a tested item to a retail item.

Limits: Tiny selected sample; platforms/factory identities and current batches not independently verified. Browser images cannot measure metal content or migration.

[Primary source](https://pubmed.ncbi.nlm.nih.gov/37619281/) — metadata and abstract opening read; full paper not reviewed; checked 2026-10-08.

### CG20 — Recent publication uses old targeted surveillance samples

Published 2026-08-15; paper describes 197 products collected during 2009–2022 NYC store investigations, mercury testing and an associated NYC Open Data source. Ingredients alone can omit measured mercury.

Application: Do not confuse publication date with current-product sample date. Ingredient parsing is claim analysis, not chemical clearance.

Limits: Targeted store/community selection; not present marketplace prevalence. Percentages/denominator details not reproduced because deeper methods retrieval failed.

[Primary source](https://www.nature.com/articles/s41370-026-00961-9) — abstract/metadata read; follow-up methods retrieval failed; checked 2026-10-08.

### CG21 — Online cosmetics assay study deserves deeper method review

2025 study 'Mercury in online skin-lightening cosmetics' reports XRF testing of 134 online-purchased products from seven Asian countries.

Application: Follow up sampled names, selection process, laboratory confirmation and product provenance before proposing category predictors.

Limits: Full abstract/methods not obtained; no numerical regional failure coefficient adopted, no paper replication.

[Primary source](https://pubmed.ncbi.nlm.nih.gov/40754048/) — primary abstract search excerpt; direct opening empty; checked 2026-10-08.

### CG22 — Official linked notices can contain conflicting dates and model exclusions

Original recall 25-395 is dated 2025-07-24. It lists EFMIS129/137/149/175 and serial boundaries, with EFMIS129-B/C excluded. Expansion 26-199 incorrectly or inconsistently refers to July 2024; seek agency clarification rather than invent chronology.

Application: Store original and expansion as one lineage with source-specific dates, plus explicit exclusion predicates. Source date conflict remains a flag in the research record.

Limits: No agency clarification sought, remedy performed or current retail unit matched. Source notices remain primary evidence of their own stated scope.

[Primary source](https://www.cpsc.gov/Recalls/2025/Curtis-International-Recalls-Frigidaire-brand-Minifridges-Due-to-Fire-and-Burn-Hazards-More-Than-700-000-Reported-in-Property-Damage) — opened; full model/serial table read; checked 2026-10-08.
