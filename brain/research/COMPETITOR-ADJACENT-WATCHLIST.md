# Competitor / adjacent-tool watchlist

Updated: 2026-10-06

## Open-source projects — no owner download required

### dynamicwebpaige/product-bs-detector
Purpose: product-truth Chrome extension using external discussion/search grounding and explicit dropship/white-label detection.
Watch for:
- source attribution UX
- product identity extraction
- white-label matching workflow
- browser permission model
- local-vs-API boundary
Repository: https://github.com/dynamicwebpaige/product-bs-detector

### BAOSDEV/fake-review-detector
Purpose: hybrid heuristic + ML fake-review detection with Chrome extension scaffold.
Watch for:
- explainable review features
- timing/rating/text feature engineering
- test fixtures
- classifier-vs-rules architecture
Repository: https://github.com/BAOSDEV/fake-review-detector

### codedivaa/FakeReviewDetector
Purpose: rule-based explainable fake-review analysis.
Watch for:
- low-cost lexical heuristics
- rating/text contradictions
- transparent scoring
Repository: https://github.com/codedivaa/FakeReviewDetector

## Closed-source / store-distributed tools — useful if owner can legally export installed package

### WeLookup: Shopify Spy & Dropshipping Store Detector
Why useful:
- claims local browser-only operation
- detects 7,500+ apps/tools
- Shopify/WooCommerce/BigCommerce/Magento technology detection
- store/contact/product/price insights
Research value:
- large signature corpus architecture
- how they fingerprint ecommerce apps locally
- side-panel UX and data model

### FakeCatch: Fake Review Detector
Why useful:
- inline per-review trust scores
- automatic marketplace adapters
- generic-page manual scanning
Research value:
- review extraction/adaptation
- inline badge ergonomics
- explainability patterns

### ReviewShield
Why useful:
- seven independent review signals
- local/on-device analysis
- adjusted rating
- per-review flags
Research value:
- signal weighting and abstention
- multilingual marketplace adapter behavior
- on-device AI boundary

### Caveat — Fake Review & Price Checker
Why useful:
- Amazon + Etsy
- review-pattern analysis
- local price history
Research value:
- longitudinal price model
- Etsy/Amazon extraction
- low-overhead read-only design

### AliToolbox
Why useful:
- fake-review detection
- shared-image/copy-paste review detection
- price history
- listing-card trust stamps
Research value:
- card-level UI
- review image duplication
- price-history heuristics

### Fake-Shop Detector
Why useful:
- curated store database + real-time unknown-store analysis
- traffic-light risk UX
Research value:
- known-vs-unknown routing architecture
- abstention behavior
- curated-intel integration

### Shopify Store Spy & Analyzer
Why useful:
- detects products, tech stack, apps/themes, ads/offers/SEO
- aimed directly at dropshipper competitor research
Research value:
- store-technology fingerprinting
- Shopify app/theme detection
- product catalog extraction

## Handling rules

- Do not commit third-party closed-source code/binaries into the public DropShredder repo.
- Do not copy protected code unless license explicitly permits it.
- We may inspect legally obtained local packages for interoperability/research and record:
  - permissions
  - file/module structure
  - public/static signatures
  - selectors
  - rule-data formats
  - observable network endpoints
  - algorithms described in public docs
  - UX/workflow patterns
  - performance characteristics
- Any adopted implementation must be independently written unless the source license explicitly permits reuse.
- Keep a provenance note for every borrowed idea/signature.
