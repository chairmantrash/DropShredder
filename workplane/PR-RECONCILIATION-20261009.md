# Release branch reconciliation — 2026-10-09

Owner directive: “Do those things.” Checked by /root using local fetched Git objects.

| PR | Branch head checked | Relationship | Disposition |
| --- | --- | --- | --- |
| 9 | `2f89ddaac2037dbeb78be5a39ae7254b68394a78` | Ancestor of PR10 and PR11 | Release-to-main proposal; retain until release gates pass |
| 10 | `0c826f9dc5c02f65760a203469bc218dd75fd9ba` | Ancestor of PR11 | Research audit is already included; no cherry-pick or duplicate merge needed |
| 11 | `2fd69e5de3fb48121a1c5d938048af669a70eaf0` | Contains both ancestors and continuation work | Current draft engineering candidate, targets release/security-performance-hardening |

Both `git merge-base --is-ancestor` checks exit 0. Later documentation commits preserve this relationship. No conflicting edits need reconciliation in this chain.

After exact candidate verification and independent release acceptance, the proposed sequence is PR11 into the release branch, then PR9 into main. PR10 becomes redundant after that first merge. Do not merge or close it based solely on this document. PR5 is an internal diagnostic draft and is excluded from the public release path; other open PRs need their own scope review.

Nothing was merged, closed, or published. Hosted engineering coverage is separate from independent A01–D06 and representative merchant/category accuracy.
