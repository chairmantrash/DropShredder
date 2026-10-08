# Chrome Web Store release notes

## Single purpose

DropShredder helps shoppers investigate whether online products are mass-resold/dropshipped, deceptively presented, associated with relevant merchant-risk patterns, or part of a commodity clone network. It offers optional automatic quick checks on real product listings, followed by a user-click full evidence report. Automatic checks require explicit Chrome HTTPS site-access consent.

## Short description

Local-first commerce forensics for product provenance, clone listings, merchant transparency, review anomalies and fulfillment claims.

## Core capabilities

- product identifiers and technical/specification fingerprints;
- local product/image chronology;
- bundled supplier and marketplace source registry;
- Amazon commodity clone clustering;
- known merchant/sister-store network intelligence with freshness controls;
- commerce-platform detection;
- fake-scarcity and price-history contradictions;
- review-provenance checks;
- optional public reputation checks;
- domain-age chronology;
- return-policy friction checks;
- explicit tracking/fulfillment contradiction checks;
- supply-chain origin profile;
- optional Made in USA preference notice;
- image fingerprinting and user-triggered reverse-image/source searches;
- evidence-gated warnings that prefer UNKNOWN over unsupported severe accusations.

Platform choice, country, nationality, payment processor, CDN/provider, or ordinary third-party fulfillment never establish wrongdoing by themselves.

## Privacy and security summary

DropShredder is local-first:
- no DropShredder account required;
- no telemetry;
- no ads or behavioral profiling;
- no mandatory backend;
- no paid API dependency;
- no remote browsing-history upload;
- no remotely hosted executable code;
- no cookie/history/debugger/webRequest/native-messaging permissions;
- no password, payment-card, authentication-token or form-field collection.

The scanner refuses known account, login, checkout, payment, billing, address-book and order-history pages. It also refuses any page where credential or payment-card fields are detected.

Local observations:
- remove URL query strings and fragments before persistence;
- are limited to 180 days;
- are limited to 2,000 observations globally;
- are limited to 120 observations for one product identity;
- can be erased from the side panel at any time.

Optional site permissions can also be revoked from the side panel.

## Performance model

There is no continuous crawling, timer-based page sampling, or always-on background forensic worker. One lightweight DOM/structured-data gate runs on explicitly permitted sites when the automatic-alert option is enabled; ordinary browsing receives no toast.

With automatic alerts enabled by the user, a small classifier runs only on permitted HTTPS documents, abstains on non-product or sensitive pages, and performs a bounded local quick scan only on qualifying product listings. No passive third-party lookups occur; the full forensic and public-source check remains user-triggered. Work is bounded:
- page text capped at 100,000 characters in full scan;
- product/catalog/review/DOM collections capped;
- same-site policy/about/contact enrichment limited to four pages and run concurrently;
- public reputation/RDAP checks cached and time-bounded;
- image fingerprinting is explicit, HTTPS-only, size-limited, and downsampled before perceptual hashing;
- source-hunt searches are grouped and tab fan-out is capped;
- local IndexedDB reads use bounded indexes/cursors rather than full-database loads.

## Language tone

Professional is the default public tone. Users may choose Aggressive or Nuclear wording. Tone changes **only presentation text**; evidence, confidence, thresholds and verdict logic are identical in all modes.

## Permission justifications

### scripting
Runs manual bounded extraction after user action, and registers an opt-in ISOLATED-world product detector after consent.

### storage
Stores local settings, short-lived public-lookup caches and bounded local observation history.

### contextMenus
Provides explicit product/image/store investigation shortcuts.

### sidePanel
Hosts the primary DropShredder interface.

### optional HTTPS host access
Supports narrow manual site/image/public lookup requests. Automatic alerts require a distinct opt-in to broad HTTPS host access; they perform local on-page screening only, not remote research. The user can disable auto alerts and revoke optional access.

## Data-use declaration

- No sale of user data.
- No advertising or behavioral profiling.
- No credential or payment-data collection.
- No DropShredder cloud copy of browsing/investigation history.
- Public commerce content is processed only for the user-requested consumer-protection functionality.
- User-triggered external lookups disclose only the query/resource required by that third-party service.

Privacy policy: publish the repository's `PRIVACY.md` URL in the Chrome Web Store developer dashboard.

## Release gates

Before Chrome publication:
- TypeScript typecheck passes.
- Security source audit passes.
- Intelligence/data lint passes.
- Full regression suite passes.
- MV3 production build passes.
- Chrome Store ZIP builds.
- Generated manifest/bundle audit passes.
- Performance budget audit passes.
- CodeQL passes.
- 16/32/48/128 raster icons are included.
- Privacy-practices form exactly matches `PRIVACY.md`.
- Browser smoke-test matrix is completed on the target Chrome release.
- Store screenshots and promotional assets reflect the actual current UI.
