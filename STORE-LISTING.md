# DropShredder — Chrome Web Store submission copy
Prepared October 9,2026; candidate 0.2.0. Not submitted. See RELEASE-CHECKLIST.md for acceptance and authorization.

DS-039 update2026-10-10: offline interface packs add Simplified Chinese, Hindi, Spanish, Arabic, French, Bengali and Brazilian Portuguese alongside English, following Chrome's display language. Original technical evidence annotations/raw exports remain in their original wording; offline OCR offers all eight explicitly selected languages. Language review is separate from accuracy acceptance. See TRANSLATIONS.md.

## Name
DropShredder

## Short description (under132characters)
Investigate product provenance, seller claims and resale clues with local evidence and optional public research tools.

## Detailed description (customer copy)
Know more about the product before you buy. DropShredder helps investigate public product listings, sourcing clues and seller claims, then shows the evidence and its limits in Chrome's side panel.

Click CHECK THIS PRODUCT for a bounded local investigation. Enable automatic product alerts only if you want them: Chrome asks for HTTPS site access first. Qualifying individual listings can show a brief evidence toast; account, login, checkout and ordinary browsing stay outside the scan. Supported Amazon, Etsy and Walmart search pages can show neutral links to the original product page, without accusations or background supplier searches.

Investigate product identifiers, reused images/descriptions, local price/scarcity chronology, storefront/platform clues, source references, merchant relationships, visible review patterns, shipping contradictions and return friction. Shared platforms, importing, country of manufacture and similar pictures do not establish dishonesty. Missing evidence produces UNKNOWN, not a clean bill of health or a severe accusation.

Optional tools let you:
- open chosen supplier, reputation or reverse-image search destinations;
- retrieve public domain-registration chronology and an exact legal-entity identifier;
- search official recall candidates and confirm model/serial/lot applicability at the official source;
- read a selected product-label image locally using packaged English and seven selected-language OCR models, with native barcode detection where Chrome supports it;
- preview and save small source-linked reference lists; separately opt into weekly updates for already-authorized signed feeds with independently pinned publisher keys;
- perform a one-shot Brave supplier search with your own temporary API key. A provider plan may cost money; this optional tool is never required for the standard extension.

Standard DropShredder functions are free and require no DropShredder account, subscription or mandatory backend. Scan history/settings remain on your device. There is no developer telemetry, browsing-history upload, advertising or sale of data. Optional chosen providers receive the necessary public query/resource and network metadata; their own policies apply. The temporary Brave key is sent only to Brave for the chosen request and is never stored or exported. Label photos are not uploaded or saved.

Use the side panel to delete scan history, remove user lists/keys, revoke extra site access, choose search destinations and customize display/tone. Professional is the default; optional stronger wording never changes evidence thresholds.

Limitations: extraction and source coverage vary by site; some pages block access. This is an investigation assistant, not a fraud verdict service, comprehensive recall database, manufacturer authenticator or product safety/quality guarantee. OCR text and search hits are unverified leads. A signed feed authenticates bytes against a chosen key, not its publisher's claims or rights.

## Submission details
Single purpose and all permission/data-category fields: STORE-PRIVACY-DECLARATIONS.md.
Current policy: PRIVACY.md; verify its public URL after the accepted release merge.
Support: https://github.com/chairmantrash/DropShredder ; security handling: SECURITY.md.
No invented publisher email or Store item ID.

## Permissions / performance disclosures
Required: scripting, storage, contextMenus, sidePanel, alarms. Optional HTTPS origins are requested only for chosen functions; automatic detection needs separate broad-host consent. Alarms run optional preauthorized signed-feed checks, not continuous page crawling. No history/cookies/debugger/webRequest/native-messaging permission.

No remotely hosted executable code: OCR JavaScript, worker, WASM and eight language models are packaged and loaded lazily. Inert signed JSON is reference data. Passive product checks perform no external research. Full page text/collections, same-site enrichment, network requests, local history and tab fan-out are bounded. The exact candidate is 51 files / approximately52.24MiB (DS-040; exact bytes in current fingerprint) unpacked; standard browsing does not load OCR engines. Tested Chrome156 evidence does not prove every supported version's behavior.

## Assets
- store-assets/icon-128.png
- store-assets/promo-440x280.png
- store-assets/marquee-1400x560.png (optional)
- store-assets/screenshots/01-check-control-1280x800.png
- store-assets/screenshots/02-local-label-1280x800.png
- store-assets/screenshots/03-private-history-1280x800.png
- store-assets/screenshots/04-signed-reference-1280x800.png

Sources/transforms/fixture limits: store-assets/ASSET-MANIFEST.json. These use actual current Chrome pixels; composed captions are outside the UI and explicitly distinguish owned demo content. Do not substitute a mockup or pretend to authenticate a live merchant.

## Release gates
All existing automated gates plus independent acceptance must pass for the accepted runtime bytes. Ensure current privacy form matches implementation, notices retained, support/policy URL accessible, screenshots current and owner authorization recorded before merge/submission/publication. See RELEASE-CHECKLIST.md; this preparation does not publish the extension.

### DS-041 origin utility copy (acceptance pending)
Investigate where a product is made, sold and dispatched across the United States, Canada and Mexico. Eight separate origin stages keep store claims, imported inputs, seller identity and shipment evidence distinct. Add a local evidence file, review its source documents and inspect what is documented or still unknown. A dated sourcing map provides direct maker, provider and public-reference leads. This is a source-review aid, not independent certification or a guarantee of product quality or legal labeling compliance. No trusted-retailer badge is granted from directory membership.
