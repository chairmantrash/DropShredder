"""Verify and stage the already tested repaired CI ZIP. Never build runtime."""
import hashlib
import io
import json
from pathlib import Path
import shutil
import sys
import zipfile

root=Path(__file__).resolve().parents[2]
wrapper=Path(sys.argv[1]).read_bytes()
assert hashlib.sha256(wrapper).hexdigest()=="fded1f6a0e52674786a110b1512c3896c72931fd384afcb583c9860f8a5a6d7b"
with zipfile.ZipFile(io.BytesIO(wrapper)) as archive:
    assert archive.namelist()==["dropshredder-0.2.0-chrome.zip"]
    payload=archive.read(archive.namelist()[0])
assert len(payload)==25_849_036
assert hashlib.sha256(payload).hexdigest()=="cf6e3a162cd30b5c4f7fa7aefd64707b569d8ea80d44f4582c912ef19bfc20c7"
build=json.loads((root/"tools/browser-smoke/candidate-build-info.json").read_text())
assert build["sourceCommit"]=="a345e6cc58571f8aac979dd311b2ec62954824d3"
assert build["sourceTree"]=="25d9fb2daa8d6f135f4e5f2629d3b88ee9abf249"
expected={e["path"]:e for e in build["buildFiles"]}
assert len(expected)==51 and sum(e["bytes"] for e in expected.values())==54_941_386
output=root/".output/chrome-mv3"
with zipfile.ZipFile(io.BytesIO(payload)) as archive:
    assert len(archive.namelist())==51 and set(archive.namelist())==set(expected)
    for name in archive.namelist():
        data=archive.read(name);assert len(data)==expected[name]["bytes"]
        assert hashlib.sha256(data).hexdigest()==expected[name]["sha256"]
        assert (output/name).resolve().is_relative_to(output.resolve())
    if output.exists():shutil.rmtree(output)
    archive.extractall(output)
print(json.dumps({"sourceCommit":build["sourceCommit"],"files":51,"zipSha256":hashlib.sha256(payload).hexdigest(),"rebuilt":False}))
