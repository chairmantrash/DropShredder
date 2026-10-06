# Etsy policy baseline — 2026-10-06

Current Etsy policy materially affects DropShredder's Etsy adapter.

## Policy facts
- Mass-produced reselling is not allowed in Etsy's handmade context except limited allowed categories.
- "Made by a seller" items must actually be made by the seller and normally use the seller's own photos.
- Sellers may use production partners for their original designs, including print-on-demand, when appropriately disclosed.
- White-label manufacturers, OEMs, ODMs, commercial retailers, and wholesalers are not qualifying production partners for ready-made resale.
- Seller policy requires accurate representation of how an item was made, by whom, and where it ships from.
- Etsy's listing-image policy generally requires original photos, with limited exceptions for qualifying production-partner/customized products.

## Detection implications
1. A production partner is **not** inherently suspicious.
2. A maker/handmade claim is a claim node, not negative evidence.
3. Severe Etsy warnings should be driven by contradictions:
   - maker claim + older upstream ready-made listing;
   - maker claim + exact manufacturer SKU/model;
   - supposed original product + matching ready-made wholesale catalog;
   - shipping/manufacturing disclosure contradicted by independent evidence.
4. Image reuse requires chronology because wholesale sellers can steal original maker images.
5. Stock/mockup imagery must be interpreted in light of Etsy's allowed production-partner exceptions.

## Sources
- https://help.etsy.com/hc/en-us/articles/360024112614-What-Can-I-Sell-on-Etsy
- https://help.etsy.com/hc/en-us/articles/23948763872151-Does-Etsy-Allow-Drop-Shipping-or-Reselling
- https://help.etsy.com/hc/en-us/articles/360000336547-Working-with-Production-Partners-on-Etsy
- https://www.etsy.com/legal/policy/listing-image-requirements/253962679005
- https://www.etsy.com/legal/sellers/
