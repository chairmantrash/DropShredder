# Free/Public API Intelligence Baseline — 2026-10-06

## Decision
DropShredder may use free public APIs, free API keys/accounts, free tiers, and redistributable public datasets. Paid API/data dependencies remain excluded. No API secret is bundled into the public extension.

## Architecture
1. **Bundled local corpus** for redistributable safety/entity data where release-time compilation is permitted.
2. **Credential-free live lookup** for narrowly scoped, user-triggered enrichment where terms and rate limits permit.
3. **Optional free-key/build-time integration** where authentication is required. Keys must not be committed or embedded in the Chrome package.

Remote responses are data only. DropShredder never downloads or executes remote code.

## Vetted candidates
- **CPSC Recalls:** public REST data; highest-priority safety source. Exact UPC/GTIN/model matches should outrank text similarity.
- **SaferProducts.gov:** free application key; exposes public incident, manufacturer, product and retailer fields. Consumer incident reports must remain distinct from official regulator findings.
- **openFDA:** keyless access is available and a free key raises quotas. Candidate for product identity and regulator safety/enforcement evidence; bulk-data workflows should be preferred where appropriate.
- **SEC data.sec.gov:** public JSON APIs require no authentication/API key. Useful for public-company identity/former-name corroboration, not merchant-quality scoring.
- **GLEIF:** public LEI/entity relationship data. Useful for legal-entity resolution; fuzzy matches require corroboration.
- **Companies House:** API key/account required; documented default rate limit is 600 requests per five minutes. Useful for UK legal-entity resolution.
- **FTC API:** read-only JSON API; requires a free Data.gov key. Regulatory records must be entity-resolved before attribution.
- **UN Comtrade:** useful only as aggregate trade context. It cannot prove an individual product's factory or manufacture origin.

## False-positive controls
- Country/nationality has zero accusation/risk weight by itself.
- Warehouse/ship-from location is not manufacture origin.
- Legal registration is not evidence of quality or misconduct.
- Consumer incident reports are reports, not adjudicated defect findings.
- Fuzzy company/product matches never become high-confidence findings without corroboration.
- Aggregate import/export statistics never establish listing-level provenance.

## Chrome/MV3 constraints
Manifest V3 disallows remotely hosted executable code. API responses may be consumed strictly as data. Runtime host access should remain optional/narrow wherever practical. Any authenticated API needs a design that avoids shipping a reusable secret in the public extension.

## Primary sources
- https://www.cpsc.gov/Recalls/CPSC-Recalls-Application-Program-Interface-API-Information
- https://www.saferproducts.gov/FAQs/FrequentlyAskedQuestions11
- https://open.fda.gov/apis/authentication/
- https://www.sec.gov/search-filings/edgar-application-programming-interfaces
- https://www.gleif.org/en/lei-data/gleif-api/
- https://developer.company-information.service.gov.uk/get-started
- https://developer.company-information.service.gov.uk/developer-guidelines
- https://www.ftc.gov/developer
- https://developer.chrome.com/docs/extensions/develop/migrate

## Next implementation order
1. CPSC local recall compiler and exact identifier matcher.
2. Product-safety evidence type that keeps recalls separate from incident reports.
3. Origin semantic split: made-in / assembled-in / designed-in / ships-from.
4. SEC/GLEIF entity-resolution adapters with conservative corroboration.
5. Optional-key strategy for SaferProducts, FTC and Companies House.
6. Evaluate redistribution/licensing and update cadence before bundling any third-party corpus.
