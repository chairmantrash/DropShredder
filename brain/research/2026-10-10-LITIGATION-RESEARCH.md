# Litigation research — manufacturers, sellers and shippers

Researched 2026-10-10. DS-043. Original court records establish procedural facts; complaints establish allegations, not their truth. This audit is about source access and defensible case handling, not a legal clearance or an exhaustive search of any named merchant.

## Practical route

Start with the seller's disclosed exact legal entity, registration identifier/address and entity role. Discover likely cases with a quoted legal-name search, then confirm the named party and docket at its original court. Inspect the latest docket entry and disposition rather than a search snippet or the initial complaint. Record product/service relevance and subsequent appeal, dismissal, settlement or vacatur. A warehouse, platform, sister company, similarly named firm or carrier subcontractor does not identify a litigant.

There is no verified universal free pending-litigation database spanning all three countries. The simplest $0 implementation is a local reference directory plus bounded user-reviewed metadata imports. CourtListener search/alerts can help U.S. discovery; official court files remain the confirmation path. Account/API alert services are optional future integrations, not installed extension features.

| Source | Useful coverage | Access / limitations | Implemented treatment |
|---|---|---|---|
| CourtListener opinions + RECAP | U.S. opinions and contributed federal dockets/filings | Separate search collections; missing filings and uneven court coverage. API/alerts require authenticated access and have membership limits. | Discovery link only; no universal no-hit clearance |
| PACER / originating U.S. court | Federal case locator, parties, docket history and documents | Registered access may charge for searches including zero hits. $0.10/page, generally $3/document; search/report/transcript caps differ. Quarterly waiver applies at $30 or less; opinions free. | Manual original record, no automatic purchase or credentials |
| GovInfo USCOURTS | Free opinions from participating federal courts | Opinions do not establish the current pending docket or later appeal outcome. | Same U.S. court publisher family, scope and current status required |
| Canada Federal Court files | File number/party search and recorded case history | Federal jurisdiction only, not every provincial consumer dispute; recorded information can lag. | Manual exact-party metadata; provincial checks remain additional work |
| CanLII | Published Canadian decisions, decision/search RSS | Not a complete pending-case index. New-decision feed bounded to 20, search feed 100. Current terms direct automated/large retrieval to original/authorized channels. | Discovery link only; no bulk ingestion, feed completeness claim or restricted content copy |
| Mexico CJF/PJF and SCJN portals | Expediente/court and public-version decisions | Different court/matter forms; public versions can redact parties. Federal and state courts are separate. Some portal bodies could not be retrieved during this audit. | Manual official metadata; redacted/unmatched identity abstains |
| FTC / Competition Bureau | Official consumer and deceptive-marketing cases/actions | Agency enforcement is separate from private litigation; proposed orders, investigations and final dispositions differ. | Existing enforcement category, exact subject and outcome |
| PROFECO | Consumer complaint/reconciliation/provider research | Complaints are not necessarily lawsuits; restricted commercial reuse and incomplete/pending coverage. | Research link only, no rating import |
| FMCSA SAFER | Exact USDOT/MC/MX carrier identification and safety snapshots | FMCSA-registered carriers, including registered Canadian/Mexican carriers. Free snapshots; paid profiles separate. Safety rating/inspection/crash data is not a court judgment or delivery-quality rating. | Link only; current registration is not merchant trust |

## Data and judgment design

The standing module now has a litigation dimension and shipper role. Each imported court record requires source URL, docket (`recordId`), exact subject legal name and domain, court, jurisdiction, party role, category, event date, last-observed date, procedural outcome, explicit detail and scope. The user must check the original source and relationship to the inspected listing. Imported `verified`, rating or review flags have no authority. Metadata remains session-only and has no seller warning weight.

Relevant categories are consumer-sale, product-safety and shipping-service; `other` remains visible without affecting standing. Plaintiff records cannot be treated as wrongdoing. Relevant defendant/respondent pending or appealed cases provide MIXED/unresolved context. An explicitly reviewed final adverse judgment can supply an adverse standing record; it cannot create a severe product or seller accusation. Settled, dismissed, vacated and closed-without-adverse-finding records are neutral and do not certify good conduct. Settlements must not be described as admissions unless the source expressly establishes one.

Litigation observations expire after seven days. The last check must inspect the current docket, not merely repeat an old article. Later same-docket/court/jurisdiction outcomes supersede older snapshots within the same publisher family, including GovInfo mirrors. Equal-date contradictions stay mixed. Distinct cases remain separate. Unknown coverage, source failure, masked identity and no search hit cannot become favorable standing.

Docket numbers are jurisdiction-specific. Name normalization used for searching is a discovery aid, not a license to merge companies. Exact corporate/entity evidence and case-party review remain required. No addresses, private pleadings, victim identities or raw complaint texts are bundled. A current official source host is not cryptographic authentication of an imported user's summary.

## Maintenance configured

Owner requested regular refreshes. A weekly Monday-morning litigation research task and Tuesday-morning broader DropShredder intelligence sweep are enabled in America/Chicago. Their prompts require current workplane authority, exact identity, original status and source dates, stale downgrade, corrections, no paid purchases/restricted scraping and reviewable Git changes. They notify in ChatGPT, not email or Slack. These are scheduled research tasks; they do not add an extension background crawler, live API coverage, automatic case clearing or a published reference-feed update. Availability/failure must be reported on each run.

For watched active cases, seven days is the implemented maximum evidence age. More frequent authorized case-specific official alerts may later be useful; a weekly sweep cannot promise real-time notice. Invalidate rather than silently preserve stale adverse evidence. Source-reference summaries are dated; do not advance every individual company/case's date merely because its directory homepage was visited.

## Primary references and retrieval limits

- PACER pricing, page retrieved: https://pacer.uscourts.gov/pacer-pricing-how-fees-work
- Free opinions / participating-court limits, search result: https://pacer.uscourts.gov/find-case/court-opinions
- CourtListener alert APIs and membership limits, page retrieved: https://wiki.free.law/c/courtlistener/help/api/rest/v4/alerts
- RECAP fetch APIs, page retrieved: https://wiki.free.law/c/courtlistener/help/api/rest/v4/recap — fetch can purchase PACER content; not used.
- CourtListener coverage and separate collections, page retrieved: https://wiki.free.law/c/courtlistener/help/search/i-cant-find-something-when-i-search-courtlistener-help
- Canada Federal Court files, page retrieved: https://www.fct-cf.ca/en/court-files-and-decisions/court-files
- Federal Court search syntax, search result: https://www.fct-cf.ca/Content/assets/html/FC_Search_Syntax_EN.html
- CanLII RSS, search result only; open failed: https://www.canlii.org/rss
- CanLII revised terms, primary search result only; repeated open failed: https://www.canlii.org/info/terms.html
- CJF public decisions form, page retrieved, no completed company query: https://sise.cjf.gob.mx/consultasvp/default.aspx
- PJF expediente form, primary search result only; open failed: https://serviciosenlinea.pjf.cjf.gob.mx/juicioenlinea/juicioenlinea/Comunes/BusquedaExpediente
- SCJN judicial information, primary search result: https://www.scjn.gob.mx/transparencia/consulta-informacion/Informacion-jurisdiccional
- SCJN citizen portal, primary search result only; open failed: https://transparencia-ciudadana.scjn.gob.mx/Transparencia-Judicial-M
- FMCSA snapshot search, primary search result: https://safer.fmcsa.dot.gov/CompanySnapShot.aspx
- FMCSA source/update/coverage FAQ, page retrieved: https://safer.fmcsa.dot.gov/faq.aspx — daily snapshot data, weekly inspection/crash counts, current safety rating only.

No authenticated CourtListener/PACER API, court purchase, completed nationwide party search, CanLII bulk feed or Mexico dynamic-form result was tested. State/provincial coverage and terms need case-specific checks. Do not describe this directory as exhaustive litigation scanning.
