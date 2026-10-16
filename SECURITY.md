# Security

DropShredder is designed to inspect public commerce pages, not users.

## Report vulnerabilities
Use a private GitHub security advisory when available. Do not publish exploit details before a fix.

## Public-build security model
- Manifest V3 only.
- No remotely hosted executable code.
- No shared API secrets in extension source.
- No telemetry or mandatory backend.
- No cookies, browsing-history, debugger, webRequest, nativeMessaging, identity/OAuth, downloads, clipboard or management permissions.
- Active-page inspection uses `activeTab` after a user gesture rather than permanent all-sites access.
- Broad HTTPS host capability is optional only and is requested per user-triggered feature/origin.
- Users can revoke optional host access from the side panel.
- Account/authentication/payment/billing/order-history pages are refused.
- Pages containing password or payment-card fields are refused.
- Stored URLs are stripped of query strings/fragments before persistence.
- Local observation history is capped at 180 days / 2,000 records.
- Untrusted evidence is rendered with `textContent`/DOM nodes.
- Community intelligence packs, if introduced, must remain data-only and may never execute JavaScript.
- Network enrichment must use HTTPS, a timeout, response-size limits and graceful failure.
- Image fingerprinting is user-triggered, HTTPS-only, size-limited and downsampled before pixel analysis.

## Release gates
Every public release must pass:
1. TypeScript typecheck.
2. Full regression suite.
3. Registry/data integrity tests.
4. Security-baseline tests.
5. MV3 production build.
6. Chrome Store ZIP build.
7. Generated-manifest review.
8. Bundle-size budget.
9. Browser smoke tests on representative storefronts before publication.

## Internal diagnostics
The internal diagnostic build lives on a separate non-public branch/PR and must not be merged into the public Store artifact. Diagnostic exports are local-only and sanitized.

## Dependency policy
- Runtime dependency count should remain zero unless a dependency provides substantial, reviewed value.
- Build/dev dependencies are pinned to exact versions.
- New dependencies require source/license/security review.
- Remote code, dynamically fetched JavaScript and remotely supplied executable rules are prohibited.
