# Chrome Web Store release notes

## Single purpose
DropShredder helps consumers investigate whether online products are mass-resold/dropshipped or deceptively presented by analyzing product provenance, listing history, seller claims, fulfillment evidence and relevant merchant-risk signals.

## Short description
Local-first commerce forensics for spotting mass-resold products, misleading provenance, fake scarcity, review anomalies and risky fulfillment claims.

## Detailed description
DropShredder analyzes the product page you explicitly choose to inspect and builds an evidence report instead of guessing from superficial storefront traits.

Core capabilities include:
- product identifiers and technical fingerprints;
- local product/image history;
- supplier and marketplace source matching;
- fake-scarcity and price chronology;
- review anomaly/provenance checks;
- merchant/domain chronology;
- return-policy friction checks;
- explicit tracking/fulfillment contradiction checks;
- public reputation-search launchers;
- evidence-gated warnings that prefer UNKNOWN over unsupported accusations.

DropShredder is local-first:
- no account required;
- no telemetry;
- no mandatory hosted backend;
- no paid API dependency;
- browsing/investigation history remains local by default.

Tool/platform presence, manufacture country, Shopify/WooCommerce use, and ordinary third-party fulfillment are not treated as proof of wrongdoing.

## Permission justifications

### activeTab
Required to inspect only the page the user explicitly chooses to scan.

### scripting
Required to execute the local page extractor and render the optional on-page evidence stamp after a user action.

### storage
Required for local settings and local observation/history used by chronology and repeated-pattern detection.

### contextMenus
Required for explicit "Hunt product/image/store" investigation shortcuts.

### sidePanel
Required for the primary DropShredder evidence interface.

### optional host access
Requested at runtime only for features that need access to a public resource chosen by the user, such as a same-site return/refund policy or RDAP lookup. It is not permanent broad host access.

## Privacy disclosure
Privacy policy: use the public repository's `PRIVACY.md` URL in the Chrome Web Store developer dashboard.

## Data-use declaration
- No sale of user data.
- No advertising or behavioral profiling.
- No telemetry by default.
- No remote browsing-history upload.
- Page content is processed for the user-facing commerce-forensics feature.
- User-triggered external lookups may send the query required by that feature to the selected third-party public service.

## Release checklist
- CI typecheck passes.
- Forensic tests pass.
- MV3 build passes.
- Unpacked artifact packages successfully.
- Browser smoke test completed on representative Shopify, Etsy, Amazon and generic storefront pages.
- 16/32/48/128 raster icons included.
- Store icon and screenshots supplied.
- Privacy practices form matches `PRIVACY.md`.
- Single-purpose statement matches this document.
