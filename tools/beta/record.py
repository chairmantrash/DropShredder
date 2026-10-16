"""Record actual bounded observations after the unchanged native protocol."""
import json
from pathlib import Path
import shutil
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from prepare import SOURCE, ZIP_NAME, ZIP_SHA, verified_payload

packet = ROOT / "beta-packet"
build = json.loads((packet / "BUILD-INFO.json").read_text())
verified_payload((packet / ZIP_NAME).read_bytes(), build)
report = json.loads((ROOT / "browser-smoke-results/native-probe.json").read_text())
assert report["packagedSourceCommit"] == SOURCE
assert report["status"] == "PASS — NATIVE RUNTIME SUBSET", report["status"]
assert report["testsPassed"] == 77 and all(t["status"] == "PASS" for t in report["tests"])
assert not report["errors"] and not report.get("failure")
assert len(report["liveSurfaces"]) == 4 and len(report["liveProviders"]) == 2
assert all(s["status"] != "BETA_STOP" for s in report["liveSurfaces"])
assert any(s["status"] == "OBSERVED_SCAN" for s in report["liveSurfaces"]), "No actual public scan observed"
receipt = {"schemaVersion": 1, "task": "DS-049", "status": "BOUNDED_BETA_PROTOCOL_COMPLETE",
           "startedAt": report["startedAt"], "finishedAt": report["finishedAt"],
           "harnessCommit": report["sourceCommit"], "productionSource": SOURCE,
           "zipSha256": ZIP_SHA, "files": 51, "bytes": 54_941_299,
           "browser": report["browser"], "os": "GitHub Actions Ubuntu 24.04 / Xvfb",
           "nativeEngineeringChecksPassed": report["testsPassed"],
           "publicProviders": report["liveProviders"], "publicSurfaces": report["liveSurfaces"],
           "stopFailures": [], "independentAccuracyAccepted": False,
           "rightsClearedCorpusCases": 0, "reviewerApprovals": 0,
           "limits": "Automated bounded public-site observations, not independent merchant truth, calibrated accuracy, original-photo review, cross-OS acceptance or elapsed-week publisher validation."}
(packet / "BETA-OBSERVATIONS.json").write_text(json.dumps(receipt, indent=2) + "\n")
shutil.copyfile(ROOT / "browser-smoke-results/native-probe.json", packet / "NATIVE-PROTOCOL.json")
print(json.dumps(receipt, indent=2))
