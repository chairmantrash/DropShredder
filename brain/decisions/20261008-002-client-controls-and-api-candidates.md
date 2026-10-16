# 20261008-002 — Client display controls and bounded API candidates

Date: 2026-10-08
Status: ACCEPTED for draft PR #10; actual Chrome validation outstanding
Owner authorization: another gap-closing audit across code, UI, agency, customization/control, utility, detection and API use.

Display customization uses a separate validated local-storage key and serializes writes. It cannot alter evidence thresholds, protection consent, tone or origin preference. Evidence filters report hidden counts and preserve verdicts. Source/method disclosure admits missing producer metadata. Numeric panel metrics are heuristic evidence scores, not calibrated probabilities.

Current-scan export uses a deliberate bounded allowlist. Raw reviews, full page text, images, product specifications and raw merchant contact records are excluded; public HTTPS links lose query strings/fragments, and common token/email strings are redacted. This is not universal anonymization: public titles or evidence prose may still identify people/places. Review the file before sharing. Unsupported/sensitive/malformed reports do not enable export or API controls.

The CPSC lookup is a separate explicit candidate utility, not a recall clearance or scoring detector. The shopper chooses the public query/field and grants normal optional Chrome host access. One request is bounded to 8 seconds, 2 MB, 200 inspected records and 12 notices; no credentials, redirects, caching, retry or follow-up image/contact requests. Cancellation while permission is pending prevents a subsequent request. Report changes invalidate the pending lookup. Notice links go only to official CPSC recall paths. Model-token presence does not establish exact unit coverage.

Live ProductName/RecallTitle probes differed, included Trankerloop for Anker and omitted the locally retained official 25-466 notice. Therefore empty results, truncated results or a name match never clear safety or change a verdict. Other APIs stay research-only until access/terms/identity/privacy are justified individually; no API key is bundled.

Domain registration versus business age is informational. Return-policy steps are not adverse unless the text establishes an actual deadline/fee/constraint. Complaint/quality/rating rules share review-platform ancestry; product and merchant-service rating scopes are not interchangeable. Manufacturing, shipment, merchant, returns and payment roles remain separate. Geographic preference disclosures do not create nationality-based negative risk weight.

The full development graph is locked and CI installs with npm ci. LinkeDOM is pinned and development-only for DOM behavior tests. It is not a browser and cannot verify native layout, permissions, tab lifecycle or downloads. Do not merge until the owning Chrome agent completes the real QA package.
