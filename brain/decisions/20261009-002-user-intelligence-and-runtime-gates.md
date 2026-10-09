# User-controlled reference intelligence and runtime lifecycle

Owner authorization: “Do those things”, 2026-10-09. Scope: DS-031–034.

User intelligence is inert JSON with a strict field allowlist: up to five lists, 800 KB / 500 records each, a current and one previous version, ten publisher keys. Exact GTIN or brand/model retrieves at most twelve informational leads per scan. Manufacturer/importer/seller remain distinct source-dated claims. Lists cannot contain rules, executable code, score weights or accusations. Expired lists are excluded. License is publisher-declared and shown for review; it is not a legal rights guarantee.

Local files and explicitly requested public HTTPS feeds require preview and a separate save. Feed URLs cannot contain credentials, queries, fragments, private addresses or nonstandard ports. Downloads omit credentials/referrer and reject redirects; streamed JSON is bounded and cancellable. A saved subscription is a manual weekly-refresh bookmark/reminder, not a background scheduler. No alarms permission, passive requests, browsing-history transmission, backend or new runtime dependency.

Optional signed envelopes use Ed25519 over the exact UTF-8 `payload` string. The shopper first reviews/pins an independently obtained public key bound to one exact feed URL and key ID. No bundled publishers are trusted. The key fingerprint shown is explicitly SHA-256 of its base64url representation. Key replacement/rotation is manual, followed by a new signed preview; there is no automatic root-key discovery. Unknown keys, corruption and invalid signatures fail. No signature-derived risk weight or factual trust is granted. Persisted list metadata is normalized conservatively to unverified leads. Version floors resist feed rollback; restoring an older local version is explicit and does not lower the floor. Remove/reset is the explicit way to start a different source. This bounded design is not TUF compliance or an authenticated merchant blacklist.

Mutations are validated and serialized by the existing background-worker trusted extension-context boundary. Regular extension tabs and content scripts cannot mutate user lists via this message type. Lists, keys and previous versions are removable independently from scan history. Browser permission removal cancels outstanding provider requests.

GLEIF integration is a manual exact-LEI lookup only: format/modulus-97 validation, exact response identity, one request, no follow-up relationships, bounded JSON, no credentials or persistence. Data terms provide free access and CC0 data; the integration is unaffiliated. No entity name match merges an entity with a store or changes product risk. 404/429/errors remain unavailable. No published universal rate limit was established; there is no retry, polling or pagination. Companies House and other keyed providers remain unselected pending concrete benefit/authentication/terms validation.

RDAP now supports cancellation and page-lifecycle aborts. CPSC rechecks permission before returning candidates. Export requires a current authorized page, including document/URL, sensitive-field and product-selection/structured-metadata stamp checks. Same-URL ProductGroups can resolve a single child through explicit selected attributes; ambiguous combinations abstain. Context-menu hunts now disclose destinations in a chooser for all batch sizes. Escape closes the chooser and restores focus; page invalidation removes stale choices.

Remaining gates: hosted verification of this new candidate; full independent A01–D06; concurrent native windows/panels; representative live accuracy; authenticated real feed issuer onboarding and automated key rotation; empirical OCR/embedding/image/text matching budgets and licenses; nonstandard variant widgets outside the explicit bounded selection contract.

Primary sources reviewed:
- https://www.gleif.org/en/lei-data/gleif-api
- https://api.gleif.org/docs
- https://www.gleif.org/en/meta/lei-data-terms-of-use
- https://www.gleif.org/en/about/open-data
- https://developer.chrome.com/docs/extensions/reference/api/permissions
- https://www.cpsc.gov/s3fs-public/RecallRetrievalWebServicesProgrammersGuide20180917.pdf
- Prior retained TUF/PROV/variant/import research: brain/research/2026-10-08-RESEARCH-GAPS.md
