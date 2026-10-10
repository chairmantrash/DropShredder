# DropShredder Beta Readiness

A build is beta-ready only when every automated gate below passes on the same exact commit and the generated artifact from that run is used.

## Automated release blockers
- TypeScript strict typecheck
- security audit and dependency audit
- intelligence/data lint
- architecture/professionalism audit
- full regression and adversarial test suite
- production extension build
- Chrome Store ZIP build
- generated-package release audit
- passive-path performance audit
- CodeQL

## Implemented beta mission
DropShredder can locally inspect public product pages for product/source identity clues, seller and fulfillment contradictions, return friction, review manipulation/quality patterns, pricing/scarcity manipulation, longitudinal changes, merchant-network context and focused safety evidence. Expensive or broad investigations remain explicit user actions.

## Evidence limits
- UNKNOWN is not CLEAN.
- Country, nationality, importing, Shopify/commerce platform use, overseas shipping and supplier-platform presence have zero accusation weight by themselves.
- A fuzzy safety/title match is a candidate only. Exact identifiers or corroborated brand/model are required before a regulatory match is actionable.
- Review checks identify suspicious visible reviews; they do not prove that unflagged reviews are genuine.
- Harsh customer language must remain downstream of the severe-evidence gate.

## External beta gate
Automated completion cannot substitute for a real browser. Before public beta distribution:
1. Load the exact unpacked CI artifact in current Chrome/Chromium.
2. Run RELEASE-TESTING.md.
3. Test legitimate manufacturer, honest reseller/importer, marketplace seller and deliberately suspicious storefront controls.
4. Record false positives, missed obvious manipulation, console errors and noticeable slowdown.
5. Treat a strong accusation with weak receipts, credential/payment capture, or material browsing slowdown as release-blocking.

## Current full feature scope — October 9, 2026
The owner expanded scope beyond the earlier beta mission. Offline English OCR, neutral marketplace result links, source-scoped relationship leads, bounded lexical similarity and opt-in trusted signed weekly feed updates are implemented. Optional Brave Search uses a temporary user key and may require a provider plan; standard functions work without it. Neural embeddings, guaranteed factory authentication and silent publisher-key rotation are not claimed.

Implementation is not acceptance: genuine label photographs, category-disjoint calibration, independent A01–D06, full native context menus/concurrent panels and authenticated external provider/unit scope still require testing. Current completion evidence is DS-037; prior receipts are historical. The latest package must pass its exact fingerprint before Chrome results count.
