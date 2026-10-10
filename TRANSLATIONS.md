# Offline language packs

Seven interface translations alongside the English default:

| Chrome pack | Interface |
|---|---|
| zh_CN | 简体中文 — Simplified Chinese |
| hi | हिन्दी — Hindi |
| es | Español — Spanish |
| ar | العربية — Modern Standard Arabic, right to left |
| fr | Français — French |
| bn | বাংলা — Bengali |
| pt_BR | Português do Brasil — Brazilian Portuguese |

The interface follows Chrome's display language. Change that display language and relaunch Chrome to use the corresponding pack. Chrome chooses regional/default fallbacks; unsupported languages use English. This does not include Traditional Chinese or a separate European Portuguese pack. Native permission dialogs are translated by Chrome itself.

347 messages per pack cover interface/accessibility, consent/privacy, settings, action/status copy, local-reader controls, search chooser, extension description/action title, context menus, toast framing and report metrics/verdict-gate explanations. Native `_locales` resources resolve offline, without translation services, runtime catalog downloads, new permissions or mandatory keys.

Technical detector annotations and third-party product/source text retain their original wording, explicitly labeled. Raw reports/exports keep stable machine fields, evidence and scores. URLs, identifiers, key bytes, UPC/GTIN/LEI, seller names and source quotations are not translated. Unknown technical errors retain bounded original diagnostics after a translated explanation. The local reader offers English and the seven corresponding offline OCR models, explicitly selected by the user; non-English recognition also loads English for Latin product codes. Browser-native OCR is used for English when available; selected non-English models always invoke the packaged engine. OCR output stays unverified.

DS-040 extends merchant-page detection separately from UI translation: localized commerce controls/paths/privacy exclusions, script-aware title/review matching, original-span evidence, regional visible price parsing, selected variants, Gregorian review dates and scoped rule vocabulary. Strict JSON-LD prices remain locale-neutral. Finite phrase support is not universal translation or a calibrated guarantee of equal accuracy on every storefront. APIs/marketplace geographic coverage do not expand automatically. See MULTILINGUAL-DETECTION.md.

## Maintenance

- Edit `public/_locales/<locale>/messages.json`. English descriptions preserve context; keep native placeholder mappings and occurrences. `locale_code` remains the resolved packaged locale.
- Use `tr('Whole English message: $1',value)` from `src/i18n/index.ts` with textContent. Never translation-derived HTML or English plural suffixes. Arabic values are isolated; original evidence nodes use dir=auto.
- Static documents translate once at startup. This walker is for owned extension documents only, never merchant pages. Content scripts translate their explicit UI labels without walking merchant content.
- Serialized executeScript callbacks cannot close over imported helpers. Pass prelocalized copy and direction as bounded arguments.
- `npm run audit:localization` checks parity, stable keys/collisions, placeholders, static UI and authored calls. `npm test` checks value invariance, fallbacks, text-only rendering, Arabic isolation and report immutability. CI runs both.
- `tools/browser-smoke/locales.mjs` checks native Chrome resolution in fresh profiles, metadata, UI/ARIA, local refusal, search expiry, reflow and no host grants/network requests. It renders the real panel document in a tab; native side-panel acceptance is a separate English suite.

Translations are agent-authored, without independent native-speaker/legal-copy review. That review and localized UI/native-permission acceptance in every Chrome display language remain separate release items. Merchant-language native-panel parity tests use an English Chrome profile to distinguish UI language from page language; the separate seven-profile suite checks localized UI resolution. Exact build/browser results: DS-039 task/run receipts. Kit/source comparison: brain/research/2026-10-10-LANGUAGE-KITS.md. Selection targets broad total-speaker reach; exact2026 demographic ranking is not asserted where source retrieval was blocked.
