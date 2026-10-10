# Chrome Web Store privacy submission worksheet
Prepared October 9,2026 for 0.2.0 / DS-038. Ready for account operator review; not submitted or Google-approved. Official guidance: https://developer.chrome.com/docs/webstore/cws-dashboard-privacy and https://developer.chrome.com/docs/webstore/user_data . Local-only processing is still data handling.

## Single purpose (paste-ready)
Help shoppers investigate public product listings and seller claims with locally computed, source-linked evidence and explicitly chosen public research tools.

## Permission justifications (paste-ready)
- scripting: Extract bounded product data after a manual action and register an isolated local detector only after automatic-alert opt-in/host consent. Sensitive routes/fields refuse scans.
- storage: Save local preferences, bounded investigation history, public lookup caches and user-reviewed reference lists/public signing keys; never persist the optional search API key.
- contextMenus: Let the shopper explicitly investigate the current product, image or store through a shortcut.
- sidePanel: Display the shopper's local evidence, controls and chosen research results in Chrome's native side panel.
- alarms: Wake the extension worker for opt-in weekly refresh of previously authorized signed reference subscriptions, throttled to seven days per source. No page crawling or new permission prompt.
- optional https://*/*: Ask Chrome for selected scan/image/public API/feed origins. Broad HTTPS access is requested only for optional automatic product detection/neutral marketplace links. No required all-sites grant; revocation controls stop eligible features.

## Remote code
Select “No, I am not using remote code.” JavaScript, Tesseract worker, WASM and English/Chinese/Hindi/Spanish/Arabic/French/Bengali/Portuguese OCR data are packaged. Model originals are acquired from immutable, SHA-256-checked sources only when building; selected label reading makes no runtime model request. Optional remote JSON is inert reference data, not instructions/JavaScript. wasm-unsafe-eval permits packaged WASM compilation, not downloaded JS. Do not call lazy packaged assets remote code.

## Data categories — conservative disclosure draft
The live Dashboard wording is the final form authority. Use the following complete handling map; do not select a blanket “no data handling” solely because the developer receives nothing.

| Category | Handling to disclose |
|---|---|
| Website content | Public selected product metadata/text/images/reviews/policies are processed locally; bounded evidence saved locally; optional user-picked label photos read temporarily. No raw photo/HTML export or developer upload. |
| Web history / browsing activity | Current listing URL/domain plus minimized local scan chronology; no chrome.history API or whole-browser history access. URL queries/fragments are removed before persistence/export. Optional requested domains/queries are sent to selected services. |
| Authentication information | Only the voluntarily entered optional Brave provider token is handled transiently and sent via HTTPS to Brave for the chosen request. Never read store passwords/cookies, persist/export/log the token, or claim that processing this token does not count merely because it is temporary. |
| Personally identifiable information | Public merchant contact/business text can include names/addresses and is processed in selected public-page forensics; no shopper identity/account enrollment, private form collection or developer upload. Exact user-entered LEI may be sent to GLEIF. Disclose scope conservatively if the Dashboard asks about any such handling. |
| User activity | Feature selections/queries and local settings are used to perform chosen operations; no keystroke/interaction telemetry or behavior profile. Clarify local operational use if this category's live wording includes it. |
| Financial/payment information | Public product prices are analyzed; no card, bank, payment form/account information collected. Product price is website content, not payment credentials. |
| Health / personal communications / location | No dedicated collection. Arbitrary user photos/queries can contain user-chosen content; avoid claims that file contents can be semantically guaranteed free of personal data. No geolocation API or precise-location tracking. |

## Use certifications (paste-ready descriptions)
No sale of data. No advertising, credit decisions or data brokerage. Data handling is limited to this single purpose; no unrelated transfers. The developer has no hosted copy or human access to local histories through the consumer extension.

Third-party lookups necessarily reveal the chosen public query/resource and connection IP to the provider. Opening a provider search page may use its own logged-in session/cookies under its policy; DropShredder does not read those cookies. User-enabled signed reference refresh can run on its weekly schedule; all other deep lookups are explicit. Optional Brave can require a provider plan; all standard features remain free without a key/account.

## Policy/support URLs
Current release-branch policy for pre-release review:
https://github.com/chairmantrash/DropShredder/blob/release/security-performance-hardening/PRIVACY.md

After accepted main merge, verify public accessibility of:
https://github.com/chairmantrash/DropShredder/blob/main/PRIVACY.md
https://github.com/chairmantrash/DropShredder

Do not put an unverified/broken final URL into the dashboard. SECURITY.md governs security reports; ordinary support is the repository issue channel. No invented support email.

