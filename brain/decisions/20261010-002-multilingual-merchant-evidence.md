# Multilingual commerce matching and evidence boundaries
Decision: 2026-10-10, DS-040, owner-directed extension of DS-039.

Separate UI locale from merchant language. Use a finite offline vocabulary with original-span mapping, script-aware native segmentation, Gregorian date aliases and locale-aware display numbers. Keep strict schema price/identifier semantics. Pass serializable kit data to the isolated self-contained scanner and allowlisted selection stamps. Preserve merchant quotes, model/brand/key values and original schema title on modeled translated pages; no backend or remote translator.

Seven pinned Apache-2.0 tessdata_fast models fit the current60MiB package ceiling and are lazy/user-selected, alongside English for Latin codes. No permanent host permissions or score/gate/geography changes. Synthetic labels prove invocation only. Native Chrome fixture parity and independent native-speaker/category/photo accuracy are separate evidence levels. Public release remains gated.

Build recovery: source intelligence/ocr-models.json pins original SHA-256/length/license/commit. scripts/package-ocr-models.mjs uses existing Node libraries and generates ignored public model/gzip metadata during npm prepare/prebuild. Cached models must decompress to exactly the pinned bytes; fetches reject redirects, cap streams and expire after30seconds. Actual package hashes are fingerprinted from the built output. No model is fetched by the extension at runtime. This avoids relying on a disconnected scratch environment or connector binary-content limits.
