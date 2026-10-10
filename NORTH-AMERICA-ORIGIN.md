# North American product origin

DropShredder's manual report distinguishes **UNKNOWN**, **CLAIMED**, **PARTIAL**, **DOCUMENTED**, **OUTSIDE_REGION** and **CONFLICTING**. Its region is explicitly **United States / Canada / Mexico**, not every country in the geographic continent. Geography never changes seller-warning scores.

The positive announcement is **North American chain documented**, meaning the shopper reviewed source documents for this exact product, seller and sale. It is not an independent certification, automatic factory audit, legal-origin ruling or quality guarantee. No bundled product or retailer is granted an all-local badge.

## Eight separate stages

| Stage | Required scope-complete source type | Cannot substitute for it |
|---|---|---|
| materials | Bill of materials or audit covering all raw materials | Flag, branding, headquarters, barcode prefix |
| components | Bill of materials or audit covering all parts/ingredients | Final assembly location |
| processing | Manufacturing record or audit covering all processing | Designed in Canada/US/Mexico |
| assembly | Manufacturing record or audit covering final assembly | Shipping address |
| packaging | Bill of materials or audit covering packaging | Food-origin label that excludes packaging |
| seller | Legal entity record or audit for the seller of record | Marketplace owner's headquarters |
| dispatch | Actual carrier pickup or audit of first physical dispatch | Domestic label creation or last-mile carrier |
| destination | Delivery record or audit of the particular sale destination | Store offers shipping to a country |

A document's label/type is supplied by its author; DropShredder cannot authenticate it from JSON. Open each source and assess its authenticity, exact product scope and completeness. `complete` must not be used for a partial BOM, broad brand promise or mere screenshot of a logo. An inapplicable stage needs a reasoned scope-complete audit, not omission. Upstream manufacture of factory machinery, corporate shareholders, bank nationality and every possible transit country are outside this eight-stage definition. The utility is not a guarantee that the product, its tooling or its route has never touched any other country.

## Using the panel

1. Run **CHECK THIS PRODUCT**. A source must match the exact listing path, explicit seller, valid GTIN or exact brand/model, selected variant and all extracted specifications. If extraction cannot resolve those fields, the utility abstains.
2. Expand **Made, sold and shipped in North America**, choose a local evidence JSON file and open the displayed source links. No file is uploaded; no source request runs until you open a link.
3. Review the documents, select the review checkbox, then apply. A mismatch, missing stage, unsupported source type, expired document or conflicting evidence cannot produce the positive announcement.
4. Expand report origin details to inspect all stages and original source claims. **EXPORT CURRENT SCAN** includes the bounded assessment and safe source links, alongside its review limitation.
5. Clear origin evidence to remove the session file/review state. Navigation also clears it. Applied evidence updates the current report; it does not rewrite earlier observations or automatically save the dossier. Ordinary scan history stores its initial claim-only origin assessment.

## Evidence JSON version 1

The local file limit is **50,000 bytes** (input is also bounded to 50,000 characters), **64 documents**, **40 specification fields**, **1,000 characters per detail**. Source and listing URLs must be public HTTPS without credentials, ports, queries or fragments. No registry/downloaded publisher field can set reviewed status. All review happens in the panel.

Each observation must be in the past, at most **180 days old**, unexpired, and have a validity interval of at most **180 days**. These are conservative product-evidence limits, not legal validity periods. Country codes are uppercase two-letter codes; only `US`, `CA` and `MX` count as inside the region. The file is only applicable to its exact product/seller/listing. Brand/model punctuation is retained; GTIN check digits are validated. Every known specification must be present and equal in both directions. Unknown variants cannot be replaced with guessed identifiers.

```json
{
  "schemaVersion": 1,
  "listingUrl": "https://shop.example.com/product/123",
  "seller": "Seller LLC",
  "identity": {
    "brand": "Acme",
    "mpn": "K-123",
    "variantId": "red",
    "specifications": {"color": "red"}
  },
  "documents": [
    {
      "stage": "materials",
      "countries": ["CA"],
      "coverage": "partial",
      "kind": "bill-of-materials",
      "sourceUrl": "https://records.example.com/materials",
      "observedAt": "2026-10-09T00:00:00Z",
      "expiresAt": "2026-12-09T00:00:00Z",
      "detail": "ILLUSTRATIVE ONLY: this is not a real source or a complete product dossier."
    }
  ]
}
```

Optional `identity.gtin` is a valid GTIN. If absent, both `brand` and `mpn` are required. Use `variantId: ""` only when the actual scanned product has no variant identifier; do not erase a known variant. Add one or more scope-complete, actually reviewed documents for each of the eight stages to support a documented result. Multiple countries may describe regional processing. A source explicitly disclosing nonregional materials or components, even with partial coverage, defeats an all-regional finding. Conflicting complete records are shown separately from a single mixed-origin record. `claim`, `label` and `trade-certificate` are accepted as references but never qualify as full-stage documentation.

## Sourcing map

The separate panel directory contains dated authority, supplier, platform, directory and manufacturer leads. Names identify primary sources and provider disclosures; no official endorsement, seller misconduct, all-SKU domestic manufacture, live stock, product quality or commercial reuse rights are inferred. References age out visibly after 90 days and require renewed source checks. Updating a packaged reference requires a reviewed project update; this adds no scheduled crawler or data feed.

See [regional research](brain/research/2026-10-10-NORTH-AMERICA-COMMERCE.md) and the machine-readable [map](intelligence/north-america-commerce-20261010.json). Manufacturer leads are good starting points for asking for a complete BOM, production route, authorized retailer identity and first-dispatch evidence, rather than relying on branding or local inventory.
