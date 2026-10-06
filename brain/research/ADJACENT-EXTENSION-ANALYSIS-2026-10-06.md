# Adjacent extension analysis — 2026-10-06

Owner-supplied locally installed extensions were examined only to understand product architecture, UX patterns, permission models, and defensive research priorities. Proprietary code and bundled vendor datasets are not redistributed or copied into DropShredder.

## High-level findings

### Fake-Shop Detector
- Uses a known-vs-unknown store risk model.
- Separates curated reputation knowledge from live site analysis.
- Reinforces the need for an explicit UNKNOWN state.

### Koala Inspector
- Represents the heavier end of professional Shopify/store intelligence.
- Combines broad local extraction with remote intelligence services.
- Reinforces our decision to preserve a zero-backend core while reproducing useful workflows locally where practical.

### Shopify Store Spy & Analyzer
- Combines storefront analysis with external review, advertising, and reputation pivots.
- Validates Deep Hunt as the right place for optional external evidence gathering.

### SpotPeaks Store X-Ray
- Uses supplier-search and reverse-image workflows as core investigative actions.
- Validates DropShredder's planned context-menu "hunt this product/image/store" workflow.

### Store Detector
- Demonstrates that local ecommerce-technology fingerprinting can scale to hundreds of app signatures.
- Validates a versioned local signature registry with provenance and refresh dates.
- Tool presence remains informational by default and must not directly imply dropshipping or deception.

## Cross-product lessons

1. Technology detection should be local, structured, versioned, and regularly refreshed.
2. Reverse-image and supplier search are durable workflows, but chronology is essential because upstream marketplaces may copy original creators.
3. Review, ad, and reputation sources are useful corroboration channels, not standalone guilt signals.
4. Known-store intelligence and live analysis should be separate systems.
5. Broad permissions are common in competitor tools; DropShredder should remain narrower with activeTab and user-triggered access whenever possible.
6. Server-backed intelligence can add breadth, but core DropShredder functionality must remain useful without a backend.
7. Explicit abstention is preferable to forced classification.

## Backlog consequences
- versioned technology-signature registry with provenance and last-verified timestamps
- context-menu reverse-image/supplier hunting
- review/reputation/ad chronology pivots
- known-vs-unknown merchant routing
- Shopify app/theme/platform fingerprint adapters
- signature staleness tracking
- optional external-evidence aggregation in Deep Hunt
