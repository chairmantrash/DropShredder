# Contributing

DropShredder accepts fixes, adapters, forensic rules, tests, and evidence-corpus improvements.

Before changing scoring or severe-verdict behavior, read:
- `brain/authority/PRODUCT-CONTRACT.md`
- `brain/authority/EVIDENCE-POLICY.md`

Rules must document:
- what is observed,
- why it is relevant,
- evidence family,
- severity,
- confidence/weight rationale,
- false-positive risks,
- at least one negative/adversarial fixture before promotion to strong/direct evidence.

Country of manufacture, nationality, Shopify/WooCommerce usage, CDN/provider, or domain privacy may not independently trigger a negative verdict.
