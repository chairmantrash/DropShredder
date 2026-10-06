# Seller-tool extension clean-room analysis — 2026-10-06

Source: owner-supplied installed Chrome extensions. Scope: static inspection for defensive research only. Do not redistribute proprietary code or private datasets.

## Batch analyzed
- AliHelp 3.0.1
- AliSave 5.2.6
- AliScraper by Spocket 1.2.17
- Anstrex Dropship 1.0.99
- Dropified 5.0.59
- DSers 3.5.37
- Ecom Autopilot 1.3.5
- GP Sourcing 1.1.1
- Importify 9.9.17
- Modalyst 4.1.3
- Skuowner 2.0.1
- TrendTrack 1.3.26

## Cross-tool findings

### 1. Cross-market product identity is the core seller workflow
The installed tools collectively target AliExpress, Alibaba, 1688, Amazon, eBay, Walmart, Temu, DHgate, Taobao/Tmall and other retail/supplier sources.

Defensive implication:
DropShredder must treat product identity as marketplace-independent. Matching should prioritize stable identifiers, technical invariants, variant structure, package contents and perceptual image fingerprints rather than source-platform-specific URLs.

### 2. AI rewrite/import is now normal seller tooling
Importify and related tools expose AI-assisted rewriting/import workflows across many suppliers/marketplaces.

Defensive implication:
verbatim title/description matching should be downgraded. AI_REWRITE_INVARIANT_MATCH should compare specs, measurements, model identifiers, variant topology, package contents and imagery.

### 3. Supplier media reuse is highly operationalized
AliSave and other tools make supplier-image/video extraction easy. GP Sourcing exposes image-analysis workflows tied to 1688/sourcing.

Defensive implication:
supplier-media fingerprints remain valuable, but absence of reused media is not exculpatory because sellers can replace assets. Store first-seen image hashes and compare exact + near-image similarity.

### 4. Automated price/stock/order sync removes visible operational tells
Dropified, DSers, Modalyst, Spocket/AliScraper and Ecom Autopilot automate product import, stock/price updates, ordering, fulfillment and tracking.

Defensive implication:
professional inventory/tracking behavior is not evidence of inventory ownership. Fulfillment and provenance must be evaluated separately.

### 5. Marketplace arbitrage is explicitly supported
Ecom Autopilot spans Amazon/eBay/AliExpress; Skuowner references Amazon/AliExpress/Shopify; Importify supports many retail and supplier sites.

Defensive implication:
DropShredder should detect retail-to-retail sourcing and arbitrage separately from wholesale/manufacturer sourcing. Legitimate resale should remain distinct from deceptive provenance claims.

### 6. Trend/competitor intelligence compresses launch cycles
TrendTrack integrates Shopify detection with Facebook Ads Library, Instagram and TikTok. Anstrex also spans product/supplier intelligence and automated ordering.

Defensive implication:
expect synchronized multi-store launch waves and rapid creative reuse. Build:
- AD_FIRST_SEEN_VS_LISTING_FIRST_SEEN
- CROSS_PLATFORM_TREND_CONVERGENCE
- SYNCHRONIZED_MULTI_STORE_LAUNCH
- CREATIVE_REUPLOAD_HISTORY

### 7. Broad permissions are common in seller tooling
Several tools request all-URL or broad marketplace host access, cookies, scripting, webRequest/declarativeNetRequest, storage and tabs.

Defensive implication:
DropShredder should retain a narrower permission model. The existence of broad seller-tool permissions is not evidence about any merchant, but demonstrates how much source-side data can be automated.

## Notable extension-specific findings

### DSers
- MV3, broad all-URL host access
- content paths for AliExpress and Temu
- supplier/import/tracking workflows
- large backend/API integration footprint

Defensive priorities:
- Temu/AliExpress equivalence matching
- supplier-switching tolerant fingerprints
- source-platform-independent product identity

### Importify
- MV3
- supports many marketplaces/suppliers including DHgate, Taobao/Tmall, Costco, Wish and others
- references Amazon, Walmart, Temu, 1688, Alibaba, AliExpress
- AI features and CSV/import tooling

Defensive priorities:
- AI rewrite invariant matching
- retail-arbitrage source classes
- source marketplace diversity in Deep Hunt

### TrendTrack
- MV3
- Shopify detection on all sites
- Facebook Ads Library, Instagram, TikTok integration
- Shopify app/theme/product and ad/traffic intelligence services

Defensive priorities:
- ad/listing chronology
- creative reuse
- Shopify catalog overlap
- synchronized trend waves

### Ecom Autopilot
- MV3
- broad Amazon/eBay access plus AliExpress/supplier logic
- stock sync, tracking and automation concepts

Defensive priorities:
- retail-to-retail arbitrage classification
- Amazon/eBay/AliExpress cross-market product equivalence
- price/stock synchronization should never confer legitimacy

### GP Sourcing
- MV3
- 1688 focus
- image-analysis endpoints
- supplier/profit/shipping workflows

Defensive priorities:
- 1688 image/source search
- source-image to storefront-image clustering
- DDP/shipping estimate is informational, not provenance

### AliSave
- AliExpress/Alibaba media extraction
- downloads supplier imagery/videos

Defensive priorities:
- media reuse fingerprints
- exact/near duplicate image chronology
- absence of reuse is not exculpatory

### AliHelp
- AliExpress-centric helper
- price/history/tracking/supplier concepts

Defensive priorities:
- supplier reputation is not product originality
- price history and fake-discount chronology remain useful
- separate marketplace-seller quality from merchant provenance

### Spocket AliScraper / Modalyst / Dropified
- AliExpress import and fulfillment integration
- supplier import and order workflows
- store integration

Defensive priorities:
- automated import fingerprints
- source-product equivalence
- fulfillment/provider disclosure vs seller claims

### Skuowner
- lightweight extension with Amazon/AliExpress/Shopify references

Defensive priorities:
- cross-source import patterns
- distinguish legitimate resale from deceptive claims

### Anstrex Dropship
- supplier/product research plus order automation
- multiple supplier/marketplace references including DHgate/Banggood/Amazon/eBay/Walmart/1688

Defensive priorities:
- multi-source product equivalence
- catalog cloning and saturation chronology

## Detection backlog promoted by this batch
- CROSS_MARKET_PRODUCT_EQUIVALENCE
- RETAIL_ARBITRAGE_SOURCE_CLASS
- AI_REWRITE_INVARIANT_MATCH
- SUPPLIER_MEDIA_REUSE
- MEDIA_REPLACEMENT_TOLERANT_MATCH
- SOURCE_PLATFORM_INDEPENDENT_IDENTITY
- SYNCHRONIZED_MULTI_STORE_LAUNCH
- CROSS_PLATFORM_TREND_CONVERGENCE
- AD_FIRST_SEEN_VS_LISTING_FIRST_SEEN
- CREATIVE_REUPLOAD_HISTORY
- CATALOG_FINGERPRINT_OVERLAP
- SUPPLIER_SWITCH_TOLERANT_FINGERPRINT

## False-positive controls
- authorized wholesale/private-label/OEM is legitimate;
- retail resale is not inherently deceptive;
- shared supplier images can be licensed;
- automated fulfillment/tracking is common in legitimate ecommerce;
- use of any seller tool or marketplace is informational only;
- country/manufacturing origin never carries negative weight by itself.
