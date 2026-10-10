# Fake Review Adversary Research — 2026-10-07

## Purpose
Threat intelligence for DropShredder. Study manipulation patterns to improve detection, not to reproduce operational instructions for review fraud.

## Observed manipulation families

### Refund-after-review / verified-purchase laundering
Investigations and platform enforcement describe brokers arranging real marketplace purchases, then reimbursing reviewers off-platform after a desired review is posted. Result: a review can carry a verified-purchase marker and still be manipulated.

DropShredder rule: verified purchase is supporting evidence only. Never let it override stronger behavioral, temporal, graph, mismatch, incentive or external evidence.

### Delayed / humanized campaigns
Broker investigations describe minimum-length requirements, delayed posting, and requests for photos/video. These are designed to avoid simplistic same-day/short-text filters.

DropShredder rule: absence of a burst or presence of rich media is not exculpatory.

### Obfuscated coordination language
Investigations found altered spellings/symbol insertion around review/refund language.

DropShredder rule: normalize Unicode, zero-width characters, punctuation splitting and common obfuscation before matching incentive/refund language.

### Private/off-platform coordination
Brokers recruit and coordinate via social networks, private/encrypted messaging, email, phone/text and paid/organic search.

DropShredder implication: page-visible evidence will always be incomplete. Missing coordination evidence means unknown, not clean.

### Review hijacking / variation abuse
Platforms and regulators describe repurposing reviews for materially different products and linking unrelated product variations to inherit rating history.

Detection:
- review predates current listing/product identity
- review text repeatedly names another product/category
- material identity mutation while review corpus persists
- abrupt variant-family changes
- rating/review count continuity across identity changes

### Selective solicitation / suppression
Businesses may solicit happy customers while routing unhappy customers elsewhere, pressure removal/change of negative reviews, or suppress negative submissions.

Detection candidates:
- first-party vs independent rating gap
- suspicious absence of low-star reviews despite substantial external complaint evidence
- visible language telling unhappy buyers to contact support before reviewing
- review distribution discontinuities over time
- external reports of refund/compensation tied to review changes

### Insider / relationship reviews
Employees, managers, relatives or agents can create biased reviews without clear disclosure.

Local extension limits mean identity attribution is usually weak. Treat shared names/contact/network evidence as candidate context only, never proof by itself.

### Fake independent review sites
A seller-controlled comparison/review property may present itself as independent.

Detection candidates:
- shared legal/contact/address identifiers
- shared analytics/technical identifiers when legitimately visible
- cross-linking/affiliate relationships
- domain chronology
- identical copy/images
- disclosure/ownership language

### Helpful-vote / Q&A manipulation
Platforms identify manipulation of helpful/not-helpful/report features and fake customer Q&A.

Detection candidates where data is visible:
- highly concentrated helpful votes on suspicious review clusters
- duplicated Q&A language
- Q&A burst timing
- answer language repeated across products
Do not infer manipulation from popularity alone.

### Competitor sabotage
Fake negative reviews can be purchased against competitors.

DropShredder rule: integrity filtering applies to negative reviews too. Low-star complaint summaries exclude reviews flagged by integrity checks.

## Research-side defensive findings
Recent fake-review literature increasingly favors information fusion: text, rating behavior, time, reviewer-product networks, multimodal evidence, external knowledge and uncertainty. Graph/network structure is especially useful because text and metadata are comparatively cheap to mutate while repeated broker/reviewer-product relationships are more costly to disguise.

## New methodology requirements
1. Replace binary fake/real thinking with per-review suspicion and reason codes.
2. Separate review-level integrity from product-level campaign evidence.
3. Compute adjusted rating only from reviews that pass the current integrity threshold.
4. Show passed/flagged percentages as estimates, never "percent real."
5. Analyze one- and two-star complaints only after integrity filtering.
6. Detect positive and negative manipulation symmetrically.
7. Add campaign-level features:
   - rating histogram anomaly
   - temporal burst and cadence
   - review-count discontinuity
   - review/listing chronology conflict
   - duplicate/paraphrase clusters
   - product/category mismatch
   - incentive/refund language
   - rating-text contradiction
   - first-party/external rating gap
   - review corpus persistence across product mutation
8. Treat verified-purchase status as one weak-positive trust feature, never a bypass.
9. Add adversarial fixtures for delayed, long-form, photo-bearing, verified and obfuscated fake-review patterns.
10. Prefer interpretable receipts over opaque fake-review probabilities.

## Sources reviewed
- FTC Consumer Reviews and Testimonials Rule and Q&A.
- FTC guidance for review platforms and marketers.
- Amazon review-abuse policies and enforcement reporting.
- Which? undercover investigations into review brokers.
- Trustpilot Trust Report 2025.
- He et al. (2024), Detecting fake review buyers using network structure: Direct evidence from Amazon.
- 2026 survey of fake-review detection covering 211 studies.
- 2025 systematic literature review of GNN fake-review detection.
