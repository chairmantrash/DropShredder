# DS-050 — Full-function beta test plan

Owner instruction: design the tests first, run all tests before product fixes. Initial pass is frozen to the actual public beta ZIP, not a rebuilt development package.

Subject: v0.2.0-beta.1; production `5e3dc52bc54630753cf37619225be49d42043a2d`; ZIP SHA256 `6f29e93c4cd02c9f48e4cde3f6ded408c7a822449998b6416e2c9ccd430ab74c`; 51 files / 54,941,299 bytes. Each job downloads the public release without authentication, verifies its digest and every file, and loads it in disposable real Chrome profiles. The initial pass has no product repairs, package edits or publication changes.

## Function matrix, committed before execution

| Function | Needed tests and expected behavior | Execution |
|---|---|---|
| Install, launch, defaults | Exact bytes/manifest; service worker and native panel; no required account/blanket grants, default OFF; unsupported scan refuses | R01–R04, N01, L01 |
| Permission lifecycle | Real Chrome Deny/Allow; isolated script registration; no activity before grant; revoke removes registration; restart preserves state | N05–N09, N12–N14, L02–L06 |
| Product/variant identity | Title/price/currency/GTIN/SKU/image belong to intended document; SPA/tab/window/variant changes invalidate stale results | N10–N11, N17–N20, N25, N35; M/P language cases; actual public products |
| Passive alerts and quiet pages | At most one toast on qualifying product; article/home/category/search/private surfaces stay quiet; correct originating toast action | N10, M/Q cases; actual public products and quiet pages |
| Evidence and conservative verdict | Review/price/scarcity/origin/merchant/history signals; duplicate families not independent; informational facts have zero accusation weight; UNKNOWN preserved | 405 core cases, M language groups; N56 evidence search/filter; public results and severe-stop review |
| Source/store/image/reputation searches | Actual native menus and panel chooser, destinations visible before selection, cancel sends nothing, focus/Escape work, max8 selected tabs | N19, N38-page/selection/store/image; live chooser actions |
| Return-policy action | Positive same-origin policy, non200 error, no guessed finding, bounded fetch and clear status | N53–N54; actual public policy buttons |
| Fulfillment action | Explicit origin recognized as information; missing origin stays unknown; no nationality-only risk | N55; actual public shipping buttons |
| Domain/recall/entity providers | Explicit chosen query; cancel, outage, grant/revoke and stale result guards; candidates do not alter verdict; issuer/unit scope | N21–N22, N24; genuine RDAP/CPSC/GLEIF and public-page RDAP |
| Local history, delete, retention | Actual scans create sanitized history; actual delete/reuse/full restart; natural worker stop/wake; bounded retention rules | L01–L06; history core tests. Actual180-day elapsed observation is NOT EVALUATED |
| Export and stale/private guards | Real file download, sanitized URL, raw sensitive fields excluded; no stale export or wrong-page result | N15–N18, N20; live exports |
| Local label reader | Real Linux chooser, English/all seven selected models, original Hindi/Arabic assertions, cancellation/recovery, no model/image upload | N28–N29, N34, N39, O cases. Original real-photo accuracy requires rights/transcriptions |
| Language and display | All eight catalogs, native resolution of seven non-English profiles, RTL,320/420px reflow,130% text, theme/density/reset persistence | R06/R08, locale profiles, M/P/Q and OCR cases. Modeled translated DOM is not the browser translation service |
| User lists and signatures | Preview/save/remove/version rollback, malformed local files, source/key binding, signature refusal, no silent issuer/key change | N23/N26/N27 plus user-list core cases |
| Weekly opt-in | Native ON/OFF, actual Chrome alarm appears/disappears, no immediate unauthorized fetch; due/version/tamper/expiry/revoke rules | N50 and auto-refresh core cases. No fabricated elapsed week or real publisher |
| Origin/regional utility | Reviewed eight-stage product/seller/shipment dossier, no score change; country filter/source directory, bounded map and navigation clearing | N30–N31 plus actual regional public product pages |
| Standing/litigation | Exact entity/source review, scope, pending allegations, vacatur/supersession and stale clearing; no court/BBB logo-based certainty | N32–N33 plus standing/litigation core tests; source authentication remains separate |
| Optional Brave search | Empty-key/query refusal and no request; transient key security, cancel/error/redirect/size/provider scope | N51 and optional-Brave core tests. Successful real API query needs an authorized valid key; none is invented |
| Resources/accessibility/security |32 quiet tabs,20k-element page, real scroll/frame/heap observations, exceptions/unapproved origins, malformed storage recovery, chooser keyboard and focus | N36–N39, M-large, locale groups, complete CI/CodeQL; real public metrics. Budgets/screen-reader/cross-OS acceptance not inferred |
| Chrome compatibility | Real packaged runtime in Chromium156 and official Chrome133/155; same51files | R01–R09 in three separate jobs. Native consent/OCR coverage is156, not silently attributed to133/155 |

## Live public sample

Public manufacturer/retailer/listing candidates: Noctua, Amazon, Etsy, Walmart, Arduino US/EU, Logitech, Raspberry Pi, and IKEA Canada/Mexico/France/Arabic. Public category/home pages include Arduino, IKEA Arabic and Bengali Rokomari. URLs and expectations are committed in `tools/beta/live-cases.json`; primary public pages were checked October12. No accounts, carts, purchases, private endpoints, CAPTCHA bypass or fabricated merchant truth.

For each accessible product: record actual title/identity/extraction scope/verdict/evidence, toast count and sanitized export; exercise policy, fulfillment, evidence filter, domain lookup and all four search choosers. Keep screenshots and errors. For quiet pages, test actual passive absence. Network/identity failures remain UNAVAILABLE; no calibrated precision/recall is claimed from this convenience sample.

## Collection and completion rules

Ordinary assertion failures are saved with IDs/screenshots and collection continues where setup remains valid. Each workflow suite uses a separate profile, and the job matrix has fail-fast disabled. A mount/identity/setup failure blocks dependent cases. Wrong-page attribution, sensitive capture, unsupported severe warning or serious browsing failure quarantines the affected public sequence; independent safe suites still run. Every planned case receives PASS, FAIL, UNAVAILABLE, BLOCKED or NOT EVALUATED; missing cases are never silently counted as passes.

All initial-suite outcomes and unresolved input requirements are recorded in the initial completion receipt before opening a product-fix task. Engineering controls in a real browser are labeled separately from actual public-site observations and independent acceptance. Tests requiring an actual licensed photo, real publisher/elapsed week, independent reviewer, valid optional API key, another OS or genuine browser translation service remain explicit gaps when those inputs are absent.
