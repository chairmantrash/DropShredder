# DropShredder — second gap-closing audit, 2026-10-08

This sweep implements reviewable improvements across code, detection, UI, shopper control, customization, utility and API use on `feature/research-enhancement-audit-20261008` / draft PR #10. It preserves PR #9 and the release branch. All 215 local tests pass, including 30 new gap tests; a clean Node 22 locked install, typecheck, security/data/architecture/static Chrome audits and clean production ZIP pass. Real desktop Chrome is environment blocked: zero Chrome tests or extension-install claims.

## Layer dispositions

| Layer | Implemented and locally checked | Remaining boundary |
|---|---|---|
| Code / dependency supply chain | Full lockfile, npm ci in CI, pinned dev-only DOM harness, malformed-report guards | Existing large main/network modules; native lifecycle ownership unchanged |
| Evidence UI | Correct DIRECT badge, product identity/time, source/method disclosure, explicit missing metadata, scores /100 | Producer coverage and automatic toast/stamp wording need owning agent |
| UI design | Light/dark/system, larger base text, visible focus, narrow-width CSS, eight tested contrast pairs | Actual reflow, keyboard, screen-reader and rendered layout unverified |
| Shopper agency / control | Evidence search/severity filters with counts, no verdict changes, explicit/cancellable external lookup | Core feature-settings schema/update race remains owner task |
| Customization | Validated independent local display key; theme, spacing, text size; appearance-only reset | No risk-threshold customization or alteration of consent flags |
| Utility / privacy | Bounded allowlisted current-scan JSON export; query/token/email redaction; no download permission | HTTPS scans only; review export before sharing; not universal anonymization |
| Detection | Return/refund precision, fee negation, domain age informational, distinct origin roles, sample/provider validation, source ancestry, comparable rating scopes | Physical quality, unknown source/variant identity and empirical calibration not solved |
| API access/use | Explicit CPSC candidate search with field validation, consent/cancel, 8s/2MB caps, stale-report guards | Candidate recall retrieval is incomplete; all other new API integrations remain research only |
| Research retention | Nine API dispositions, dated primary references, live hashed probe receipts, 27-finding gap ledger | Continuous freshness/automatic signed feed and full-page archiving not implemented |
| Performance | Panel max300 rows; bounded inputs/responses; 218,929-byte clean unpacked build, 10 files | Synthetic Node work is not real Chrome large-page performance |

## Important precision corrections

A refund-processing interval no longer becomes a short return window, and ordinary contact/RMA or inspection steps stay informational. Negated or zero fees do not create fee warnings. A young domain does not prove a long-established business claim is false. Partial disclosed foreign roles do not imply the whole manufacturing chain is known.

Review provider aliases and duplicated snippets are folded. Sample counts/ratings/shares must be valid. Quality claims cannot borrow review volume from a different source. Complaint, quality and rating detectors carry common source ancestry, so one platform is not counted as several independent sources. Product ratings are scored against another source only when scope and subject ID match; unresolved or merchant-service comparisons remain informational.

These are context and evidence corrections. Manufacturing/shipment/merchant/return/payment origin can inform a shopper's stated preference, but country alone retains zero negative risk weight. No regional quality blacklist or physical-product quality inference was added.

## CPSC research and integration

Official API documentation and the published query guide were reviewed. The recall endpoint uses `RecallTitle`, `ProductName` or `UPC`; the implementation validates these exact fields and rejects empty/malformed queries, because an unknown parameter can return the full corpus.

Two actual public HTTP probes were saved as selected-field receipts with SHA-256 hashes. `ProductName=Anker` returned five records / 15,465 bytes; `RecallTitle=Anker` returned eight / 24,938 bytes. Both included Trankerloop because substring retrieval is broad. Neither returned packaged official Anker notice 25-466. Query differences and missing notices establish a coverage limit; no-results is never safety clearance.

The shopper can choose/edit a public query and field, then explicitly request Chrome host access. The helper starts permission consent in the direct click chain. Denial or cancellation while consent is pending results in no request; new report text invalidates pending lookup. One credential-free, no-referrer, no-store request has an 8-second timeout, 2 MB streaming cap, 200-record inspection cap and 12-notice display cap. Links must be official CPSC recall URLs. A model token mention is labeled unit-scope unverified. Results do not alter verdict/history and no follow-up images/contact records are requested. Permission/extension-fetch behavior is locally mocked, not Chrome verified.

## Other API findings

| API | Current disposition | Reason |
|---|---|---|
| RDAP | Existing runtime; owner follow-up | Cache permission ordering, redirects and registrable-domain attribution require validation; chronology does not prove business age |
| SaferProducts incidents | Research only, key/privacy design | Separate keyed incident endpoint; reports can contain personal details and are allegations rather than official recall findings |
| openFDA | Research only, access clarification | Authentication page says key required while also listing no-key quotas; endpoint behavior untested |
| SEC EDGAR | Research only, policy/network design | Public no-key API; official CORS and automated-access rules need an extension-specific design; entity identity required |
| GLEIF | Research only | API documentation found, direct page timed out; endpoint/auth/limits untested |
| Companies House | Research only, user-key design | Free account key and rate limits; registry identity does not establish product quality |
| FTC | Research only, scope mismatch | Listed APIs concern DNC complaints / HSR early termination, not a general merchant-enforcement feed |
| UN Comtrade | Research only | API-root 404 / terms unverified; aggregate trade cannot identify an individual listing's factory |

No key, paid backend or new passive external request was added. The public API registry now links the detailed capability audit and corrects stale FTC/openFDA eligibility assumptions.

## Verification and package

Node 22.20.0, Linux container. Clean `npm ci` installed 136 development packages and completed WXT preparation. 215/215 tests passed, zero skipped. Typecheck plus security, data, architecture, static Chrome conformance, clean build/ZIP, release and performance audits passed. Existing size-guideline warnings remain for `merchant-networks.ts` (22,420 bytes) and `main.ts` (42,941 bytes). Manifest remains Chrome 133 minimum with scripting/storage/contextMenus/sidePanel and optional HTTPS hosts; no new required permission or runtime dependency.

The package contains ten expected files; unpacked 218,929 bytes. API/export code is absent from auto/background bundles. The exact ZIP size/hash and manifest are recorded in the verification receipt. Static Chrome conformance passed but does not establish actual Chrome behavior. DOM tests validate renderer/control behavior with LinkeDOM, not layout or native downloads.

| Synthetic Node scenario | Iterations | Mean ms | p95 ms |
|---|---:|---:|---:|
| Passive rules / 100k characters | 100 | 0.179 | 0.394 |
| Source matching / 250 observations ×12 images | 50 | 2.225 | 2.972 |
| Explicit image history / 250×12×12 | 20 | 41.064 | 49.452 |
| Fusion /512 correlated signals | 100 | 0.241 | 0.860 |

Timings are sequential synthetic shared-host Node measurements after warmup. They exclude Chrome, DOM extraction, network latency and physical product accuracy; no product-level performance or speedup claim follows.

## Unclosed gaps and original engineering handoff

The new handoff `workplane/tasks/DS-GAP-RUNTIME-FOLLOWUP-20261008.md` records unvalidated core settings and overlapping saves; silently omitted POD/Reddit source tabs; RDAP cache return before permission resolution; RDAP redirect/root-domain risks; misleading domain-age button status; and full provenance/automatic-copy follow-ups. These files belong to active runtime owners and were not edited. Cache ordering is a source control-flow finding, not an observed Chrome privacy incident.

The prior handoff remains: Etsy regex routing, visible-price regex and first-Product/Offer attribution risks. Exact-product / selected-variant checks are release-critical. Full `WORK-AGENT-TEST-PROMPT.md` must run in real desktop Chrome 133+ on the exact-head package, in order, stopping at the first reproducible failure. Also validate new themes/large text/compact narrow-width rendering, focus, actual export, permission denial/cancel/revoke and stale-recall-request behavior. Representative category precision/recall and physical quality remain unmeasured.

The task remains VERIFYING pending this real Chrome gate. PR #9 is not merged, no release branch update and no extension publication occur. The owner can paste the runtime handoff into the original DropShredder continuation engineering conversation.

## Durable worker checkpoints

- `intelligence/gap-audit-20261008.json`: 27 findings with exact dispositions/files.
- `intelligence/API-CAPABILITIES-20261008.json`: nine API capability states and primary references.
- `intelligence/public-api-registry.json`: corrected current scope/access annotations.
- `brain/research/2026-10-08-CPSC-LIVE-PROBE.json` and `2026-10-08-CPSC-TITLE-PROBE.json`: minimal live receipts, hashes and limitations.
- `brain/decisions/20261008-002-client-controls-and-api-candidates.md`: durable control/privacy/evidence decisions.
- `workplane/runs/DS-FULLSTACK-GAP-AUDIT-20261008-VERIFICATION.json`: exact local checks/package/performance limits.
- Original 174-record integration matrix and 33 retained research documents remain available; catalogue retention is not promotion of every record to a detector.

## Primary references reviewed
- CPSC-API: https://www.cpsc.gov/Recalls/CPSC-Recalls-Application-Program-Interface-API-Information
- CPSC-GUIDE: https://www.cpsc.gov/s3fs-public/RecallRetrievalWebServicesProgrammersGuide20180917.pdf
- CHROME-PERMISSIONS: https://developer.chrome.com/docs/extensions/reference/api/permissions
- CHROME-STORAGE: https://developer.chrome.com/docs/extensions/reference/api/storage
- W3C-CONTRAST: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- W3C-REFLOW: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- NPM-CI: https://docs.npmjs.com/cli/v11/commands/npm-ci/
- LINKEDOM: https://github.com/WebReflection/linkedom
- SEC-API: https://www.sec.gov/search-filings/edgar-application-programming-interfaces
- SEC-FAIR-ACCESS: https://www.sec.gov/developer
- OPENFDA-AUTH: https://open.fda.gov/apis/authentication/
- GLEIF: https://www.gleif.org/en/lei-data/gleif-api
- COMPANIES-HOUSE-AUTH: https://developer-specs.company-information.service.gov.uk/guides/authorisation
- COMPANIES-HOUSE-LIMITS: https://developer-specs.company-information.service.gov.uk/guides/rateLimiting
- FTC: https://www.ftc.gov/developer
- SAFERPRODUCTS-FAQ: https://www.saferproducts.gov/FAQs/FrequentlyAskedQuestions11
- COMTRADE: https://comtradeplus.un.org/

## Publication and dependency advisory receipt

Implementation commit `8035b0bc6421f379c865cc0eb21453fcafcf5b42` completed [CI](https://github.com/chairmantrash/DropShredder/actions/runs/37789209943) and [CodeQL](https://github.com/chairmantrash/DropShredder/actions/runs/37789209588) successfully; unpacked/ZIP artifacts report that exact head. Node 22 `npm audit --json` returned zero reported advisories; this is the registry snapshot at review time, not a security guarantee. Metadata includes 184 development/optional graph entries (136 installed for this platform). Full normalized remote/dependency/protected-state receipt: `workplane/runs/DS-FULLSTACK-GAP-AUDIT-20261008-REMOTE-VERIFICATION.json`.
