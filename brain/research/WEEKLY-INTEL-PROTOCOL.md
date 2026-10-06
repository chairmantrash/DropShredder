# Weekly dropshipping intelligence sweep

Purpose: keep DropShredder current as seller tooling changes. This is defensive research into **publicly documented** capabilities and observable storefront effects.

## Primary sources to scan every week

### Sourcing / fulfillment / branding
- Shopify App Store dropshipping category
- DSers
- AutoDS
- Zendrop
- CJdropshipping
- Spocket
- BuckyDrop
- Syncee
- EPROLO
- DropCommerce
- newly promoted Shopify sourcing/import apps

### Product cloning / listing transformation
- ProductUpload.ai
- Kopy-style importers
- Reputon Amazon Importer
- AutoDS import/AI tools
- DSers import/mapping tools

### Review / social proof
- Ali Reviews / Kudosi
- Judge.me + AliExpress importer
- Loox
- Vitals
- other review import/translation tools

### Product/ad/competitor intelligence
- Dropship.io
- Minea
- Sell The Trend
- Pipiads
- BigSpy
- Shopify/TikTok/Meta product and ad research tooling

### Conversion / storefront disguise
- Vitals
- PageFly
- GemPages
- Debutify
- upsell/bundle/scarcity apps
- AI storefront/page builders

### Tracking / fulfillment presentation
- branded tracking services
- shipment-tracking apps
- local-warehouse/3PL features
- features that mask, normalize, or relabel origin information

## Research questions
For each new/changed tool:
1. What seller problem is it solving?
2. Does it alter title/description/images/variants/reviews/packaging/tracking/origin presentation?
3. Which original facts survive the transformation?
4. Which storefront signatures are publicly documented and stable enough to detect?
5. Is the signal informational, weak, strong, or direct?
6. What legitimate use creates a false positive?
7. What regression fixture would prevent overclaiming?
8. Does this imply a new chronology/history requirement?

## Promotion rule
Never move a technique into a strong/direct detector merely because a tool markets itself to dropshippers. Tool presence is usually context. Stronger rules require observable product/seller contradictions, independent source matches, or provenance evidence.

## Outputs
- update `data/dropship-tool-intel.json`;
- add dated research notes when capabilities materially change;
- add/update detection rules only when a reliable public signature exists;
- add adversarial fixtures for every promoted rule;
- record source URL and observation date.
