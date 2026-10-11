# Mixed-script label OCR language order

Date: 2026-10-11
Task: DS-044, owner-directed completion of DS-040

Tesseract's primary language affects recognition even when the same models are loaded. For each explicitly selected non-English label language, initialize `eng+selected` rather than `selected+eng`. English remains a single-model selection. Keep all eight packaged models, existing file/image bounds, cancellation, local-only assets and unverified output wording. No model, WASM, permission, dependency or verdict threshold changes.

The original O-hin input is retained at `tests/fixtures/ocr/hindi-model-original.png`, SHA-256 `b0254a587f6f3b1ca6fb33c26dc1fdccc2ad9319b48d3d83401ed0442bc362dd`. It is an owned synthetic label, extracted from failed artifact 11660094927, not a shopper photo. An isolated Tesseract.js 7 / unmodified packaged core and models reproduced `hin+eng`: `उत्पाद मॉडल` and `|॥0/05। 42345`; `eng+hin`: `उत्पाद मॉडल` and `MODEL12345`. English alone retained the model code but lost the native text, so dropping the selected model does not satisfy the requirement.

Primary reference: https://tesseract-ocr.github.io/tessdoc/Command-Line-Usage.html#order-of-multiple-languages (opened 2026-10-11). The project documents language-order-dependent output; the particular DropShredder fix follows the observed failed fixture, not a universal OCR accuracy claim.

Preserve the original O-hin assertion and historical failure receipts. Add O-hin-original to the real native panel suite with both the literal Hindi phrase and Latin model code. Complete all subsequent selected models and privacy/revocation assertions on exact packaged bytes before reporting their results. Independent photographed-label and per-language accuracy remain external acceptance work.
