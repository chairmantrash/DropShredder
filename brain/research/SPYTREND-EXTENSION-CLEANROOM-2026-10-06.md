# SpyTrend extension clean-room analysis — 2026-10-06

Source: owner-supplied locally installed SpyTrend Chrome extension version 1.0.7.

Scope: static inspection of the installed package for interoperability, architecture, and defensive research. Do not redistribute proprietary code, bundled assets, or private datasets.

## Manifest / runtime shape
- Manifest V3
- permissions: storage, tabs, scripting, alarms, notifications
- broad HTTPS host access
- service worker backend
- content scripts on:
  - Facebook Ads Library
  - Facebook / Instagram feeds
  - TikTok Creative Center
  - TikTok Ads Library
  - TikTok feed
  - all HTTPS pages for Shopify detection

This confirms SpyTrend is both a storefront inspector and an ad-intelligence capture tool.

## Local Shopify detection
The extension performs substantial storefront analysis locally before querying its own backend.

Observed local concepts include:
- Shopify presence
- MyShopify domain
- theme name
- currency
- country
- locale
- current product
- public product catalog
- product IDs / handles
- vendor / product type
- price / compare-at price
- availability
- created_at / updated_at
- image count
- JSON-LD fallback extraction

It also probes standard same-origin Shopify public product JSON routes when the user requests product/catalog details.

### Defensive implications
- DropShredder should add Shopify-native product creation/update chronology when publicly exposed.
- Compare-at pricing history can help detect persistent fake-sale/reference-price behavior.
- Product handle/ID/vendor/product-type should join the technical product fingerprint.
- Catalog overlap can become a mass-resell/network signal when multiple independent invariants align.

## Tracker intelligence
SpyTrend locally recognizes these tracker families:
- Meta Pixel
- TikTok Pixel
- Google Analytics / Google Tag Manager
- Google Ads
- Snap Pixel
- Pinterest Tag
- Microsoft Clarity
- Hotjar

It extracts tracker IDs from public page scripts where available.

### Defensive implications
- Add public tracker-ID extraction locally.
- A tracker tool itself has zero accusation weight.
- Reuse of an uncommon tracker ID across independently branded domains can become merchant-network corroboration.
- Shared agencies, SaaS defaults, affiliate systems and generic infrastructure are major false-positive risks.
- Require at least one independent network/provenance signal before elevating tracker reuse.

## Shopify app detection
SpyTrend contains a local app fingerprint list covering at least 55 named app/service families in this version, spanning:
- reviews
- email marketing
- page builders
- ads/analytics
- conversion/FOMO
- customer support
- subscriptions
- loyalty/referrals
- push/SMS
- attribution
- upsell/cart
- search/personalization
- payments

Examples observed include Loox, Judge.me, Yotpo, Klaviyo, PageFly, GemPages, Triple Whale, Hyros, Fomo, TrustPulse, ProveSource, Rebuy, Nosto, Okendo, Afterpay, Klarna, Clarity, and Optimizely.

### Defensive implications
- This validates a broader local app-signature registry.
- Presence of any app remains informational only.
- Some app categories can explain suspicious-looking UI without implying deception (for example scarcity/FOMO widgets).
- Tool fingerprints are most useful for interpreting other evidence and keeping old heuristics from becoming obsolete.

## Ad / creative intelligence
The extension integrates with public ad surfaces and its own service to connect:
- advertiser/page IDs
- landing domains
- product URLs
- ad first-seen dates
- active duration
- creatives
- repeated/re-uploaded creatives
- geography
- traffic/ads relationships

### Defensive implications
- Public ad chronology can corroborate product-launch chronology.
- Product URL normalization should strip common tracking parameters before comparisons.
- Creative reuse and re-upload counts are valuable mass-resell/network signals.
- Ad longevity is not proof of profitability or legitimacy.
- External ad evidence should remain source-labelled.

## Backend boundary
The extension uses SpyTrend-authenticated service routes for large historical/store/ad/webmaster datasets.
It also exposes a guest/demo shop-card route for limited public/free functionality.

DropShredder policy:
- do not attempt to bypass auth, plans, quotas or locked datasets;
- use only documented/public/free surfaces when useful;
- reproduce local extraction capabilities independently where practical.

## Clean-room backlog generated
1. TRACKER_ID_REUSE
2. SHOPIFY_PRODUCT_CREATED_AT
3. SHOPIFY_PRODUCT_UPDATED_AT
4. CATALOG_FINGERPRINT_OVERLAP
5. COMPARE_AT_PRICE_CHRONOLOGY
6. CREATIVE_REUPLOAD_HISTORY
7. AD_FIRST_SEEN_PRODUCT_CORRELATION
8. UNCOMMON_TRACKER_CLUSTER
9. PRODUCT_HANDLE_VENDOR_TYPE_FINGERPRINT

## False-positive controls
- tracker IDs may be shared by agencies or operator tooling;
- app/theme presence is informational;
- product catalog overlap may reflect authorized wholesale;
- created_at may reflect migration/import rather than first manufacture/sale;
- re-uploaded ads can be legitimate A/B testing;
- public ad-platform data is incomplete and should never be treated as exhaustive.

## Strategic conclusion
SpyTrend's strongest reusable lesson is not its private database. It is the combination of:
1. local storefront extraction,
2. local tracker/app fingerprints,
3. normalized product/catalog identity,
4. public ad chronology,
5. backend historical aggregation.

DropShredder can reproduce 1–4 locally/publicly and use its own local observation history to recover part of 5 without requiring a hosted backend.
