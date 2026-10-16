"""Prepare the exact accepted beta2 CI bytes and actual native/live receipt."""
import hashlib
import io
import json
from pathlib import Path
import shutil
import sys
import zipfile

root=Path(__file__).resolve().parents[2]
wrapper=Path(sys.argv[1]).read_bytes()
assert hashlib.sha256(wrapper).hexdigest()=="3fb54316ae4b4ec9cf28ad3b3e5796e7fb5a2254f6afba4ec5cd07c8102d0824"
with zipfile.ZipFile(io.BytesIO(wrapper)) as archive:
    assert archive.namelist()==["dropshredder-0.2.0-chrome.zip"]
    payload=archive.read(archive.namelist()[0])
assert len(payload)==25_849_500
assert hashlib.sha256(payload).hexdigest()=="7fda25e48d7b5645140d9cda3fb4e3cd213fa659fdccfc4fecac2064955492b8"
build=json.loads((root/"tools/browser-smoke/candidate-build-info.json").read_text())
assert build["sourceCommit"]=="6fe561807d6962fe51006eab99c0cf7017c2c6ee"
assert build["sourceTree"]=="8074e5bbcb8c678e7eacfe397457901186f0b661"
expected={e["path"]:e for e in build["buildFiles"]}
assert len(expected)==51 and sum(e["bytes"] for e in expected.values())==54_942_638
with zipfile.ZipFile(io.BytesIO(payload)) as archive:
    assert len(archive.namelist())==51 and set(archive.namelist())==set(expected)
    for name in archive.namelist():
        data=archive.read(name)
        assert len(data)==expected[name]["bytes"] and hashlib.sha256(data).hexdigest()==expected[name]["sha256"]

native_path=Path(sys.argv[2])
native=json.loads(native_path.read_text())
assert native["sourceCommit"]=="c5326c7e7aa3deddae5cd2d2bf434fc739339e48"
assert native["packagedSourceCommit"]==build["sourceCommit"]
assert native["testsPassed"]==84 and len(native["tests"])==84
assert all(t["status"]=="PASS" for t in native["tests"])
assert not native["errors"] and not native.get("betaSafetyStop")
known=native["betaKnownTests"]
assert len(known)==24 and len({t["id"] for t in known})==24
assert all(t["status"] in ["PASS","UNAVAILABLE"] for t in known)
for id in ["KNOWN-01-detection","KNOWN-02-detection","KNOWN-05-detection","KNOWN-06-detection"]:
    assert next(t for t in known if t["id"]==id)["status"]=="PASS"
observations={
    "acceptedHarnessHead":native["sourceCommit"],"productionSource":build["sourceCommit"],
    "zipSha256":hashlib.sha256(payload).hexdigest(),"packageFiles":51,"all51HashesVerified":True,
    "nativePassed":84,"knownCounts":{s:sum(t["status"]==s for t in known) for s in ["PASS","FAIL","UNAVAILABLE"]},
    "startedAt":native["startedAt"],"finishedAt":native["finishedAt"],"browser":native["browser"],
    "knownCases":native["betaKnownSurfaces"],"knownTests":known,
    "existingBoundedPublicCases":native.get("liveSurfaces",[]),"publicProviders":native.get("liveProviders",[]),
    "limits":["Small developer-selected sample with correlated products and exposed affiliate controls; not independent accuracy acceptance",
              "Captured factory-direct disclosure is merchant-authored evidence; numerical dropship/resell estimates remain UNKNOWN",
              "Unavailable UntilGone pages are not accepted detections",
              "Original-photo/rights/disjoint labels/approved thresholds/native/legal/other-OS/real publisher/elapsed-lifecycle acceptance remains open beta work"]}
packet=root/"beta2-packet"
packet.mkdir(exist_ok=True)
name="DropShredder-0.2.0-beta.2-chrome.zip"
(packet/name).write_bytes(payload)
(packet/"BUILD-INFO.json").write_text(json.dumps(build,indent=2)+"\n")
(packet/"BETA-OBSERVATIONS.json").write_text(json.dumps(observations,indent=2,ensure_ascii=False)+"\n")
shutil.copyfile(native_path,packet/"NATIVE-PROTOCOL.json")
shutil.copyfile(root/"tools/beta/BETA2-INSTALL-AND-REPORT.md",packet/"INSTALL-AND-REPORT.md")
(packet/"SHA256SUMS.txt").write_text(hashlib.sha256(payload).hexdigest()+"  "+name+"\n")
print(json.dumps({"source":build["sourceCommit"],"zipSha256":hashlib.sha256(payload).hexdigest(),"nativePassed":84,"knownCounts":observations["knownCounts"],"rebuilt":False}))
