# Technical signature sources

These signatures are maintained only for informational/toolchain context unless corroborated.

## Track123
Public documentation exposes:
- `https://www.track123.com/track123-widget.min.js`
- `http://shp.track123.com/tracking-page/build/widget.min.js`
- `#track123-tracking-widget`
- `<track123-tracking-widget>`
- `window.track123WidgetConfig`

Detection use: identify a tracking layer so later fulfillment evidence can be interpreted correctly. Presence alone has weight 0.

## ParcelPanel / CWILL Tracking
Public documentation exposes:
- `//pp-proxy.parcelpanel.com/assets/tracking/track-page.js`
- `#pp-tracking-page-app`
- `#pp-tracking-shop`
- `https://shopify-edd.parcelpanel.com/loader.js`
- `<parcelpanel-edd>`

Detection use: informational tracking/estimated-delivery context only.

## Review widgets
Loox and Judge.me signatures currently use common public DOM/script markers already observable in storefronts. These matches remain informational; review-provenance analysis must examine the reviews themselves or explicit import provenance.

## Rule
A tool signature can explain *how* a storefront feature may be produced. It cannot establish intent, deception, dropshipping, seller nationality, or product quality.
