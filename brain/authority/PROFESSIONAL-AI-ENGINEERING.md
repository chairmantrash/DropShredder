# Professional AI-Assisted Engineering Standard

Updated: 2026-10-07

## Purpose
DropShredder may be built with substantial AI assistance, but production code is accepted by engineering evidence rather than by apparent functionality. AI output is a draft contribution: inspect, constrain, test, simplify, and document it before release.

## Acceptance loop
1. **Specify** — state behavior, invariants, privacy/security limits, performance budget, and failure behavior before implementation.
2. **Generate narrowly** — prefer the smallest coherent change. Do not ask an agent to redesign unrelated architecture while fixing a local defect.
3. **Inspect** — understand every changed execution path. Reject unexplained dependencies, permissions, network calls, dynamic execution, silent failure, speculative fallback behavior, and duplicated abstractions.
4. **Normalize** — align naming, types, module boundaries, error semantics, data contracts, and documentation with the existing codebase.
5. **Verify independently** — typecheck, unit/negative/adversarial tests, data lint, security audit, performance audit, build/release audit, CodeQL, and browser smoke tests where relevant.
6. **Refactor after characterization** — lock current behavior with tests before extracting a large AI-grown module. Do not mix behavioral change with structural cleanup unless necessary.
7. **Record evidence** — state what changed, what was run, what remains unverified, and any release blocker. Never describe an unrun check as passing.

## Professional code criteria
### Architecture
- One clear responsibility per module; UI orchestration, extraction, analysis, storage, networking, and rendering should not accrete indefinitely in one entrypoint.
- Prefer explicit typed boundaries over loosely shaped objects and cross-module knowledge.
- Registry/data volume is not treated as executable complexity; large static registries should be validated as data.
- Avoid parallel implementations of the same concept, convenience wrappers with no semantic value, and speculative abstractions.

### Language
- Names describe domain intent, not implementation accidents.
- Comments explain invariants, evidence rationale, security constraints, or non-obvious tradeoffs; remove narration of obvious syntax.
- Error messages identify the failed operation without leaking sensitive data.
- Avoid marketing certainty in code or UI when evidence is probabilistic.

### Correctness
- Every important rule needs positive and negative coverage.
- High-severity evidence requires adversarial/false-positive fixtures.
- Fuzzy matching is candidate generation unless independently corroborated.
- Missing/ambiguous evidence remains unknown rather than being guessed.
- AI-generated refactors must preserve observable behavior unless a behavior change is explicitly specified.

### Security and privacy
- No credentials, payment data, cookies, auth tokens, full browsing history, or reusable secrets are collected or persisted.
- No remote executable code or dynamic evaluation.
- New dependencies are exceptional: verify provenance, necessity, maintenance, license, and vulnerability status.
- New host permissions/network calls require explicit purpose, bounds, timeout, size limit, and data-handling review.
- Country/nationality is never a standalone negative-risk signal.

### Performance
- Expensive work is explicit/on-demand or tightly bounded.
- DOM scans, image counts, text sizes, history, network response sizes, concurrency, and timeouts have explicit caps.
- Cache only when it improves user experience without creating privacy or staleness hazards.
- Avoid repeated whole-page/workspace work when an incremental or targeted operation is sufficient.

### AI-residue audit
Review every release candidate for:
- oversized orchestration modules;
- duplicated helpers/rules;
- inconsistent terminology or data shapes;
- swallowed exceptions and catch-all fallbacks;
- magic thresholds without rationale;
- stale/dead code and imports;
- speculative branches not backed by requirements;
- weak input validation;
- excessive optionality;
- comments/docs that claim behavior not enforced by code;
- tests that only prove happy paths;
- network/dependency additions not represented in security/release policy.

## Structural thresholds
Thresholds are review triggers, not automatic defects:
- executable source file > 20 KB: review for decomposition;
- executable source file > 40 KB: release-blocking architecture review unless documented exception;
- data/registry files are exempt from size limits but require schema/integrity linting;
- new runtime dependency: mandatory dependency/security review;
- new remote origin: mandatory permissions/privacy/performance review.

## Current DropShredder application
The side-panel entrypoint exceeds the 40 KB review threshold and must be decomposed behind characterization tests. The merchant-network registry is large but primarily data and should remain governed by registry-integrity/data-lint checks rather than arbitrary splitting.

The current Trustpilot HTML fetch/parser is a separate release blocker: unsupported HTML scraping should not ship merely because it works technically. Replace it with a supported terms-compatible mechanism or user-launched search.

## Evidence basis
See `brain/research/AI-VIBE-CODING-PROFESSIONALIZATION-2026-10-07.md`.
