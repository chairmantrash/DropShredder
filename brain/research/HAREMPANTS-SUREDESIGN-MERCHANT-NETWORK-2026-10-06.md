# Merchant network case study: HaremPants / Sure Design — 2026-10-06

Purpose: convert a real consumer provenance anomaly into reusable merchant-network detection logic.

## Public linkage evidence

### 1. Shared corporate/mailing address
Sure Design contact page:
- SUREDESIGNTSHIRTS, LLC
- 9120 Double Diamond Parkway, Reno, NV 89521

Public HaremPants business/contact profiles list the same Reno address.

### 2. Public affiliation
HaremPants LinkedIn lists affiliated pages including:
- Sure Design Wholesale
- SureDesignTshirts.com
- SureCannabisDesigns.com
- MysteryBuddha.com

### 3. Cross-domain support leakage
Sure Design's shipping page contains harempants.com email references inside the Sure Design contact text.

### 4. Cross-domain product-copy leakage
Archived/current Sure Design product pages contain phrases such as:
- "Free International Shipping ... at HaremPants.com"

### 5. Exact shared product identifiers
Examples:
- Sure Design "Unisex Triangles Harem Pants in Black" — SKU GPH42-Black
- HaremPants "Triangles Women's Harem Pants in Black" — SKU GPH42-Black
- Sure Design "Unisex Plus Size Paisley Feathers Harem Pants in Black" — SKU GPHP20-Black
- HaremPants "Plus Size Paisley Feathers Men's Harem Pants in Black" — SKU GPHP20-Black

Descriptions, measurements, materials and product structure substantially overlap.

### 6. Shared fulfillment geography
Sure Design says items are processed/shipped from a Chiang Mai, Thailand warehouse.
HaremPants states products are made/shipped from Thailand and uses the same 4–7 day express / 12–21 day standard fulfillment structure.

### 7. Physical package evidence supplied by owner
A HaremPants order contained a Sure Design sticker. This is private user evidence and should not be shipped as a public fact by itself, but it is consistent with the independent public merchant-network evidence above.

## Interpretation

The evidence supports treating HaremPants and Sure Design as an affiliated/common merchant network rather than independent storefronts. This does not by itself prove fraud or dropshipping.

Consumer-relevant implications:
- package branding from another network member should not be treated as an unrelated coincidence;
- complaint/reputation evidence may be relevant at both store and network level;
- identical SKU/catalog evidence across network domains should be surfaced;
- merchant transparency should distinguish "different brand/domain" from "independent operator";
- network identity should remain separate from product-quality and provenance scores.

## Product/platform note

Current Sure Design pages openly reference Thailand/Bangkok/Chiang Mai and India/Nepal collections. The current evidence does not support describing Sure Design as exclusively India-based.

Both sites use Shopify, but public theme directories indicate different themes at present. Shared layout alone is therefore weak evidence compared with shared address, affiliation, SKUs and cross-domain content leakage.

## Detection requirements

1. Built-in, data-only known merchant-network registry.
2. Cross-domain exact SKU/GTIN/MPN/ASIN matching from local observations.
3. Cross-domain merchant references in storefront/policy text.
4. Future:
   - shared email/phone/address hashes;
   - tracker/pixel reuse;
   - policy text similarity;
   - catalog-overlap percentage;
   - favicon/image reuse;
   - external public affiliation adapter.
5. Network evidence affects merchant identity/transparency, not severe fraud gate by itself.
