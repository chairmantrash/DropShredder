# DropShredder — START HERE

DropShredder is a zero-backend, local-first Chrome extension for consumer-commerce forensics: product provenance, mass-resell/dropship likelihood, seller-claim consistency, review anomalies, merchant-network attribution, price/scarcity history, and user-triggered public OSINT.

## Operating doctrine
1. **Evidence before accusation.** Every severe verdict must be traceable to independent evidence.
2. **Local-first / $0 operations.** Core functionality must not require paid APIs, hosted servers, subscriptions, shared secrets, or user accounts.
3. **Smallest sufficient context.** Agents read the minimum authoritative material needed for the current task, then retrieve evidence just in time.
4. **Freshness first.** Runtime code, tests, current task packets, and newest decisions outrank old notes. Historical material is archival unless explicitly needed.
5. **Contradictions > stereotypes.** A seller claim contradicted by observable evidence is stronger than generic traits such as Shopify, a new domain, country of manufacture, or long shipping windows.
6. **Independent corroboration.** High-severity labels require either one direct signal plus corroboration or multiple independent strong signals.
7. **Performance is a feature.** Passive browsing stays cheap. OCR, embeddings, network OSINT, and deep analysis are explicit/on-demand.
8. **Privacy is architectural.** No telemetry by default. No browsing-history upload. Local evidence store. Export/delete controls.
9. **Every change is verifiable.** Work is not complete until tests/evidence prove the requested behavior and likely regressions were considered.
10. **No silent scope expansion.** Record newly discovered work; do not opportunistically rewrite unrelated systems.

## First reads for any agent
1. `AGENTS.md`
2. `brain/authority/PRODUCT-CONTRACT.md`
3. `brain/authority/EVIDENCE-POLICY.md`
4. `workplane/CURRENT-STATE.md`
5. The assigned task packet in `workplane/tasks/`
6. Only then retrieve relevant architecture/research/code.

## Authority order
Current user directive > current task packet > authority docs > current decisions > architecture docs > research notes > historical runs.

## Work lifecycle
`READY -> CLAIMED -> RUNNING -> VERIFYING -> DONE` or `BLOCKED`.

Before editing, claim the task. During long work, update the run heartbeat. Before marking DONE, attach verification evidence.
