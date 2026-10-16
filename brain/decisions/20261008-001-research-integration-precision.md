# ADR 20261008-001 — Research integration with explicit identity and evidence lineage

Status: Accepted for feature review; real Chrome gate pending
Date: 2026-10-08
Task: DS-ENHANCEMENT-AUDIT-20261008

The research corpus is merged into a dedicated feature branch. Evidence-bearing changes use shared typed GTIN/ASIN/brand-model identity, explicit mismatch handling, connected observation ancestry, scoped official-notice matches and separate business/manufacture/fulfillment/return roles. Store-local SKU equality, shared stock images, marketplace presence, country and certificate logos do not establish wrongdoing or authenticity.

GTIN check digits validate format only; packaging indicators remain distinct. Title/model similarity and image similarity remain candidates. Variant conflicts abstain. Connected evidence lineage contributes once, including transitive overlaps and explicit observation-source keys. Source keys represent observations or feeds, not automatically entire domains; adapters should carry the same parent key when deriving multiple claims. Legacy signals without lineage still require producer review.

Passive scanning adds six dated marketplace policy contexts and claim-only certification scope, plus a small reviewed CPSC model subset. These are informational with zero accusation weight. Matching a notice model requires official unit-scope confirmation; absence does not clear a product. No serial collection or remote verification occurs automatically.

History compares strictly earlier observations from the same offer, compatible variants and known same currency. Image-history work is bounded to 12 current images, 250 observations and 12 historical images; keep the strongest gallery relationship per current image/observation, capped per-call caches and pre-parsed dates. This avoids counting every pair as a separate relationship.

Existing tool projects and papers inform clean-room design only. No foreign executable code, additional permissions, runtime dependency, network feed, telemetry or backend is introduced. OCR/embeddings/C2PA, full regulatory feeds, signed updates, calibrated error rates and large supplier graphs require separate evaluated tasks. Region weights remain unsupported without representative denominators and independent validation.

Active Chrome runtime/extractor/classifier ownership is respected. Static runtime discoveries and required desktop Chrome tests are handed off explicitly; static conformance is not runtime QA.
