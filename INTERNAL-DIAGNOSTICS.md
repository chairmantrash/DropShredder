# DropShredder Internal Diagnostics Build

This branch is for owner/developer testing only. Do not merge it into the public Chrome Store release.

## Purpose

Capture enough local scanner context to turn missed detections and false positives into reproducible fixtures and registry/rule improvements.

## Exported diagnostic fields

- extension version and browser user agent;
- sanitized page URL (query string and fragment removed);
- scan duration;
- enabled feature settings;
- detected commerce platforms;
- payment processors/rails;
- page-signal IDs;
- discovered About/Shipping/Returns/Contact page kinds;
- product-identifier coverage (GTIN/MPN/SKU/ASIN);
- Product JSON-LD count;
- catalog card/sale counts;
- review counts;
- script hostnames;
- image hostnames;
- script hosts not explained by the bundled commerce/payment registry;
- scanner coverage-gap notes;
- final verdict dimensions;
- supply-chain profile;
- evidence IDs;
- contradiction IDs;
- optional developer note entered before export.

## Explicit exclusions

Diagnostic export does not include:
- cookies;
- passwords or form values;
- authentication headers/tokens;
- browsing history;
- full arbitrary page HTML;
- full page text;
- review bodies;
- customer names;
- URL query strings/fragments;
- automatic network upload.

The bundle is generated locally and downloaded only after the developer presses **EXPORT DIAGNOSTIC CASE**.

## Workflow

1. Visit a test storefront.
2. Run DropShredder.
3. Compare the output with what a human investigation finds.
4. Enter a short note describing what was missed or incorrectly classified.
5. Export the diagnostic JSON.
6. Attach the JSON to the development conversation/issue.
7. Turn unknown hosts, missed platform clues, rule failures and parser gaps into regression fixtures before changing production rules.
