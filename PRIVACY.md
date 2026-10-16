# DropShredder Privacy Policy

Effective: October 9, 2026

DropShredder is a local-first browser extension for investigating product provenance, dropshipping/resale indicators, merchant-risk signals, review anomalies, fulfillment claims, and related consumer-protection evidence.

## Data DropShredder processes

DropShredder has two modes: (1) manual full-page investigations on pages the user chooses; (2) optional automatic product alerts, enabled only after the user grants Chrome access to HTTPS sites. With automatic alerts on, a tiny local classifier checks permitted pages to identify individual product listings and runs a bounded local quick scan only when the page qualifies. Non-shopping, category/search, account and checkout pages show no verdict alerts. Neutral links on supported marketplace searches are described below. A full scan and third-party research remain user-triggered; separately enabled signed reference-feed updates can run on their weekly schedule as disclosed below. The scanner may process public commerce information visible on qualifying pages, including:
- page URL/domain;
- product title, description, price and structured product metadata;
- product identifiers and specifications;
- public product images;
- seller/business names disclosed by the page;
- visible public reviews;
- shipping, scarcity, manufacture and provenance claims;
- public return/refund policy text;
- tracking/fulfillment text only when the user explicitly runs that check.

DropShredder does **not** read or store store-account passwords, payment-card numbers, cookies, browser history, autofill data, or merchant-page form values. If the shopper explicitly chooses optional Brave Search, the API key they enter in the extension is used only for that chosen provider request; it is cleared from the field immediately and is not stored, logged or exported. It is separate from store-account or payment credentials.

DropShredder refuses to scan known account, authentication, checkout, payment, billing, address-book and order-history routes. It also refuses a scan when password or payment-card form fields are detected on the active page.

## Local storage

Investigation observations are stored locally in the browser using IndexedDB. Feature settings are stored in Chrome local storage. The temporary auto-toast result is not added to IndexedDB history until a full report is explicitly requested. A brief in-document list prevents duplicate toasts while navigating the same page.

Local history is minimized before persistence:
- URL query strings and fragments are removed;
- image URL query strings and fragments are removed;
- signed/query-token image URLs are therefore not retained;
- only the bounded evidence report is stored, not full page HTML or arbitrary page text;
- local observation history is automatically capped at 180 days and 2,000 observations.

Users can clear all DropShredder local observation history from the side panel at any time.

DropShredder does not operate a hosted user-data backend and does not upload browsing or investigation history to the DropShredder developer.

## External lookups

Some optional actions require a public network request or opening a public search page. Examples include:
- RDAP domain-registration lookups;
- public Google/review searches;
- reverse-image search services;
- supplier/marketplace searches;
- explicitly selected image fingerprint acquisition.

The query/request is limited to what the selected feature needs, such as a merchant domain, product name, or public image URL. Network operations are time-bounded and use HTTPS. Third-party servers also necessarily receive network metadata such as the connection IP address. Choosing a search opens that provider’s website, where its own cookies, sign-in state and privacy policy apply; DropShredder does not read those cookies.

Auto Source Hunt uses DropShredder's bundled source registry and local observation history. It does not upload the user's browsing history to a DropShredder server.

Automatic product alerts never perform external network research or open search tabs. External reputation research is explicit and user-triggered. DropShredder does not automatically sweep third-party review sites. Users can revoke optional site access from the side panel.

## Data sharing and sale

DropShredder does not sell user data.
DropShredder does not use browsing data for advertising, profiling, credit decisions, or data brokerage.
DropShredder does not transmit store-account credentials or financial/payment information. Optional Brave Search sends the shopper-entered provider API key only to Brave for that explicit request; no developer receives it through DropShredder.
DropShredder does not transfer browsing/investigation history to the DropShredder developer.

When a user deliberately invokes a feature that queries or navigates to a third-party public service, that third party receives only the request necessary for that action and handles it under its own privacy policy.

## Human access

The DropShredder developer does not receive or inspect the user's locally stored browsing/investigation data through the public extension.

An internal developer-only diagnostic build exists separately from the public release. It is not merged into the public Chrome Store build and does not upload diagnostics automatically.

## Permissions

DropShredder requests only permissions used by its user-facing commerce-forensics workflow:
- `scripting`: run bounded local extractors on user-authorized pages, register the optional auto-alert content script, and render optional warnings;
- `storage`: local feature settings, short-lived caches and bounded local observation history;
- `contextMenus`: explicit product/image/store investigation shortcuts;
- `sidePanel`: the primary DropShredder interface;
- `alarms`: wake the worker for optional weekly checks of already-authorized signed reference subscriptions; no page polling or new permission request;
- optional HTTPS host access: site-specific grants for manual scans, image/public lookup origins and (only if selected) one-time broad HTTPS access to provide automatic shopping-page detection. Chrome shows the permission prompt before the broad access is granted. Turning off automatic alerts removes its broad host grant; the user can revoke extra site access anytime.

There is **no required all-sites host permission** and no permanent all-sites content script. Auto-alerts use a packaged content script dynamically registered after the opt-in. With the option enabled, Chrome may execute its inexpensive screening on permitted HTTPS pages to decide whether they are shopping listings. Detection results are processed locally and not transmitted to the developer.

## Chrome Web Store Limited Use

DropShredder's use of information received from Chrome APIs adheres to the Chrome Web Store User Data Policy, including Limited Use requirements. Browser/page data is used only to provide or improve the disclosed commerce-forensics and consumer-protection functionality.

## Security

- Manifest V3.
- Extension code is bundled locally.
- No remotely hosted executable code.
- No `eval()` or runtime code downloaded from the network.
- No cookie/history/debugger/webRequest/native-messaging permission.
- External requests use HTTPS.
- Untrusted evidence text is rendered with text-only DOM APIs rather than executable markup.
- Expensive image work is size-limited and downsampled before perceptual hashing.
- Public network enrichments have timeouts and response-size limits.

## Retention and deletion

Observation history is automatically limited to 180 days and 2,000 records. Users can erase it immediately from the extension UI. Removing the extension or clearing its extension storage also removes local state. DropShredder maintains no separate cloud copy.

## Changes

Material privacy-practice changes will be reflected in this policy and, when required, disclosed in the extension and Chrome Web Store listing before the changed behavior is used.

## Contact

Security and privacy issues may be reported through the public DropShredder GitHub repository's security/reporting channels.
# User reference lists and optional entity lookup (2026-10-09)

User-added JSON records, their public signing keys and one previous version stay in Chrome's local extension storage until removed/reset. These are public reference data, not account credentials. Feeds stay manual by default. After a separate weekly-update opt-in, the extension can fetch only subscriptions with an already-granted host and a previously pinned matching signing key. Each source is attempted at most once in seven days. Turning the setting off stops future checks; removing lists/keys or access makes those feeds ineligible. Clicking Fetch preview manually sends only the chosen public feed URL to its publisher, after Chrome permission; no browsing history, scan or stored records are uploaded. Downloads omit credentials and referrer, reject redirects and have size/time limits. Signed feeds require a manually reviewed public key; a signature does not validate product facts.

The optional GLEIF lookup sends only the exact LEI the shopper enters, after Chrome permission. Results stay in the current panel and are not added to scan history or exported reports. No account, secret key, entity address or ownership graph is collected. CPSC and RDAP remain explicit optional public lookups. Remove extra site access cancels active requests. Browser/provider network failures never establish safety, quality or merchant identity.

## Optional local label recognition and result badges

Selected PNG/JPEG/WebP label photos are processed on device after READ LABEL ON DEVICE. Tesseract JavaScript/worker/WASM and English plus seven selected-language models are bundled with the extension and loaded lazily; no model/CDN request or photo upload occurs. Images are not saved in history or exports. Recognized text and barcode values are unverified; an explicit source-search action can open searches for that chosen text.

With automatic protection enabled and Chrome host access granted, neutral marketplace search-result links can be added locally on Amazon/Etsy/Walmart searches. They link to the original product listing, do not assert wrongdoing and do not automatically investigate remote suppliers. The public extension uses no neural model, remote inference or developer analytics.

## North American origin evidence and references

The optional origin utility reads a shopper-selected local JSON file into side-panel memory only, up to 50 KB. It does not upload or automatically save the file, retrieve linked documents, authenticate sources or request a new permission. The shopper opens public source links and reviews them explicitly. Normal source navigation shares ordinary browser/network metadata with that source.

A deliberate apply action attaches the bounded assessment, role countries and sanitized public source URLs to the current report; an explicit report export includes that assessment. It does not rewrite earlier history or save the dossier. Full scans may save their initial claim-only origin assessment through ordinary local observation history. Navigation or **CLEAR ORIGIN EVIDENCE** discards the session dossier and review checkbox. No purchaser/shipping address is required: evidence only records a destination country. Avoid private source records or personal information when preparing evidence.

The packaged regional source directory loads locally when expanded. It makes no automatic network requests or scheduled refresh. Source references retain their original language and distinguish authority/directory/provider/manufacturer scope.

The standing panel accepts a local JSON file and explicit entity/role/name/domain inputs. Preview, review and result remain in panel memory and are cleared on page change/new scan; they are not saved to history or evidence exports. No court, bureau, carrier or certification API is called automatically. Source links are opened only by the user. Scheduled research maintenance is separate from the extension.
