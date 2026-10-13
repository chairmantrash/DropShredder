"""Stage the existing DS-055 CI ZIP; no rebuilt or source-mutated runtime."""
import hashlib
import io
import json
from pathlib import Path
import sys
import zipfile

ROOT=Path(__file__).resolve().parents[3]
wrapper=Path(sys.argv[1]).read_bytes()
assert hashlib.sha256(wrapper).hexdigest()=="5fb1aa29d2c2b9b8ed9e8e08bae3a0b20e6f52f3c461f118305281f239c4b50e"
with zipfile.ZipFile(io.BytesIO(wrapper)) as z:
    assert z.namelist()==["dropshredder-0.2.0-chrome.zip"]
    payload=z.read(z.namelist()[0])
assert len(payload)==25_851_180
assert hashlib.sha256(payload).hexdigest()=="0f52e8f4411dc49d0a64f98f6402e1c0ee68bee13a0f60927ae3a2db7f7314b4"
build=json.loads((ROOT/"tools/browser-smoke/candidate-build-info.json").read_text())
assert build["sourceCommit"]=="f2ea60e2ac42f6292d60dfe6069290a1758a6905"
assert build["sourceTree"]=="3cb142f0a06c4d9673e4c653272e8aba36433137"
expected={f["path"]:f for f in build["buildFiles"]}
assert len(expected)==51 and sum(f["bytes"] for f in expected.values())==54_948_488
dest=ROOT/".output/chrome-mv3"
assert not dest.exists(),"Stage into a clean owned checkout"
with zipfile.ZipFile(io.BytesIO(payload)) as z:
    assert len(z.namelist())==51 and set(z.namelist())==set(expected)
    for n in z.namelist():
        b=z.read(n);assert len(b)==expected[n]["bytes"] and hashlib.sha256(b).hexdigest()==expected[n]["sha256"]
        p=dest/n;assert p.resolve().is_relative_to(dest.resolve());p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
out=ROOT/"browser-smoke-results";out.mkdir(exist_ok=True)
(out/"candidate-package-verified.json").write_text(json.dumps({"sourceCommit":build["sourceCommit"],"zipSha256":hashlib.sha256(payload).hexdigest(),"all51HashesMatch":True,"rebuilt":False,"artifact":11794980740},indent=2)+"\n")
print("Exact repaired CI package staged; all51 hashes match; no build")
