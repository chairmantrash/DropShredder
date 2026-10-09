#!/usr/bin/env bash
set -euo pipefail
# Release engineering ONLY. Production execution never downloads JS/WASM/models.
# Pin npm package versions and the exact Git revision of tessdata_fast.
ROOT="$(pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
npm pack --silent --pack-destination "$TMP" tesseract.js@7.0.0
npm pack --silent --pack-destination "$TMP" tesseract.js-core@6.1.2
mkdir -p "$TMP/tjs" "$TMP/core" "$ROOT/public/ocr"
tar -xf "$TMP/tesseract.js-7.0.0.tgz" -C "$TMP/tjs"
tar -xf "$TMP/tesseract.js-core-6.1.2.tgz" -C "$TMP/core"
cp "$TMP/tjs/package/dist/tesseract.min.js" "$ROOT/public/ocr/tesseract.min.js"
cp "$TMP/tjs/package/dist/worker.min.js" "$ROOT/public/ocr/worker.min.js"
for name in tesseract-core.wasm.js tesseract-core-simd.wasm.js tesseract-core-lstm.wasm.js tesseract-core-simd-lstm.wasm.js; do
  cp "$TMP/core/package/$name" "$ROOT/public/ocr/$name"
done
# WASM sidecars are not executed remotely; all variants resolve from the extension.
for name in tesseract-core.wasm tesseract-core-simd.wasm tesseract-core-lstm.wasm tesseract-core-simd-lstm.wasm; do
  cp "$TMP/core/package/$name" "$ROOT/public/ocr/$name"
done
curl --fail --silent --show-error --location --max-time 60 --retry 2 \
 "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/87416418657359cb625c412a48b6e1d6d41c29bd/eng.traineddata" \
 --output "$ROOT/public/ocr/eng.traineddata"
gzip -n -9 -f "$ROOT/public/ocr/eng.traineddata"
if test -f "$TMP/tjs/package/LICENSE"; then cp "$TMP/tjs/package/LICENSE" "$ROOT/public/ocr/LICENSE-TESSERACT-JS.txt"; fi
if test -f "$TMP/core/package/LICENSE"; then cp "$TMP/core/package/LICENSE" "$ROOT/public/ocr/LICENSE-TESSERACT-CORE.txt"; fi
cat > "$ROOT/public/ocr/PROVENANCE.txt" <<'EOF'
DropShredder fully local, optional OCR assets
tesseract.js npm 7.0.0 — Tesseract JavaScript API and local worker
tesseract.js-core npm 6.1.2 — Emscripten WASM engines
English training data tessdata_fast SHA 87416418657359cb625c412a48b6e1d6d41c29bd
All files packaged at BUILD TIME; no CDN/remote code/model downloads at runtime.
Public package license notices and full source licenses must be retained.
EOF
find "$ROOT/public/ocr" -maxdepth 1 -type f -printf '%f\t%k KiB\n' | sort
