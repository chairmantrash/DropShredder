# Bounded Arabic OCR resolution

DS-045, October11, 2026. Original failure: headed run38179614263 at O-ara, harnessf70e80a8b50a5004097683cf01a9fe3ea1c37163. Keep artifact11716613819 and unchanged image `tests/fixtures/ocr/arabic-model-original.png`, SHA256208e18c86178bb9f58b83179b3e83971a661590ab00428b6afe4b2cd31794376.

Hindi passed, but Arabic's native line was omitted. Initial language-order suspicion was disproved: both eng+ara and ara+eng omit it at1000×240. PSM3/6/11 changes did not repair that input. Isolating the Arabic line succeeds; resizing the complete input to2000×480 with bilinear/bicubic interpolation preserves both `نموذج المنتج` and `MODEL12345` with eng+ara. Nearest-neighbor interpolation still fails. These are isolated actual Tesseract7/unchanged packaged-model observations, not real-photo accuracy.

Keep the English-first mixed-script order that repairs Hindi. Only explicitly selected Arabic OCR enlarges its bounded detector canvas by2×, with high-quality smoothing and a2048-pixel dimension cap. Native barcode/text-detector input retains its1024-pixel bound. This on-demand path stays local, supports cancellation, terminates its worker and changes no models, permissions, dependencies, passive scan or verdict. OCR output remains unverified.

Preserve original O-ara and O-hin assertions. Add a second saved-input regression with the complete literal Arabic phrase and model code, alongside the unchanged Hindi image. All later language/privacy tests must execute on the rebuilt fingerprint. The first failed run remains history; neither unit mocks nor image probes are fresh Chrome acceptance.
