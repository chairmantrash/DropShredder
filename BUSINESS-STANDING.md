# Merchant and manufacturer standing

DropShredder now has a separate, manual standing tool in the side panel. Scan the current product, expand **Merchant and manufacturer standing**, enter the exact legal entity name and its own website domain, choose merchant or manufacturer, and select a local evidence JSON file. Open the original sources and verify their subject, identifiers, current status, scope and relationship to this listing before checking the review box and choosing **ASSESS STANDING**.

The directory provides 32 reference sources across identity, consumer standing, enforcement, trade, sustainability, litigation and products. Opening/filtering it makes no network request. Following a source link opens the official destination, which has its own privacy/access terms. Some services require paid/member access; none is required by DropShredder. PROFECO and other restricted/unverified sources remain link-only and cannot be imported into the rating.

## Rating contract

This is a transparent categorical assessment of user-reviewed evidence, not a calibrated probability, regulator certification or a recreated bureau grade. It does not change the existing seller warning score. Each dimension remains separately visible, including unknown dimensions. Current/excluded record counts and distinct publisher families are coverage counts, not a percentage chance of honesty.

| Rating | Rule |
|---|---|
| Not reviewed | No deliberate source review; JSON `verified`, `reviewed` or `rating` flags have no authority |
| Insufficient | Missing exact binding, stale/insufficient evidence, or only identity/trade/sustainability/product context |
| Favorable evidence | Current BBB A/B-range grade plus active legal-entity evidence from another publisher; no unresolved or adverse accepted record |
| Mixed or unresolved | Contradictory equal-date records, an allegation/warning/unresolved complaint pattern, or favorable evidence alongside an adverse record |
| Adverse record | Reviewed final official order, active official restriction/finding, or BBB D/F-range grade, without the favorable combination |

These A/B and D/F groupings are explicit display-policy thresholds, not empirically validated risk probabilities. BBB C-range/NR alone remains insufficient. Accreditation is displayed in the preview when supplied and is not a prerequisite. No accreditation/no listing/no sanctions match never establishes either misconduct or clearance. Historical orders remain dated historical records; they do not assert continuing illegal behavior. Later resolved snapshots of the **same source and record** supersede earlier snapshots; separate cases remain separate. Equal-date contradictions require resolution.

Trade records never grant favorable standing, and standing never grants the entirely North American origin announcement. USMCA eligibility applies to particular goods/facts/transactions and can allow foreign inputs. BSCI grades, SMETA audits, EcoVadis ratings and product certificates describe different scopes. Affiliation, shared hosting, origin country and payment processor do not transfer trust or complaints between entities.

## Dossier schema

Maximum file size 40,000 bytes in the UI; parser maximum 40,000 characters; maximum 32 records. Keep records concise and public, excluding personal information, credentials and customer case narratives. Public HTTPS sources must have no query, fragment, credentials, explicit port or local/IP destination. Source host, dimension and outcome must match the packaged source registry. This checks structure/source scope; it does **not** authenticate document contents.

```json
{
  "version": 1,
  "target": {
    "legalName": "Example Maker LLC",
    "domain": "maker.example.com",
    "role": "manufacturer",
    "listingUrl": "https://shop.example.com/product/1"
  },
  "records": [
    {
      "sourceId": "bbb",
      "sourceUrl": "https://www.bbb.org/profile/example-placeholder",
      "recordId": "example-placeholder",
      "subjectName": "Example Maker LLC",
      "subjectDomain": "maker.example.com",
      "dimension": "consumer",
      "outcome": "no-record",
      "observedAt": "2026-10-10",
      "eventDate": "2026-10-10",
      "scope": "Illustrative schema only",
      "detail": "Placeholder, not a real bureau observation."
    }
  ]
}
```

Optional consumer fields: `grade` (the bureau’s original label), `accredited` (boolean). `observedAt` is the day the current original record was inspected; `eventDate` is the underlying event/date applicable to that record, not a fabricated current event. Both are strict ISO calendar dates; event dates cannot exceed inspection dates, and future inspections are refused. Freshness is seven days for CBP/OFAC restrictions, thirty for most conduct sources, ninety for legal identity. It is DropShredder’s recheck policy, not the source’s own validity term. The research directory shows when references need review.

The name/domain in **every** accepted record must exactly match the target (name case/Unicode composition is normalized, punctuation retained). Target role and sanitized listing URL must match the current inputs and listing. Source `recordId` should be the original profile/case/certificate identifier; repeat copies do not add coverage. An entered name/domain and checked box are user assertions, not independent verification of ownership. Marketplace seller, retail brand, importer and manufacturer may be different entities: research each separately and confirm its link to the product.

Files/results remain in panel memory, clear on new scans/navigation/site-access changes and are not saved to history, sent to a server or added to report exports. Keep the original evidence file separately if needed. This first implementation does not provide a live bureau feed or automatically rate every merchant. Independent source authenticity, legal-copy/native-speaker review, representative merchant/category calibration and broad release acceptance remain open.

Research: `brain/research/2026-10-10-RESEARCH-REFRESH-AND-STANDING.md`. Source categories/outcome vocabulary: `intelligence/standing-sources-20261010.json`.

## Litigation and shippers

Entity role also accepts `shipper`. A litigation record must include its docket in `recordId`, court, jurisdiction, party role and category:

```json
"case": {
  "court": "Exact original court name",
  "jurisdiction": "US-NY federal",
  "partyRole": "defendant",
  "category": "consumer-sale"
}
```

Roles: `defendant`, `respondent`, `plaintiff`. Categories: `consumer-sale`, `product-safety`, `shipping-service`, `other`. Outcomes: `pending`, `appealed`, `dismissed`, `settled`, `final-adverse-judgment`, `vacated`, `closed-no-adverse-finding`. Settlements do not imply admissions. A final judgment label requires the reviewed original court disposition against this exact party; a complaint, procedural order or motion is insufficient. Pending/appealed relevant defendant/respondent cases produce unresolved context; only an explicitly reviewed final adverse judgment can yield an adverse standing record. Plaintiff and unrelated cases never drive these labels. No litigation record changes the main seller warning verdict.

All litigation observations expire after seven days. Later observations supersede the same docket, original court and jurisdiction within its publisher family, including GovInfo mirrors; unrelated cases remain separate. Store the last docket check in `observedAt` and disposition date in `eventDate`, not merely the first filing date. Newer appeal/vacatur/dismissal snapshots replace older judgments. Equal-date conflicting snapshots remain mixed.

CourtListener and CanLII are discovery links only. The extension does not query courts, purchase PACER records, upload browsing history, send alerts, or claim exhaustive monitoring. Weekly scheduled research is a separate maintenance task, not a background extension crawler. See [litigation research and coverage](brain/research/2026-10-10-LITIGATION-RESEARCH.md).
