# Context engineering

DropShredder agents must not preload the whole repository.

## Default retrieval sequence
1. Read root `AGENTS.md`, `START-HERE.md`, current state, active task.
2. Search exact symbols/paths named by the task.
3. Read the smallest relevant implementation range.
4. Inspect callers/dependencies and adjacent tests.
5. Read architecture/research only when needed to resolve an ambiguity.
6. Read historical runs only for regression/provenance questions.

## Freshness
Current code/tests/task packets and newest authority/ADR files outrank old research or run notes.

## Compression
Store durable conclusions, not transcripts. A run record should preserve: goal, changed files, evidence, blockers, decisions, and follow-up.
