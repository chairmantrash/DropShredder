# DropShredder Privacy Policy

Effective: October 6, 2026

DropShredder is a local-first browser extension for investigating product provenance, dropshipping/resale indicators, merchant-risk signals, review anomalies, fulfillment claims, and related consumer-protection evidence.

## Data DropShredder processes

When the user explicitly runs a scan or investigation action, DropShredder may process information visible on the active commerce page, including:
- page URL/domain;
- product title, description, price and structured product metadata;
- product identifiers, specifications and images;
- seller/business names exposed by the page;
- visible reviews;
- shipping, scarcity and provenance claims;
- return/refund policy text;
- tracking/fulfillment text when the user explicitly runs the fulfillment check.

## Local storage

DropShredder stores a bounded set of investigation observations locally in the browser using Chrome storage and IndexedDB. This local history supports chronology, price/scarcity history, product-identity comparisons and source matching.

Before persistence, page and image URLs are stripped of query strings and fragments so tracking parameters, signed URL tokens, and other unnecessary URL data are not retained. History is capped at 2,000 observations globally and 120 observations per product identity.

DropShredder does not store passwords, authentication tokens, cookies, payment-card details, form-field contents, or account credentials. It does not use the Chrome cookies API and does not inspect password fields.

DropShredder does not operate a hosted user-data backend and does not upload browsing or investigation history to the DropShredder developer.

## External lookups

Some actions are explicitly user-triggered and may send limited query information to third-party public services or open a third-party search page. Examples include:
- RDAP domain-registration lookups;
- Google and public review/reputation searches;
- reverse-image search services;
- supplier/marketplace searches.

The query sent is limited to information needed for the selected feature, such as a domain, merchant/product name, or image URL. Those third-party services process the request under their own privacy policies.

Auto Source Hunt uses DropShredder's local source index/history and does not automatically upload the user's page history to a DropShredder server.

## Data sharing and sale

DropShredder does not sell user data.
DropShredder does not use browsing data for advertising, profiling, credit decisions, or data brokerage.
DropShredder does not transfer user data to third parties except when the user deliberately invokes a feature that requires navigating to or querying that third-party service.

## Human access

The DropShredder developer does not receive or inspect the user's locally stored browsing/investigation data through the extension.

## Permissions

DropShredder requests only permissions used for its consumer-facing functionality:
- `activeTab`: inspect the page the user explicitly chooses to analyze;
- `scripting`: run the user-requested local page extractor and page warning stamp;
- `storage`: save feature settings and local investigation history;
- `contextMenus`: expose explicit product/image/store investigation actions;
- `sidePanel`: provide the DropShredder interface;
- optional site access: requested only when a user-triggered feature needs to read a same-site policy page or other explicitly requested public resource.

## Chrome Web Store Limited Use

DropShredder's use of information received from Chrome APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements. Data accessed through browser permissions is used only to provide or improve DropShredder's disclosed commerce-forensics and consumer-protection functionality.

## Retention and deletion

Investigation history is stored locally in the user's browser with bounded retention. Removing the extension or clearing the extension's site/storage data removes that local data. DropShredder does not maintain a separate cloud copy.

## Changes

Material privacy-practice changes will be reflected in this policy and, when required, disclosed in the extension and Chrome Web Store listing before the changed behavior is used.

## Contact

Security and privacy issues may be reported through the public DropShredder GitHub repository's security/reporting channels.
