# DropShredder fixtures

Fixtures exist to protect severe-warning precision, not to maximize detection counts.

Categories:
- `reviews/`: deterministic local review-analysis scenarios.
- `adversarial/`: cases designed to defeat naive rules.
- future `marketplaces/`: sanitized DOM/metadata snapshots for adapters.
- future `provenance/`: source/chronology/identifier cases.

Promotion rule:
A rule cannot be promoted to strong/direct evidence without at least one positive fixture and one negative/adversarial fixture covering its main false-positive mode.
