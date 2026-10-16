"""Verify and stage the actual public beta bytes. No npm build."""
import importlib.util
import json
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("prepare", ROOT / "tools/beta/prepare.py")
prepare = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prepare)
payload = Path(sys.argv[1]).read_bytes()
build = json.loads((ROOT / "tools/browser-smoke/candidate-build-info.json").read_text())
files = prepare.verified_payload(payload, build)
destination = ROOT / ".output/chrome-mv3"
if destination.exists():
    shutil.rmtree(destination)
for name, data in files.items():
    target = destination / name
    assert target.resolve().is_relative_to(destination.resolve())
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
print(json.dumps({"status":"PUBLIC_BETA_BYTES_VERIFIED", "sourceCommit":prepare.SOURCE,
                  "zipSha256":prepare.ZIP_SHA, "files":len(files), "bytes":sum(map(len,files.values()))}))
