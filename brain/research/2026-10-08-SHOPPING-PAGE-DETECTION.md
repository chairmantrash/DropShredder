# Automatic shopping-page detection — primary-source research (2026-10-08)

## Authorities reviewed
- Google Search Central merchant listing: https://developers.google.com/search/docs/appearance/structured-data/merchant-listing
- Google Search Central product snippet: https://developers.google.com/search/docs/appearance/structured-data/product-snippet
- Chrome dynamic scripting: https://developer.chrome.com/docs/extensions/reference/api/scripting
- Chrome optional permissions: https://developer.chrome.com/docs/extensions/reference/api/permissions
- Chrome content scripts and isolated world: https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
- Chrome side panel programmatic open: https://developer.chrome.com/docs/extensions/reference/api/sidePanel
- Chrome declarative content: https://developer.chrome.com/docs/extensions/reference/api/declarativeContent
- Chrome Web Store policy (minimum permission/privacy/single purpose): https://developer.chrome.com/docs/webstore/program-policies/policies
- WXT content script entrypoints: https://wxt.dev/guide/essentials/entrypoints
- WXT runtime registration limitations: https://wxt.dev/api/reference/wxt/interfaces/basecontentscriptentrypointoptions
- WXT optional registration feature discussion: https://github.com/wxt-dev/wxt/issues/2239

## Finding 1: STORE != PRODUCT PAGE
Google explicitly distinguishes single-product merchant pages from category/list/search collections. Schema.org Product alone is not a reliable purchase-ready product indicator: publishers, reviewers and listing grids can include Product markup without being a seller product page.

Never use a merchant platform, one price, site nationality or advertising markup as classification evidence.

## Finding 2: independent surface signals
- Strong identity: Product JSON-LD/Offer; meta og:type=product; product-detail URL (/products/name, /product/name, /dp/ASIN, /listing/ID, /ip/...).
- Independent purchase proof: real Add to Cart / Buy / Order control.
- Price/offer: price widget, recognized currency, or actual structured Offer.
- Page focus: h1 product title and hero/product detail section.
- Counterevidence: route is a collection, search, homepage, editorial/blog, cart, account, login, checkout/payment; many product cards on unknown routes; Product JSON-LD inside Article.

Require multiple positive families. When uncertain, do not show a toast. Confidence in *page classification* is NOT confidence in a *merchant*. No signal, even a perfect classification, licenses a positive merchant-trust verdict.

## Finding 3: commerce ecosystem variability
Known direct product routes exist for Amazon, Etsy, Walmart, Shopify, WooCommerce, and various hosted platforms. SPA storefronts (React/Next.js/Hydrogen/Wix/Squarespace) may hydrate markup after document_idle, use generic URLs, and change routes without reload. The fallback must support ordinary DOM cues without broad recurring scrapes.

Detection strategy: a cheap synchronous check; up to two short hydration retries; Navigation API + popstate/hashchange for navigation (where exposed); no long-running MutationObserver, idle polling or page-framework monkey-patching. Real Chrome compatibility must be checked; Navigation API on isolated content scripts is not accepted as proven until browser testing.

## Finding 4: permissions constrain auto-scanning
Chrome activeTab is invocation-scoped and cannot support automatic future visits. Manifest-registered broad content scripts can add installation warnings. declarativeContent can match URL/CSS without site access but cannot deliver reliable full product analysis or arbitrary content-script injection in stable Chrome with no permission. Chrome permissions.request({origins:['https://*/*']}) must run in a direct user gesture. A user-selected broad optional HTTPS permission can allow packaged ISOLATED content scripts to run on permitted pages; no permanent blanket host_permissions needed.

WXT registration:'runtime' with matches lists can itself add host_permissions. DropShredder's build entrypoint therefore uses registration:'runtime', matches:[]; a separate audited runtime registration adds ['https://*/*'] only *after* the browser authorizes the optional permission. Production artifact audit must prove neither permanent host_permissions nor static broad content_scripts are emitted, and the runtime bundle exists.

## Finding 5: permission and UX lifecycle
Chrome sidePanel.open() is allowed from a user gesture in a content script and can open via tabId. The background must invoke open without awaits that drop the gesture, bind intent to sender.tab.id and documentId, and pass short-lived intent via session storage. Open panel triggers a fresh pinned full scan; it must not trust old side-panel report data.

Dynamic registrations persist across Chrome restarts when persistAcrossSessions=true; stored opt-in settings and permission grants must be reconciled when the worker starts. Unregistering does not remove an already-injected script; existing documents must check enabled state before displaying a future toast.

## Finding 6: avoid alert fatigue
- Toast ONLY on high-confidence individual product pages, never all URLs with a shopping keyword.
- No toast on searches, categories, homepages, blogs, ordinary browsing, login or checkout.
- Only one 12-second dismissible toast per product path per live document; no repeated scanning after result except on navigation/hydration retry.
- No claims of safety from missing evidence. Quick result includes at most two observed signals, or an explicit insufficient-evidence message.
- Automatic quick checks do not open tabs, call public services, fetch images, collect credentials or persist full observation history.
- Full forensic analysis and Deep Hunt begin after the shopper clicks.

## Release risks / browser gates
1. A real Apple iPhone detail page must qualify and show an accurate quick verdict without requiring panel-open first.
2. A manufacturer homepage and an Apple category/overview page must not trigger incorrectly.
3. Amazon product vs search pages, Etsy listings vs search, Walmart listings vs grids.
4. Shopify/Woo/Wix/Squarespace/Hydrogen products with and without JSON-LD; product detail after SPA navigation.
5. Account/auth/payment page entered during scan must fail closed.
6. Permission opt-in/denial/revocation and browser restart/worker suspension.
7. Toast click reliably opens side panel and scans the *clicked* document (not a newly active tab).
8. No significant browsing CPU or memory impact on long pages.
9. No misleading trust score from absence of bad evidence.

Static CI and simulated API tests are not sufficient evidence of a real Chrome permission/side-panel lifecycle.
