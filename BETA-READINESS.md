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

## Deferred by scope, not unfinished beta work
OCR, local embeddings, result-page badges, broad corporate/network OSINT and aggregate trade/factory intelligence are deliberately outside the beta mission. They must not be represented as missing beta functionality.
