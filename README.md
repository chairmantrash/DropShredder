# DropShredder Brain & Workplane

A repository-local operating system for building DropShredder with AI agents without relying on a giant persistent prompt.

Start at `START-HERE.md`.

Key design choices:
- minimal `AGENTS.md`
- scoped authority and architecture docs
- task packets + claims + run heartbeats
- episodic/semantic/procedural memory separation
- layered retrieval instead of context dumping
- independent verifier role
- in-repo portable eval strategy
- zero-backend product invariant

Run:

```bash
./tools/check-workplane.sh
./tools/claim.sh list
```
