# Additional storefronts: concealed sourcing and evidence gaps

Research date: 2026-10-08. Task: DS-STOREFRONTS-20261008. Branch: research/20261008-defensive-intelligence. Status: COMPLETE — research catalogue, not product/browser validation.

## Outcome and scope

34 findings cover eight storefronts or platform families, four existing buyer/supplier-detection tools, five academic papers or access-limited leads, and six complaint/self-report leads. The machine-readable companion is `intelligence/additional-storefronts-20261008.json`. It records 43 source-presence observations, including repeat retrievals at different depths; these are not 43 independent studies.

This supplements the existing tools, furniture/pets, manufacturer-networks and retail-category batches. It does not establish marketplace prevalence, physical quality, current seller wrongdoing or a regional quality coefficient. No extension installation, live product verdict, order placement, account creation or integration execution occurred. PR #9 remains outside this research task.

The most useful new gaps are platform-specific exceptions, unstable source seller identity, inadequate original-design/production disclosure, stock-photo reuse, category mislabeling/relisting, and privacy differences between local storage and cloud AI. These are evidence collection and evaluation opportunities, not ready-made risk-score inputs.

## Platform comparison

| Platform / scope | What the reviewed source permits or prohibits | Product-level evidence needed | Findings |
|---|---|---|---|
| Etsy | Limited supplies/vintage and original-design or buyer-personalized production exceptions. Unchanged commercial items do not become eligible merely through a card. Partners require disclosure and accurate shipping information. | Exact category, maker/design/customization claim, public partner description, dated source/model matches. | SF01–02, SF09–11 |
| eBay | Wholesale-supplier fulfillment allowed; post-sale buying from a retailer for direct customer delivery prohibited. | Transaction timing and sourcing relationship; branded packaging or markup alone is insufficient. | SF03, SF19, SF21 |
| TikTok Shop / US | Third-party fulfillment with inventory ownership allowed; direct retailer-to-customer purchases and positive-review incentives prohibited in the reviewed packaging policy. | Exact jurisdiction, ownership/fulfillment evidence, independently evidenced insert or shipment claim. | SF04, SF32 |
| Wayfair | Supplier guide describes dropshipping as normal fulfillment; supplier identifiers, accurate materials/dimensions and compliance evidence matter. | Supplier part/MPN, variant, material, dimensions, manufacturer/importer roles, matched total offer. | SF05–07, SF20 |
| Temu / EU | Commission announced May 2026 DSA enforcement over systemic-risk assessment. | Product/model-specific regulator or laboratory facts; platform enforcement does not authenticate or condemn each product. | SF08 |
| AliExpress / EU | July 2026 enforcement and separate June 2025 commitments concern systemic risk, relisting/category controls, traceability and hidden links. | Dated displayed versus promoted item, stable identifiers, seller lineage, exact violation evidence. | SF12–13 |
| Depop | Catalogue bought-to-order dropshipping prohibited; seller-designed handcrafted/POD exception requires original photos and disclosures. | Original-design claim, photograph provenance, partner location and timeframe; actual supplier relationship if alleging a violation. | SF30 |
| Mercari / US | Reviewed conduct rules prohibit third-party/manufacturer-direct shipping, stock/unowned photos and false category/brand fields; automated extraction is restricted. | US policy scope, item possession/shipping claim, photograph ownership and exact item identity. | SF31 |

Policies were observed on the research date. Several pages have older displayed updates; observation date is not publication date. Mercari Japan's separately recorded policy cannot be silently applied to US listings. TikTok fulfillment options and eligibility vary by market and service. Actual enforcement rates and current merchant behavior were not measured.

## Counter-research of seller tutorials and enablement

Printify's help documents a concrete disclosure-default gap: absent an existing Printify partner, a published Etsy listing can default to “Made by seller” and needs a manual correction. This establishes a documented integration default, not deliberate evasion by any particular seller. The provider's Wilmington business address also cannot identify the physical printing plant. A generic public partner descriptor may be permitted; absence of the full legal partner name is not itself concealment. [SF09]

AutoDS advertises retail-source importing/AI copy in its Etsy offering, while its help describes source SKUs/custom labels and changing Amazon Buy Box offers. Preserve raw identifiers and timestamped source sold-by fields rather than relying on rewritten titles. Custom labels are not necessarily publicly visible. Its Helper and eBay MIP extension are distinct products; no undetectability or fingerprint accuracy was established. [SF10, SF14, SF16]

CJ's guide supplies an important control: original-design fulfillment with a disclosed production partner can be a legitimate workflow. Vendor instructions do not override the marketplace's rules. A self-described eBay retail-arbitrage forum post was retained separately as an unverified sourcing-pattern lead, not proof of efficacy or merchant prevalence. [SF15, SF21]

The Commission's AliExpress commitments identify a different problem: hidden links can separate the displayed listing from the item promoted elsewhere. Preserve those as separate claims. Its later decision adds relisting/category-misclassification failure modes. Same-item lineage and an independently inferred category may help defensively, but broad marketplace crawling and any eligibility-gated research API require their own access assessment. [SF12–13]

No evasion procedure was executed, seller account contacted, private group entered, or purchase made. The archive records source presence and paraphrases, not a complete snapshot of every tutorial.

## Complaint themes and limits

These are dated first-person allegations used to define investigations. They are not verified incidents or a representative “common complaint” frequency study.

| Theme | Evidence lead | What would resolve it |
|---|---|---|
| Claimed handmade item resembles a cheap marketplace item | Etsy earrings complaint, February 2021. [SF17] | Exact claim plus independently corroborated identity/design/production facts; visual similarity alone leaves copied photos or licensed sourcing unresolved. |
| Missing parcel and conflicting delivery dates | Etsy complaint, June 2024. [SF18] | Carrier and time-zone-normalized records provided voluntarily, with address/order details redacted. |
| eBay order arrives from Amazon | November 2025 buyer allegation. [SF19] | Retail post-sale purchase/fulfillment evidence; packaging alone does not establish that sequence. |
| Furniture sold under different names | October 2024 Wayfair discussion. [SF20] | Same variant, dimensions, materials, MPN and complete price/shipping terms. |
| Retail-postsale arbitrage claimed by a seller | March 2026 eBay forum post. [SF21] | Independent transaction evidence; advertising a tactic does not demonstrate its use or success. |
| Authentic items allegedly mislabeled counterfeit | August 2026 TikTok seller complaint. [SF32] | Authenticity evidence and appeal outcome; enforcement and positive reviews alone are both inadequate. |

The complaint search did not yield a buyer complaint series for TikTok or representative frequency data for any platform. Etsy's transparency report is company-reported moderation evidence; the retrieved PDF excerpt was not downloaded/rendered. Changes in removals cannot establish the remaining prevalence of disguised reselling. [SF11]

## Tools that already address parts of the problem

| Tool | Claimed useful capability | Adoption limit |
|---|---|---|
| Etsy Guardian — buyer extension | Composite trust signals, reverse-image help and price history. | ID `ombbkjlaapmdcipgieobdpkoepdicdno`; distinct from same-name seller IP tool. No accuracy, privacy or performance execution. [SF22] |
| Product Sniffer | User-triggered image search, domain filters, parameter stripping. | External search may still receive a URL/query. No code or traffic audit; image results are candidates. [SF24] |
| CopyRadar | Cross-platform image clusters/manual copy review. | Copies can include an owner's other shop or licensed image. Cost/license/privacy unknown. [SF25] |
| Apify Who Makes It actor | Hosted Etsy supplier/factory search. | Supplier direction/factory attribution not validated; execution cost, privacy/access and license not checked. Not a proven free-core dependency. [SF26] |

Etsy Guardian's privacy policy describes both local data and server-mediated AI requests containing listing/review/photo information. A local-storage claim does not answer whether a feature sends data elsewhere. This is a documentation distinction, not an observed privacy breach. Feature-level consent and actual network behavior remain untested. [SF23]

The most transferable low-cost ideas are explicit reverse-image handoffs, exact identifier extraction, readable evidence cards and optional local price observations. Neither a competitor score nor an upstream “manufacturer finder” should become authoritative evidence without validation.

## Academic methods and transfer limits

| Paper / review depth | Useful question for DropShredder | Boundary |
|---|---|---|
| CDANet, Scientific Reports, 2025; introduction plus primary dataset/availability excerpts. [SF27] | Can glyph/pinyin/semantic representations retrieve confusable brand text? | JD-derived simulated character changes; code/data on request; not physical counterfeit or regional quality ground truth. |
| Smartphone garment authentication, arXiv 2024; full HTML methods/results. [SF28] | Can a system abstain on ambiguous evidence? | One brand, physical emblem photos, cloud computation, non-commercial materials on request. Item/batch independence not established. |
| Secondhand pricing, BJS, online 2024 / issue 2025; publisher methods/pricing read. [SF29] | Which legitimate resale characteristics must be negative controls? | Qualitative US research, not fraud prevalence; historical observations must not become current platform-authentication claims. |
| Review-buyer graph detection, PNAS 2022 / arXiv 2024; primary data/network methods. [SF33] | Do shared-reviewer structures add evidence beyond fluent text? | Old Amazon observations, broad network access needed, imperfect unobserved controls; product label is not proof that each review is fake. |
| Fake-review survey, indexed arXiv 2026 abstract only. [SF34] | How should missing-source robustness, uncertainty and cross-domain transfer be tested? | Direct primary page unavailable; mirrors rejected as independent evidence; full studies/rankings not audited. |

A browser sees selected visible content, not the platform's full review or transaction graph. A private platform-scale model cannot be assumed to run accurately from a single listing. No paper reproduced, dataset downloaded, model trained, API integrated or commercial license cleared.

## Concrete detection gaps for continuation agents

These are research/evaluation candidates. Runtime risk weights remain zero.

| Candidate | Proposed fields or workflow | Essential negative/ambiguity control |
|---|---|---|
| Platform-specific policy model | Platform, jurisdiction, policy URL, observed date, category, exception and claim type. | Allowed vintage, supplies, original design, wholesale or inventory-owned fulfillment. |
| Original-design disclosure | Raw maker/designer phrase, partner descriptor, ship-from claim, factory claim separately. | Generic permitted partner title; integration defaults do not prove intent. |
| Stable cross-platform identity | Typed MPN/GTIN/ASIN/source SKU, raw image family, dimensions/material/variant. | Private labels, copied photos and shared model prefixes do not establish factory identity. |
| Supplier lineage | Legal name/role, dated relation, source, historical alias, confidence/corroboration family. | Importer, retailer, parent, partner and factory remain separate. |
| Dynamic offers | Observed timestamp, sold-by, fulfilled-by, landed total, currency and variant. | Buy Box changes, coupons, bundles and regional shipping differences. |
| Category mislabeling/relisting | Raw seller category, independently described product type, dated listing/seller IDs. | Legitimate relisting/variant changes; no punishment by association. |
| Hidden-link mismatch | User-requested displayed item and external promoted claim as separate evidence. | Do not follow checkout/private URLs or infer final contents without evidence. |
| Image search | Explicit handoff and candidate comparison, source/date/variant. | Earliest crawled image is not necessarily the original maker. |
| Review concerns | Distinguish text anomaly, coordination candidate and directly evidenced purchase. | Fluent language, grammar, new account or positive sentiment cannot prove falsity. |
| Privacy and tool access | Feature-level egress/consent, terms, cost, license, retention and account requirement. | Local storage does not mean local AI; public data can still reveal browsing interests. |

Suggested evaluation cases: disclosed POD on Etsy; Printify default with no proven intent; legitimate eBay wholesaler; Amazon-box delivery with unknown transaction timing; inventory-owned TikTok 3PL; ordinary Wayfair dropshipping; renamed furniture variants; permitted Depop designer item with original photos; Depop supplier-photo candidate; Mercari US versus Japan scope; original photo copied upstream; changing Buy Box; unknown factory; title rewritten with exact model retained; repeated regulatory source mirrored elsewhere; review cluster without direct ground truth; unsupported photo classifier brand; optional tool cloud egress; safety notice matched to an excluded serial; insufficient evidence resulting in abstention.

These are proposed cases, not tests reported as performed. Apply the repository's existing independent-evidence gate before any severe-deception message. Keep safety events separate from alleged seller deception, and exact manufacturing origin separate from importer addresses and fulfillment locations.

## Preservation and verification

Findings were checkpointed as research progressed, then stored in the brain report, structured intelligence, task receipt and integrity run. Source URLs, retrieval depth and limitations are retained for other agents. Full copyrighted pages/PDFs and source screenshots were not republished. Duplicate retrievals or Commission mirrors must not inflate evidence independence.

Integrity checks cover unique IDs, source-presence linkage, required limits/depth, eight platform scopes, four tool comparisons, five academic records and zero runtime weights. They do not validate Chrome behavior, physical products, hidden transactions, marketplace crawling permission, model performance, lab safety or region-based calibration.

## Source index

The following URLs are the actual retrieved/indexed public sources. Each row's limits are authoritative in the JSON catalogue; “search excerpt” is not full-page review.

- **SF01 — Exceptions belong in the policy model:** [source](https://help.etsy.com/hc/en-us/articles/23948763872151-Does-Etsy-Allow-Drop-Shipping-or-Reselling) (primary platform search excerpt).
- **SF02 — Production-partner disclosure is broader than a supplier brand name:** [source](https://help.etsy.com/hc/en-us/articles/360000336547-Working-with-Production-Partners-on-Etsy?segment=selling) (primary platform search excerpt).
- **SF03 — Wholesale fulfillment and retail-to-customer purchase differ:** [source](https://www.ebay.com/help/selling/listings/dropshipping?id=4176) (primary platform search excerpt).
- **SF04 — Third-party fulfillment has inventory and packaging conditions:** [source](https://seller-us.tiktok.com/university/essay?knowledge_id=7131013343053575) (primary platform search excerpt); [source](https://seller-us.tiktok.com/university/essay?knowledge_id=7131013343053575) (primary policy opened; September 3, 2026 date displayed).
- **SF05 — Dropshipping is a normal fulfillment model:** [source](https://sell.wayfair.com/start-beginners-guide) (primary platform search excerpt).
- **SF06 — Supplier requirements reveal good matching fields:** [source](https://sell.wayfair.com/onboarding-checklist) (primary platform search excerpt).
- **SF07 — Plain packaging and documented testing are platform requirements:** [source](https://sell.wayfair.com/wayfair-supplier-code-of-conduct) (primary platform search excerpt).
- **SF08 — Current regulator finding goes beyond a preliminary allegation:** [source](https://digital-strategy.ec.europa.eu/en/news/commission-fines-temu-eu200-million-breaching-digital-services-act) (primary regulator search excerpt).
- **SF09 — An integration default can mislabel seller role:** [source](https://help.printify.com/hc/en-us/articles/4578896595345-What-should-I-know-about-Etsy-s-Creative-Standards-policy) (primary provider help excerpt); [source](https://help.printify.com/hc/en-us/articles/4578896595345-What-should-I-know-about-Etsy-s-Creative-Standards-policy) (primary vendor help opened; default and disclosure steps read).
- **SF10 — Commercial import/automation claims exceed a policy guarantee:** [source](https://www.autods.com/etsy/) (primary provider page excerpt).
- **SF11 — Enforcement totals do not measure residual violative inventory:** [source](https://investors.etsy.com/_assets/_de5e340f38f38bb809a618effecc65e6/etsy/db/1016/10091/pdf/2025_Transparency_Report_Digital.pdf) (primary PDF search excerpt; full PDF not reviewed).
- **SF12 — Final enforcement and relisting failure modes:** [source](https://cyprus.representation.ec.europa.eu/news/commission-fines-aliexpress-eur550-million-breaching-digital-services-act-2026-07-20_en?prefLang=pt) (primary European Commission search excerpt); [source](https://digital-strategy.ec.europa.eu/en/news/commission-fines-aliexpress-eu550-million-breaching-digital-services-act) (canonical primary Commission search excerpt; direct open returned 429).
- **SF13 — Hidden links and researcher-access eligibility:** [source](https://digital-strategy.ec.europa.eu/en/news/commission-makes-aliexpress-commitments-under-digital-services-act-binding) (primary Commission search excerpt).
- **SF14 — Source identifiers survive rewritten listing copy:** [source](https://help.autods.com/en/articles/12700438-product-uploads-supported-suppliers-import-to-store-and-manage-variants) (primary seller-tool help search excerpt).
- **SF15 — A compliant production-partner tutorial is a necessary control:** [source](https://www.cjdropshipping.com/blogs/selling-strategies/Etsy-Dropshipping) (primary supplier tutorial search excerpt).
- **SF16 — Seller extensions must not be conflated:** [source](https://help.autods.com/en/articles/12700457-autods-helper-chrome-extension-one-click-product-importer-and-buyer-address-copier) (primary seller-tool help search excerpt).
- **SF17 — Buyer allegation: quality disappointment and image match:** [source](https://www.reddit.com/r/Etsy/comments/leglyk) (dated first-person forum search excerpt).
- **SF18 — Buyer allegation: inconsistent delivery dates:** [source](https://www.reddit.com/r/Etsy/comments/1dkj0ph) (dated first-person forum search excerpt).
- **SF19 — Buyer allegation: Amazon fulfillment:** [source](https://www.reddit.com/r/ebaysucks/comments/1oyqkta/ebay_is_slowly_becoming_chock_full_of_amazon/) (dated first-person forum search excerpt).
- **SF20 — Buyer discussion: renamed matching furniture:** [source](https://slickdeals.net/f/17797551-60-trent-austin-design-nguyen-2-door-tv-stand-135-more-free-shipping) (dated community discussion search excerpt).
- **SF21 — Self-described retail arbitrage is an investigation lead:** [source](https://www.reddit.com/r/dropship/comments/1s4yh9h/how_ebay_actually_pays_my_bills/) (dated self-described seller forum search excerpt).
- **SF22 — Buyer detection tool: Etsy Guardian:** [source](https://chromewebstore.google.com/detail/etsy-guardian-dropshippin/ombbkjlaapmdcipgieobdpkoepdicdno) (primary store listing opened); [source](https://etsyguardian.com/) (primary product site opened); [source](https://chromewebstore.google.com/detail/etsy-guardian-ip-protecti/ellbahipgkafoehplhphdjgnpodppnpg) (primary store search excerpt; distinct seller IP-protection product).
- **SF23 — Etsy Guardian's local-storage and AI-egress claims differ:** [source](https://etsyguardian.com/privacy/) (primary privacy policy opened; dated August 5, 2026).
- **SF24 — Product Sniffer reverse-image shortcuts:** [source](https://chromewebstore.google.com/detail/product-sniffer/bdiiamoehaiomgidplbgnpbdpjehmkjc) (primary store listing opened).
- **SF25 — CopyRadar cross-platform visual triage:** [source](https://etsy.getstat.app/) (primary provider search excerpt).
- **SF26 — Hosted supplier-finder actor:** [source](https://apify.com/yumitori/etsy-manufacturer-finder) (primary actor publisher search excerpt).
- **SF27 — Chinese counterfeit-text model is not product authentication:** [source](https://www.nature.com/articles/s41598-025-29693-w) (primary article introduction opened; dataset-method primary search excerpt); [source](https://www.nature.com/articles/s41598-025-29693-w) (primary search excerpt including dataset generation, limitations and code/data availability).
- **SF28 — Physical garment photos and abstention:** [source](https://arxiv.org/abs/2410.05969) (primary abstract and metadata opened); [source](https://arxiv.org/html/2410.05969v2) (primary full HTML methods/results read).
- **SF29 — Resale prices include symbolic value:** [source](https://pmc.ncbi.nlm.nih.gov/articles/PMC11890435/) (primary paper search excerpt; full page blocked by CAPTCHA); [source](https://onlinelibrary.wiley.com/doi/10.1111/1468-4446.13168) (primary publisher methods and pricing discussion read).
- **SF30 — Original-design exception still requires original photos:** [source](https://depophelp.zendesk.com/hc/en-gb/articles/22499808769553-Dropshipping-Policy) (primary full policy opened).
- **SF31 — Rules need market-specific scope:** [source](https://www.mercari.com/us/help_center/topics/listing/policies/prohibited-conduct/) (primary full US policy opened); [source](https://help.jp.mercari.com/guide/articles/866/) (primary Japan help search excerpt; Japanese text read).
- **SF32 — Seller allegation of false counterfeit enforcement:** [source](https://www.reddit.com/r/TikTokshop/comments/1vdad6w/counterfeit_goods/) (dated first-person seller forum search excerpt).
- **SF33 — Graph evidence targets products buying reviews:** [source](https://arxiv.org/html/2410.17507v1) (primary HTML data/network methods read; metadata confirms PNAS 2022).
- **SF34 — Recent survey retained as an access-limited lead:** [source](https://arxiv.org/abs/2609.30292) (primary indexed abstract excerpt; direct open DisabledError).
