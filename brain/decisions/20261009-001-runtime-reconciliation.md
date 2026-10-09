# Runtime correctness and local domain resolution

2026-10-09, DS-030. Owner authorized successor reconciliation.

Settings use a validating background-worker patch endpoint and serialized read/merge/write queue. Panels send changed fields, never stale whole-setting snapshots. Content-script senders cannot change settings through this endpoint. Boolean-like strings do not constitute consent.

Product selection binds JSON-LD Products/Offers to same-origin current URLs with variant query fields preserved. Recommendations, ambiguous variants/offers and unrelated aggregate ratings do not supply target identifiers/price/reviews. URL-less metadata requires a matching visible title and no unresolved variant query. This increases abstention; DOM-selected variants without URL identity remain an explicit future gap.

RDAP uses tldts 7.4.18 (MIT), pinned with its transitive tldts-core and lockfile integrity, only in explicit lookup code. This deliberately replaces the zero-runtime-dependency baseline with one justified local parser: guessing the last two hostname labels breaks co.uk and other public suffixes. No model, server, account or added required permission. Review the installed licenses in public/THIRD-PARTY-NOTICES.txt; keep build size and advisory review in verification. Private suffixes are not treated as independently registered domains.

Official IANA bootstrap downloaded 2026-10-09; publication 2026-09-30T23:00:03Z; source https://data.iana.org/rdap/dns.json. The snapshot is packaged inert JSON. It selects HTTPS registry endpoints before requesting exact-host access in the direct click call chain. Permission acceptance precedes all cache reads. Redirects are rejected, credentials omitted, responses byte/time bounded and returned domain identity checked. HTTP-only/unknown services abstain. Permission is rechecked before returning a cached or fetched result. Snapshot and PSL freshness are future controlled-update work, not silently fetched during browsing.

All source searches remain visible in an explicit chooser with at most eight selections per batch. Context-menu hunts with more than eight destinations open a local chooser with short-lived session data; no query is embedded in its URL. Remote searches require the shopper's choice. This replaces silent truncation.

Primary Chrome reference reviewed: https://developer.chrome.com/docs/extensions/reference/api/permissions?hl=en — requests must be invoked from user gestures. Local tests do not establish native Chrome activation, permissions, dialog layout or service-worker lifecycle behavior.
