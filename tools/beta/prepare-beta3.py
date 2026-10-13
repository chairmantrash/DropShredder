"""Prepare previously tested beta3 bytes, not a new runtime build."""
import hashlib
import io
import json
from pathlib import Path
import shutil
import sys
import zipfile

root=Path(__file__).resolve().parents[2]
wrapper=Path(sys.argv[1]).read_bytes()
assert hashlib.sha256(wrapper).hexdigest()=="5fb1aa29d2c2b9b8ed9e8e08bae3a0b20e6f52f3c461f118305281f239c4b50e"
with zipfile.ZipFile(io.BytesIO(wrapper)) as z:
    assert z.namelist()==["dropshredder-0.2.0-chrome.zip"]
    payload=z.read(z.namelist()[0])
assert len(payload)==25_851_180
assert hashlib.sha256(payload).hexdigest()=="0f52e8f4411dc49d0a64f98f6402e1c0ee68bee13a0f60927ae3a2db7f7314b4"
build=json.loads((root/"tools/browser-smoke/candidate-build-info.json").read_text())
assert build["sourceCommit"]=="f2ea60e2ac42f6292d60dfe6069290a1758a6905"
assert build["sourceTree"]=="3cb142f0a06c4d9673e4c653272e8aba36433137"
expected={f["path"]:f for f in build["buildFiles"]}
assert len(expected)==51 and sum(f["bytes"] for f in expected.values())==54_948_488
with zipfile.ZipFile(io.BytesIO(payload)) as z:
    assert len(z.namelist())==51 and set(z.namelist())==set(expected)
    for name in z.namelist():
        b=z.read(name);assert len(b)==expected[name]["bytes"] and hashlib.sha256(b).hexdigest()==expected[name]["sha256"]
native_path=Path(sys.argv[2]);native=json.loads(native_path.read_text())
accepted="8a70b96ff030ba50c1ac83e5ae3e6d0ca18837af"
assert native["sourceCommit"]==accepted and native["packagedSourceCommit"]==build["sourceCommit"]
assert native["testsPassed"]==80 and len(native["tests"])==80
assert all(t["status"]=="PASS" for t in native["tests"]) and not native["errors"]
assert all(next(t for t in native["tests"] if t["id"]==i)["status"]=="PASS" for i in ["P01","P02","P03"])
summary=json.loads((root/"workplane/runs/DS-055-AUDIT-SUMMARY-20261013.json").read_text())
ledger=json.loads((root/"workplane/runs/DS-055-PAGE-OUTCOMES-20261013.json").read_text())
assert ledger["summary"]==summary
assert summary["manifestSha256"]=="fadccdbd22b0c367aaee2b67a2207f432e4d3eb73bc1b2cfcd0021b22cff4d98"
assert len(ledger["pages"])==259 and len({p["id"] for p in ledger["pages"]})==259
assert summary["recordedPageOutcomes"]==259 and summary["accessibleDistinctPages"]==227
assert summary["successfulExtractionMinimum150Met"] and summary["severeWarningPages"]==0
assert not summary["nativeScanRefusalCounts"]
assert len(summary["nativeProfiles"])==8
for p in summary["nativeProfiles"]:
    assert p["sourceCommit"]==accepted and p["packagedSourceCommit"]==build["sourceCommit"]
    assert p["status"]=="LIVE AUDIT COLLECTION COMPLETE" and not p["safetyStop"] and not p["uncaughtPanelErrors"]
    assert len(p["bootstrapTests"])==9 and all(t["status"]=="PASS" for t in p["bootstrapTests"])
observations={"acceptedHarnessHead":accepted,"productionSource":build["sourceCommit"],"zipSha256":hashlib.sha256(payload).hexdigest(),"all51HashesVerified":True,"nativePassed":80,"privacyRegressionIds":["P01","P02","P03"],"browser":native["browser"],"liveAudit":summary,"independentAccuracyAccepted":False,"numericalEstimatesUnknown":227,"limits":summary["limits"]}
packet=root/"beta3-packet";packet.mkdir(exist_ok=True)
name="DropShredder-0.2.0-beta.3-chrome.zip"
(packet/name).write_bytes(payload)
(packet/"BUILD-INFO.json").write_text(json.dumps(build,indent=2)+"\n")
(packet/"BETA-OBSERVATIONS.json").write_text(json.dumps(observations,indent=2)+"\n")
shutil.copyfile(native_path,packet/"NATIVE-PROTOCOL.json")
shutil.copyfile(root/"workplane/runs/DS-055-PAGE-OUTCOMES-20261013.json",packet/"LIVE-PAGE-OUTCOMES.json")
shutil.copyfile(root/"tools/beta/BETA3-INSTALL-AND-REPORT.md",packet/"INSTALL-AND-REPORT.md")
(packet/"SHA256SUMS.txt").write_text(hashlib.sha256(payload).hexdigest()+"  "+name+"\n")
assert len(list(packet.iterdir()))==7
print(json.dumps({"source":build["sourceCommit"],"zipSha256":hashlib.sha256(payload).hexdigest(),"nativePassed":80,"liveSuccessfulExtractions":227,"plannedOutcomes":259,"rebuilt":False}))
