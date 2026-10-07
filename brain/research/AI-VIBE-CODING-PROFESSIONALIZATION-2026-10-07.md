# AI / Vibe Coding Professionalization Research — 2026-10-07

## Synthesis
Recent research does not support treating AI-assisted coding as inherently amateur. It does support treating unreviewed conversational code generation as risky. The professional form is an iterative specification → generation → evaluation → revision workflow with independent verification and conventional software-engineering controls.

Sarkar and Drosos' empirical vibe-coding study found iterative goal-satisfaction cycles, hybrid AI/manual debugging, dynamic trust, and a continuing need for programming expertise shifted toward context management and rapid evaluation. A 2026 multivocal review of 47 sources reports short-term productivity/time-to-prototype gains in 21 sources, but substantially weaker evidence for production use, long-term maintainability, data-intensive work, and safeguard effectiveness.

PatchTrack's analysis of 338 pull requests found full adoption of ChatGPT-generated patches uncommon; the median integration rate was 25%, with developers selectively extracting and refining generated work. This supports treating model output as draft material rather than authoritative implementation.

Security evidence is material. An empirical study of AI coding assistants found security weaknesses in 29.5% of sampled Python and 24.2% of sampled JavaScript Copilot-generated snippets across 43 CWE categories. A systematic review likewise identifies security as a persistent LLM code-generation problem. OWASP's Secure Coding with AI guidance recommends verifying AI-suggested dependencies, auditing versions/vulnerabilities, constraining agent permissions, and applying normal secure-development controls.

Evidence on quality is mixed rather than uniformly negative. GitHub reports a randomized controlled study of 202 experienced developers where Copilot-assisted code performed better on its measured functionality/readability/maintainability criteria. Conversely, large observational GitClear data reports increased churn and copy/paste patterns correlated with the AI-coding era. These study designs measure different things and should not be collapsed into a single claim. The practical conclusion is to measure quality in the actual repository.

ChatGPT-specific refactoring evidence is encouraging for bounded transformations: one empirical study reported behavior preservation in 311/320 Java refactoring trials. It explicitly does not justify autonomous broad refactoring without verification. Another study documents non-determinism across 829 code-generation problems, reinforcing reproducible tests and deterministic repository checks.

## Professionalization principles derived from the evidence
1. Treat generated code as a candidate patch, not a finished artifact.
2. Make intent and invariants explicit before generation.
3. Keep patches narrow enough for meaningful review.
4. Characterize behavior before refactoring AI-grown code.
5. Separate structural cleanup from behavioral change.
6. Use compiler/type system, tests, static analysis, security scanning, dependency audit, performance budgets, and release checks as independent evidence.
7. Prefer explicit contracts and bounded operations over clever heuristics.
8. Audit negative paths and false positives, not only demonstrations that succeed.
9. Verify every dependency and network integration independently of model claims.
10. Maintain a human-readable architecture and decision trail so future agents do not reconstruct intent by guessing.
11. Measure repository-specific maintainability rather than assuming either AI benefit or AI harm.
12. Preserve uncertainty: probabilistic product/merchant inference must not be worded as established fact.

## DropShredder audit — current branch
### Strong
- TypeScript strict mode plus `noUncheckedIndexedAccess`.
- Small runtime dependency surface; current package manifest is dev-tool focused.
- Layered `src/` domains separate analysis, forensics, extraction, intelligence, reputation, security, storage, settings and reporting.
- Existing unit/negative tests cover many evidence domains.
- Dedicated data, security, performance and release audits.
- CI and CodeQL pass on head `a146d81f`.
- Local-first/privacy constraints and evidence-policy rules are documented.
- Bounded page text/image/script/card/review collection is visible in the side-panel scan path.

### Findings
**P0 release policy**
- `src/reputation/trustpilot.ts` performs direct Trustpilot HTML fetching/parsing. This was already identified as a release blocker. Remove/disable the automated scrape unless a supported terms-compatible integration is established.

**P1 architecture**
- `entrypoints/sidepanel/main.ts` is ~48 KB and combines DOM binding, settings, active-tab extraction, analysis orchestration, remote/secondary-page work, rendering, deep-hunt actions, policy checks, fulfillment checks and permission management. Decompose only after characterization coverage is in place.
- Embedded `chrome.scripting.executeScript` functions contain substantial extraction logic that is difficult to unit test independently. Move pure parsing/classification portions behind typed modules where practical, leaving page-context acquisition thin.

**P1 reliability**
- Numerous empty `catch {}` blocks intentionally make optional/local operations non-fatal, but they also erase diagnosability. Classify failures: expected best-effort failures may remain suppressed only with a documented reason; unexpected failures need bounded local status/debug reporting that stores no sensitive page data.
- Regex/heuristic thresholds and text caps should remain centralized/documented where they affect evidence interpretation or performance.

**P1 testing**
- Add characterization tests around side-panel orchestration boundaries before decomposition.
- Add browser-level smoke tests for permissions, sensitive-page refusal, scan/render flow, and optional-access revocation. Unit tests alone cannot prove MV3/browser integration.

**P2 maintainability**
- Keep static intelligence registries schema-driven and linted. Do not split them solely to satisfy source-file size aesthetics.
- Continue consolidating domain vocabulary: merchant jurisdiction, manufacture origin, fulfillment origin, return jurisdiction, and ship-from must remain semantically distinct.

## Remediation sequence
1. Remove/replace release-blocking unsupported scraping.
2. Add structural-professionalism audit to CI.
3. Add characterization seams/tests around side-panel behavior.
4. Extract page acquisition, scan orchestration, rendering, and action handlers incrementally with no behavior changes.
5. Add browser smoke-test harness.
6. Re-run typecheck, unit tests, data lint, security audit, performance audit, build, release audit, CodeQL and manual Web Store smoke review.

## Sources
- Sarkar & Drosos, *Vibe coding: programming through conversation with artificial intelligence*, PPIG 2025 / arXiv 2506.23253.
- Siddeeq et al., *Vibe Coding in Software Development: A Multivocal Literature Review*, arXiv 2607.21652.
- PatchTrack, *A comprehensive analysis of ChatGPT's influence on pull request outcomes*, Empirical Software Engineering, 2026.
- Yetiştiren et al., *Evaluating the Code Quality of AI-Assisted Code Generation Tools*, arXiv 2304.10778.
- Fu et al., *Security Weaknesses of Copilot-Generated Code in GitHub Projects*, arXiv 2310.02059.
- *Exploring ChatGPT's code refactoring capabilities: An empirical study*, Expert Systems with Applications, 2024.
- *An Empirical Study of the Non-Determinism of ChatGPT in Code Generation*, ACM TOSEM.
- OWASP, *Secure Coding with AI Cheat Sheet*.
- NIST SP 800-218, *Secure Software Development Framework (SSDF) v1.1*.
- GitHub, *Does GitHub Copilot improve code quality?*
- GitClear, *Coding on Copilot: Data Suggests Downward Pressure on Code Quality*.
