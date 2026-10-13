"""Download and verify unmodified public beta2, including all 51 file hashes."""
import datetime
import hashlib
import io
import json
from pathlib import Path
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[3]
URL = "https://github.com/chairmantrash/DropShredder/releases/download/v0.2.0-beta.2/DropShredder-0.2.0-beta.2-chrome.zip"
payload = urllib.request.urlopen(URL, timeout=90).read()
assert len(payload) == 25_849_500
assert hashlib.sha256(payload).hexdigest() == "7fda25e48d7b5645140d9cda3fb4e3cd213fa659fdccfc4fecac2064955492b8"
build = json.loads((ROOT / "tools/browser-smoke/candidate-build-info.json").read_text())
assert build["sourceCommit"] == "6fe561807d6962fe51006eab99c0cf7017c2c6ee"
expected = {f["path"]: f for f in build["buildFiles"]}
assert len(expected) == 51
dest = ROOT / ".output/chrome-mv3"
assert not dest.exists(), "Never stage over another runtime"
with zipfile.ZipFile(io.BytesIO(payload)) as archive:
    assert len(archive.namelist()) == 51 and set(archive.namelist()) == set(expected)
    for name in archive.namelist():
        b = archive.read(name)
        assert len(b) == expected[name]["bytes"] and hashlib.sha256(b).hexdigest() == expected[name]["sha256"]
        p = dest / name
        assert p.resolve().is_relative_to(dest.resolve())
        p.parent.mkdir(parents=True, exist_ok=True); p.write_bytes(b)
out = ROOT / "browser-smoke-results"
out.mkdir(exist_ok=True)
(out / "public-package-verified.json").write_text(json.dumps({"verifiedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(), "url": URL, "authenticated": False, "rebuilt": False, "zipBytes": len(payload), "zipSha256": hashlib.sha256(payload).hexdigest(), "all51HashesMatch": True, "build": build}, indent=2) + "\n")
print("Unmodified public beta2 verified: all 51 files")
