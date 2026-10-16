#!/usr/bin/env bash
set -euo pipefail
# Release engineering ONLY. Production execution never downloads JS/WASM/models.
# Pin npm package versions and the exact Git revision of tessdata_fast.
ROOT="$(pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
npm pack --silent --pack-destination "$TMP" tesseract.js@7.0.0
npm pack --silent --pack-destination "$TMP" tesseract.js-core@7.0.0
mkdir -p "$TMP/tjs" "$TMP/core" "$ROOT/public/ocr"
tar -xf "$TMP/tesseract.js-7.0.0.tgz" -C "$TMP/tjs"
tar -xf "$TMP/tesseract.js-core-7.0.0.tgz" -C "$TMP/core"
cp "$TMP/tjs/package/dist/tesseract.min.js" "$ROOT/public/ocr/tesseract.min.js"
cp "$TMP/tjs/package/dist/worker.min.js" "$ROOT/public/ocr/worker.min.js"
for name in tesseract-core.wasm.js tesseract-core-simd.wasm.js tesseract-core-lstm.wasm.js tesseract-core-simd-lstm.wasm.js tesseract-core-relaxedsimd.wasm.js tesseract-core-relaxedsimd-lstm.wasm.js; do
  cp "$TMP/core/package/$name" "$ROOT/public/ocr/$name"
done
# WASM sidecars are not executed remotely; all variants resolve from the extension.
for name in tesseract-core.wasm tesseract-core-simd.wasm tesseract-core-lstm.wasm tesseract-core-simd-lstm.wasm tesseract-core-relaxedsimd.wasm tesseract-core-relaxedsimd-lstm.wasm; do
  cp "$TMP/core/package/$name" "$ROOT/public/ocr/$name"
done
# Chrome MV3 rejects runtime code generation, including dead webpack fallbacks.
# Replace well-identified upstream legacy-global shims with globalThis.
python3 - <<'PY'
from pathlib import Path
for filename in ('tesseract.min.js','worker.min.js'):
    path=Path('public/ocr')/filename
    text=path.read_text()
    replacements={
        'new Function("return this")()':'globalThis',
        'Function("r","regeneratorRuntime = r")(i)':'(globalThis.regeneratorRuntime=i)',
        'Function("r","regeneratorRuntime = r")(o)':'(globalThis.regeneratorRuntime=o)',
    }
    for old,new in replacements.items():
        text=text.replace(old,new)
    if 'new Function(' in text or 'Function("r","regeneratorRuntime = r")' in text:
        raise SystemExit('MV3 dynamic-function shim not removed from '+filename)
    path.write_text(text)
PY
curl --fail --silent --show-error --location --max-time 60 --retry 2 \
 "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/87416418657359cb625c412a48b6e1d6d41c29bd/eng.traineddata" \
 --output "$ROOT/public/ocr/eng.traineddata"
gzip -n -9 -f "$ROOT/public/ocr/eng.traineddata"
cp "$TMP/tjs/package/LICENSE.md" "$ROOT/public/ocr/LICENSE-TESSERACT-JS.txt"
cp "$TMP/tjs/package/dist/tesseract.min.js.LICENSE.txt" "$ROOT/public/ocr/tesseract.min.js.LICENSE.txt"
cp "$TMP/tjs/package/dist/worker.min.js.LICENSE.txt" "$ROOT/public/ocr/worker.min.js.LICENSE.txt"
if test -f "$TMP/core/package/LICENSE"; then cp "$TMP/core/package/LICENSE" "$ROOT/public/ocr/LICENSE-TESSERACT-CORE.txt"; fi
cat > "$ROOT/public/ocr/PROVENANCE.txt" <<'EOF'
DropShredder fully local, optional OCR assets
tesseract.js npm 7.0.0 — Tesseract JavaScript API and local worker
tesseract.js-core npm 7.0.0 — Emscripten WASM engines
English training data tessdata_fast SHA 87416418657359cb625c412a48b6e1d6d41c29bd
All files packaged at BUILD TIME; no CDN/remote code/model downloads at runtime.
Public package license notices and full source licenses must be retained.
Build-time modification: Tesseract JS/worker legacy dynamic-global Function shims are replaced with globalThis for MV3 CSP; OCR engine WASM is unmodified. Upstream LICENSE.md and extracted bundle license notices are retained.

DS-040: seven additional tessdata_fast models from the same pinned upstream commit (chi_sim/hin/spa/ara/fra/ben/por), each losslessly gzip-compressed with mtime=0. LANGUAGE-MODELS.json records original/package SHA-256 and lengths, retrieval and source URL. LICENSE-TESSDATA-FAST.txt retains the upstream Apache-2.0 license. Runtime selection is explicit, models are local/lazy, and non-English models run alongside English for Latin product codes. Model recognition is not proof of identity or seller wrongdoing.
EOF
find "$ROOT/public/ocr" -maxdepth 1 -type f -printf '%f\t%k KiB\n' | sort
