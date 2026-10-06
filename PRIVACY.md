# DropShredder Privacy Policy

Effective: October 6, 2026

DropShredder is a local-first browser extension for investigating product provenance, dropshipping/resale indicators, merchant-risk signals, review anomalies, fulfillment claims, and related consumer-protection evidence.

## Data DropShredder processes

DropShredder only analyzes a page after a user explicitly asks it to scan or investigate that page. The scanner may process public commerce information visible on the active page, including:
- page URL/domain;
- product title, description, price and structured product metadata;
- product identifiers and specifications;
- public product images;
- seller/business names disclosed by the page;
- visible public reviews;
- shipping, scarcity, manufacture and provenance claims;
- public return/refund policy text;
- tracking/fulfillment text only when the user explicitly runs that check.

DropShredder does **not** read or store passwords, authentication secrets, credit-card numbers, payment credentials, cookies, browser history, autofill data, or form-field values.

DropShredder refuses to scan known account, authentication, checkout, payment, billing, address-book and order-history routes. It also refuses a scan when password or payment-card form fields are detected on the active page.

## Local storage

Investigation observations are stored locally in the browser using IndexedDB. Feature settings are stored in Chrome local storage.

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
- an optional Trustpilot reputation check;
- public Google/review searches;
- reverse-image search services;
- supplier/marketplace searches;
- explicitly selected image fingerprint acquisition.

The query/request is limited to what the selected feature needs, such as a merchant domain, product name, or public image URL. Network operations are time-bounded and use HTTPS.

Auto Source Hunt uses DropShredder's bundled source registry and local observation history. It does not upload the user's browsing history to a DropShredder server.

Auto Reputation Sweep is disabled by default. Enabling it requires an explicit optional Trustpilot host-permission grant. Turning the feature off revokes that Trustpilot access. Users can also revoke all optional site access from the side panel.

## Data sharing and sale

DropShredder does not sell user data.
DropShredder does not use browsing data for advertising, profiling, credit decisions, or data brokerage.
DropShredder does not transmit user credentials or financial/payment information.
DropShredder does not transfer browsing/investigation history to the DropShredder developer.

When a user deliberately invokes a feature that queries or navigates to a third-party public service, that third party receives only the request necessary for that action and handles it under its own privacy policy.

## Human access

The DropShredder developer does not receive or inspect the user's locally stored browsing/investigation data through the public extension.

An internal developer-only diagnostic build exists separately from the public release. It is not merged into the public Chrome Store build and does not upload diagnostics automatically.

## Permissions

DropShredder requests only permissions used by its user-facing commerce-forensics workflow:
- `activeTab`: temporary access to the page the user explicitly chooses to analyze;
- `scripting`: execute the local user-requested page extractor and optional page warning stamp;
- `storage`: local feature settings, short-lived caches and bounded local observation history;
- `contextMenus`: explicit product/image/store investigation shortcuts;
- `sidePanel`: the primary DropShredder interface;
- optional HTTPS host access: declared so user-triggered image/public lookups can request only the specific origin needed at runtime.

There is no required all-sites host permission.

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
