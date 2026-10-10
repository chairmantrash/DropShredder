# Language kits — primary-source research, 2026-10-10

Task: DS-039. Preserve local-first operation, unchanged permission and evidence policy.

## Language selection

Seven additional UI translations: zh_CN (Simplified Chinese/Mandarin audience), hi, es, ar (Modern Standard Arabic), fr, bn, pt_BR (Brazilian Portuguese). English already exists. Selection targets total first/second-language speaker reach, not country judgments or website-content rankings. Ethnologue's 2026 index explains individual-language versus macrolanguage counting; direct page retrieval returned403, so an exact contemporary ranking/count is not asserted. Portuguese is the next broad-reach language after the six consistently leading non-English choices. Chinese script and Portuguese region variants must be explicitly disclosed, not called complete dialect coverage.

## Kit comparison and implementation decision

| Kit | Useful capabilities | DropShredder decision |
|---|---|---|
| Chrome i18n | Native offline messages, manifest/action/menu localization, locale fallback, positional placeholders, browser UI locale and bidi direction | Use bundled `_locales` JSON and English `default_locale`; no external service, dependency or permission |
| WXT @wxt-dev/i18n | Typed keys, conventional catalog workflow, standard Chrome messages support | Useful future developer ergonomics; native API suffices for current small vanilla-TS UI, avoid adding a version-coupled module |
| i18next | Rich ecosystem, interpolation with escaping by default | Useful for future override/complex plural workflows; no runtime remote backend or unescaped HTML interpolation |
| Lingui | Extraction, translation context and compile-time catalogs/macros | Useful future continuous localization; do not introduce compiler changes merely for initial packs |
| FormatJS / ICU | Locale-aware dates/numbers and grammatical plural/select forms | Use complete sentences and count-label formulations now; avoid English plural suffix concatenation. Add ICU/Intl plural forms if future copy requires grammatical inflection |
| W3C HTML bidi | `html dir`, `dir=auto` / bdi for unknown-source content; semantic lang metadata | Arabic RTL, isolate source names/URLs/IDs, logical CSS; do not infer direction from the shopping page |

## Invariants and maintenance

Translate authored interface copy at explicit boundaries, never arbitrary page content. Messages go into text nodes/attributes, never translation-derived HTML. Preserve exact URLs, identifiers, numbers, key material, raw report JSON and quoted evidence. Serialized executeScript functions cannot close over imported translators: pass already-localized copy as bounded arguments. Browser UI locale is the native single authority; supported regional variants fall back using Chrome's documented lookup order. Unknown languages fall back to English. No locale polling/DOM observer is introduced.

OCR's packaged model remains English. Localized UI does not expand OCR, language-specific detectors, marketplace adapters, or regulatory service geography. Original technical evidence annotations may remain English and must be labeled. Translations are agent-authored; native-speaker/legal-copy review is a separate acceptance item. Add parity, placeholder, unsafe-markup, untranslated-interface and RTL regression gates before claiming catalog completion.

## Sources (retrieved 2026-10-10; research references, no code/data copied)

- Chrome API/locale/fallback/placeholder: https://developer.chrome.com/docs/extensions/reference/api/i18n
- Default locale: https://developer.chrome.com/docs/extensions/reference/manifest/default-locale
- WXT kit: https://wxt.dev/i18n
- i18next interpolation security: https://www.i18next.com/translation-function/interpolation
- i18next whole-message guidance: https://www.i18next.com/principles/best-practices
- Lingui extraction/compilation: https://lingui.dev/introduction
- FormatJS ICU grammar: https://formatjs.github.io/docs/core-concepts/icu-syntax/
- W3C source isolation: https://www.w3.org/International/articles/inline-bidi-markup/index
- W3C direction: https://www.w3.org/International/questions/qa-html-dir
- Ethnologue2026 ranking methodology: https://www.ethnologue.com/insights/ethnologue200/ (direct403; indexed methodology accessible, no dataset redistribution)

## Follow-up primary-source checks and observed results

Chrome explicitly documents LANGUAGE on Linux for native locale testing; Accept-Language differs from browser UI language. DS-039 tests native getMessage/getUILanguage in fresh Linux profiles, never merely navigator.language or mocked translations. All7 resolved correctly in Chrome156; Arabic direction and enlarged-text320/420px layout passed without localization requests/host consent. Receipt records exact IDs and limitations.

USITC DICL working paper (2024), Table1, uses Ethnologue21st edition2018 data and separates native/acquired speakers. Its historical ordering differs (including Russian); it supports careful method selection, not an exact2026 ranking or treating country as language. URL: https://www.usitc.gov/sites/default/files/publications/332/working_papers/ghty_2024_dicl_language_database.pdf . No dataset imported. Unicode CLDR maintains locale data for Intl/ICU workflows: https://cldr.unicode.org/ . Use browser-provided locale formatting rather than inventing demographic/grammatical rules. Current count labels use complete messages instead of English suffix construction.
