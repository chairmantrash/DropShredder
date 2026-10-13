# DS-054: 150-page live capability audit

User request: test at least 150 known dropshipping/scam pages after the earlier four-page sample. This protocol and the source pool are committed before extension execution. The published beta2 detector remains unchanged until every selected page has an outcome.

## Identity and selection

- Install the actual public `v0.2.0-beta.2` ZIP. Require SHA256 `7fda25e48d7b5645140d9cda3fb4e3cd213fa659fdccfc4fecac2064955492b8`, 25,849,500 bytes and all 51 hashes in candidate-build-info.json. No runtime build or source-list import.
- Original ScamFerret shopping datasets only: ten language/category files pinned to source commit `8cf8dc631edafe584141e2f95f0c0f51855fb7bc`. Preserve GPL source attribution/license. Source labels are historical shopping-scam labels, not current independently authenticated fraud or dropshipping labels. The source was mentioned in earlier project research; flag development exposure.
- SHA256(source URL) ordering is fixed before results. Four discovery partitions inspect every seed, retaining errors. Request only public HTML and observed same-host/www product links. At most five observed product URLs per host; a public commerce homepage may be retained if it exposes no product links. No invented product paths.
- Discovery is availability/URL selection, not detector testing. Its complete target manifest is written and hashed before dependent native-browser jobs start. Test every manifest target, distributed by merchant hash across eight shards so same-merchant history stays together. Selection/replacement never depends on the detector verdict.
- Completion means at least 150 distinct, accessible, currently observed public commerce pages actually scanned through the installed native extension. Deduplicate final origin/path/query; inaccessible/challenge/parked/private pages, duplicate redirects, fixtures and separate assertions do not count. If below 150, replenish from recorded reserves or a separately frozen source-backed supplemental pool. Never lower the denominator silently.

## Per-page tests, before repairs

1. Navigate the actual public page; preserve time, HTTP status, final URL, title, language, visible commerce identity, challenge/private/parked status and HTML digest. No login, checkout, purchase, form submission or consent bypass.
2. Observe automatic protection, then use the genuine native CHECK THIS PRODUCT control after genuine Chrome Deny/Allow setup. Record report attribution, extracted product/price/SKU, full evidence, supply-chain claims, evidence tiers, numeric estimates and UNKNOWN. A completed scan is execution coverage, not a correct detection.
3. Use the native policy and shipping controls. Require a new settled status after each action and preserve the resulting report. Record timeout/refusal/errors separately; don't read an old status as success.
4. Check report document identity after every action. Quarantine an affected target/profile on wrong-document/private scanning or a severe warning requiring evidence review. Preserve the original failure and finish independent safe shards. A severe gate firing is not independently accepted fraud truth.
5. Preserve zero-weight platform/geography/fulfillment context. Separate informational findings, positive-weight merchant/deception/security evidence, severe warnings, UNKNOWN and numeric scores. Source disagreement is a candidate miss, not a calibrated false-negative rate.

## Evidence and limits

Use disposable genuine headed Chromium/Xvfb profiles and actual desktop panel input. Bootstrap tests have no successful fixture scan, imported reference lists or synthetic provider responses before the live audit. Disable provider interception before public testing. Native JSON reports are read observations, not injected verdicts. Preserve cumulative local-history order within each shard. Do not upload merchant HTML/images to third-party analysis services.

Record raw per-page outcomes, manifests, package verification, runner hashes, job identities, timestamps and screenshots of representative pages and failures. Analyze only after all planned outcomes are collected. No production repair, main merge, Store submission, publisher login, unsolicited invitation or invented tester. Beta remains open. This audit does not establish merchant/operator/product disjointness, rights-cleared independent acceptance, delivery outcomes, calibrated accuracy or elapsed lifecycle acceptance.
