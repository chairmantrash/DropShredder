# DS-RUNTIME-AUDIT-FOLLOWUP-20261008 — Chrome owner handoff

Status: READY
Owner: Original DropShredder continuation engineering agent / active DS-028 and DS-029 owners
Source task: DS-ENHANCEMENT-AUDIT-20261008
Release baseline: 2f89ddaac2037dbeb78be5a39ae7254b68394a78
Date: 2026-10-08

## Static findings requiring the owning agent

These are engineering audit findings, not performed Chrome QA failures. No extension ID or Chrome version exists in this environment. Do not claim browser reproduction or fix completion from this file.

### RUNTIME-AUDIT-01 — Etsy adapter routing, high priority

`entrypoints/sidepanel/main.ts` near line 368 uses `/(^|\\.)etsy\\.com$/i`. The doubled escapes make the literal fail for `etsy.com` and normal subdomains. Read the current source before editing, because the owner may have changed it.

Reproduction of the exact source literal in Node: call `.test('etsy.com')` and `.test('www.etsy.com')`. Expected true; actual false. Verify the adapter reaches the scanned Etsy product in actual Chrome after the owner corrects the routing.

The new independent marketplace policy context is wired into passive rules; this does not repair the Etsy adapter guard. Consequence: adapter-specific maker/production-partner context may be skipped.

### RUNTIME-AUDIT-02 — Visible price detection, high priority

`src/detection/page-facts.ts` near line 87 has doubled escapes in its visible-price regex. Literal tests for `$29.99` and `29.99 USD` return false. Expected true. Structured offers can conceal this issue.

Owner should add a meaningful fixture for a purchasable single-product page with visible price but no structured Offer, then verify the real page/classifier path in Chrome. Consequence: schema-free products may be missed by automatic detection. No Chrome page has been tested here.

### RUNTIME-AUDIT-03 — Exact product attribution, release-critical validation

`src/extraction/page-scan.ts` selects the first Product node/Offer. Static inspection does not show selected-product URL/variant attribution before selection. A recommendations-first Product array or multi-offer variant page can supply another item's details.

Owner should exercise fixtures where recommendations precede the canonical product, ProductGroup contains variants, and selected color/size has a different offer. Expected: scanned evidence and price belong to the clicked product/selected variant; ambiguous extraction abstains. Actual runtime behavior remains untested. Consequence if reproduced: wrong-product warnings or comparisons. Follow the QA package's stop-at-first-failure rule in real Chrome.

## Required validation

Use real desktop Chrome 133+ with unpacked installation, the exact new build SHA and complete WORK-AGENT-TEST-PROMPT.md order. Record OS/version/extension ID, actual URLs, redacted screenshots and messages. Exercise consent deny/grant/revoke, no passive external egress, toast-to-exact-product navigation, excluded pages, lifecycle/restart, SPA/tab changes and large-page performance. Do not merge PR #9 or treat local tests as Chrome approval.

## Owner action

Paste this handoff into the original continuation engineering conversation. Coordinate the active file claims there before fixes. This sweep changed none of those claimed runtime files.
