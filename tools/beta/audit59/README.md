# DS-061 detection audit

Use Node22 and the repository's existing dependencies. Run `npm run prepare` in a fresh worktree before typecheck. No hosted Actions are required.

- `node tools/beta/audit59/inventory.mjs`: AST value-import inventory of all68 detection-related modules. Reachable imports overstate execution; unused imports must be inspected separately.
- `node --import tsx tools/beta/audit59/disclosure.mts OUTPUT [SOURCE_ROOT]`: 12 explicitly sourced, search-selected merchant statement cases. These were visible during development, are not blinded, and contain no representative negative sample. They do not establish fraud/dropshipping accuracy. Source URL/date and original text are retained. The original future placeholder timestamp is preserved and corrected to day precision without altering cases/labels.
- `node tools/beta/audit59/source-inventory.mjs HTML_DIRECTORY OUTPUT`: static review-widget candidates only, after receipt hash verification.
- `node --import tsx tools/beta/audit59/replay.mts SOURCE_ROOT HTML_DIRECTORY OUTPUT`: exact captured-source before/after diagnosis. Quarantines changed files. CSS/rendering, script execution, native consent, public availability and merchant accuracy are outside this replay.
- `python -m unittest discover -s tools/beta/audit59 -p 'test_*.py' -v`: evaluator denominator/leakage controls.
- `python tools/beta/audit59/evaluate.py MANIFEST OUTPUT --assert-target`: exits2 unless all listed tasks meet the provisional59% recall,95% precision,5% FPR sample gate with50 positive/50 negative unique merchant groups in holdout. Explicit unknown truth never counts as negative; unavailable positives/abstentions count as recall misses; negative abstentions are not true negatives. Merchant/lineage leakage and duplicate groups invalidate acceptance. Wilson95% intervals are descriptive, not guarantees. Proof/group fields require independent review: the script does not authenticate their claims.

`workplane/runs/DS-061/accuracy-manifest.json` deliberately labels all233 previous website cases unadjudicated development data. The correct current outcome is NOT_ACCEPTED / NOT_EVALUABLE. Neither historical allegations nor a source's absence of complaints supplies a benign ground truth label. Do not tune on a future holdout or relabel this corpus independent.
