# DropShredder

**Commerce forensics for shoppers. Don't guess. Build a case.**

DropShredder is a local-first Chrome/Chromium extension that helps consumers investigate:

- mass-resold and dropshipped products;
- commodity clones sold under multiple marketplace brands;
- misleading manufacture/origin/artisan claims;
- merchant/sister-store networks;
- review and reputation anomalies;
- fake scarcity and persistent reference-price tactics;
- fulfillment and return-policy contradictions;
- imported-product supply-chain transparency.

DropShredder separates evidence families instead of hiding everything behind one opaque “scam score.” It can say **UNKNOWN** when evidence is insufficient.

## Privacy model

The public extension:

- requires no DropShredder account;
- has no telemetry;
- has no mandatory backend;
- does not collect passwords, payment-card data, cookies, form values or browser history;
- refuses account/login/checkout/payment/billing/order-history surfaces;
- uses Chrome's site-specific host-access flow for user-triggered checks, without requiring the `tabs` or `activeTab` permission;
- offers opt-in, locally screened automatic product alerts on explicitly authorized HTTPS sites (no popups on general browsing/search/checkout);
- keeps observation history locally in IndexedDB;
- strips URL query strings/fragments before persistence;
- caps history at 180 days, 2,000 total records and 120 records per product identity;
- lets the user clear local history and revoke optional site access;
- supports off-by-default weekly updates only for previously authorized, signed subscriptions with user-pinned keys;
- keeps optional local label photos/OCR on device and never stores those photos;
- offers an optional single-query Brave Search action with a transient user-entered API key, never a required account or paid dependency.

See [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md).

## Current evidence systems

- Product identifiers and technical/specification fingerprints
- Exact/perceptual image fingerprints
- Bundled supplier/source registry
- Amazon clone/duplicate commodity clusters
- Commerce-platform signatures
- Merchant-network intelligence with freshness decay
- Domain/RDAP chronology
- Supply-chain origin profiles
- Fake-scarcity and price chronology
- Review-provenance/anomaly checks
- Optional public reputation checks
- Return/refund friction analysis
- Explicit tracking/fulfillment contradiction checks
- Etsy/Amazon marketplace-specific extraction
- Made in USA preference notices kept separate from wrongdoing scores
- User-previewed signed/unsigned reference lists with version floors, expiry, rollback and optional trusted weekly refresh
- Informational local manufacturer/importer/seller leads and lightweight lexical similarity (not neural embeddings)
- Local user-selected barcode/English OCR with packaged worker/WASM/data
- Neutral marketplace result-page links and optional explicit provider searches

Country, nationality, storefront platform, payment processor and ordinary third-party fulfillment are informational by themselves and do not count as misconduct.

## Tone modes

The public default is **Professional**. Users can select **Aggressive** or **Nuclear** wording. Tone never changes evidence weights, thresholds or verdicts.

## Build

Requirements:

- Node.js 22
- npm
- Chrome/Chromium 133+

```bash
npm ci
npm run typecheck
npm run audit:security
npm run audit:chrome-runtime
npm run audit:professional
npm run lint:data
npm test
npm run build
npm run release:audit
npm run audit:performance
npm run zip
```

The production Chrome artifact is generated in `.output/`.

## Release policy

A release is not considered publishable solely because it compiles. It must pass:

- TypeScript typecheck
- security audit
- registry/data lint
- regression suite
- Manifest V3 build
- generated-manifest/package audit
- performance budget audit
- CodeQL
- the browser smoke-test matrix in [RELEASE-TESTING.md](RELEASE-TESTING.md)

For beta testing instructions and bug-report expectations, see [BETA-TESTING.md](BETA-TESTING.md).

## Development architecture

The repository also contains a scoped project brain/workplane for maintaining provenance, research, authority and agent coordination without relying on giant persistent prompts.

Start there with [START-HERE.md](START-HERE.md).

## Internal diagnostics

A separate internal-only diagnostic build exists for development. It exports sanitized local diagnostic cases to help convert missed detections into new fixtures and rules. It is intentionally isolated from the public Store release and is not telemetry.

The optional OCR assets dominate unpacked size (about 45 MiB before license/code overhead); they are loaded only for a selected local photo. Exact package sizes/hashes are in `tools/browser-smoke/candidate-build-info.json`. No main merge or Chrome Web Store publication is authorized by engineering completion.

North American provenance utility: explicit manual reports separate eight product/sale stages within US/Canada/Mexico. A local source-reviewed dossier can document the exact chain; store/warehouse/label claims never grant independent certification. See [origin evidence and source map](NORTH-AMERICA-ORIGIN.md).

Business and litigation standing: separate user-reviewed, session-only entity records across seven categories, with 32 source references. BBB/accreditation, identity, restrictions, trade, supply-chain audits, product certification and lawsuits have different scopes. See [standing utility](BUSINESS-STANDING.md) and [litigation access audit](brain/research/2026-10-10-LITIGATION-RESEARCH.md).

Source refresh cadence, scope and correction rules: [intelligence maintenance](INTELLIGENCE-MAINTENANCE.md).
