"""Reconcile each planned beta case with actual first-pass observations."""
import collections
import datetime
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
evidence = Path(sys.argv[1])
catalog = json.loads((ROOT / "tools/beta/test-catalog.json").read_text())
jobs = json.loads((evidence / "JOBS.json").read_text())
assert len(jobs) == 6 and all(j["status"] == "completed" for j in jobs), "Finish all suites before triage/repairs"
rows, reports, missing = [], {}, []
for suite in ["native-live", "lifecycle", "packaged", "chrome133", "chrome155", "locales"]:
    folder = evidence / suite
    report_name = "native-probe.json" if suite == "native-live" else "lifecycle-report.json" if suite == "lifecycle" else "locale-report.json" if suite == "locales" else "report.json"
    paths = list(folder.rglob(report_name))
    assert len(paths) <= 1, f"Ambiguous {suite} report"
    raw = json.loads(paths[0].read_text()) if paths else {}
    reports[suite] = raw
    expected = [c["id"] for c in catalog["native"]] if suite == "native-live" else catalog["lifecycle"] if suite == "lifecycle" else catalog["locales"] if suite == "locales" else catalog["packaged"]
    observed = {t["id"]: t for t in raw.get("tests", [])}
    assert len(observed) == len(raw.get("tests", [])), f"Duplicate IDs in {suite}"
    assert not set(observed) - set(expected), f"Unplanned IDs in {suite}"
    for case in expected:
        outcome = observed.get(case)
        if outcome is None:
            missing.append({"suite":suite,"id":case})
            outcome = {"id":case,"status":"BLOCKED","reason":raw.get("failure", "Suite setup/report unavailable; no test pass inferred")}
        rows.append({"suite":suite, **outcome})
    if suite == "native-live":
        live = {t["id"]: t for t in raw.get("betaLiveTests", [])}
        assert len(live) == len(raw.get("betaLiveTests", [])), "Duplicate live IDs"
        assert not set(live) - set(catalog["live"]), "Unexpected live IDs"
        for case in catalog["live"]:
            outcome = live.get(case)
            if outcome is None:
                missing.append({"suite":"public-sites","id":case})
                outcome = {"id":case,"status":"BLOCKED","reason":raw.get("failure", "Dependent native/live setup unavailable")}
            rows.append({"suite":"public-sites", **outcome})

counts = dict(collections.Counter(t["status"] for t in rows))
summary = {"schemaVersion":1,"task":"DS-050","phase":"INITIAL TEST PASS — BEFORE ANY PRODUCT REPAIRS",
           "status":"ALL_AVAILABLE_SUITES_FINISHED — TRIAGE_REQUIRED" if counts.get("FAIL") else "ALL_AVAILABLE_SUITES_FINISHED — INPUT_GAPS_OPEN",
           "recordedAt":datetime.datetime.now(datetime.timezone.utc).isoformat(),
           "productionSource":catalog["frozenProductionSource"],"installZipSha256":catalog["frozenZipSha256"],
           "suiteJobs":jobs,"plannedBrowserExecutions":260,"reconciledBrowserExecutions":len(rows),
           "uniqueCaseIds":len({t["id"] for t in rows}),"counts":counts,
           "perSuite":{s:dict(collections.Counter(t["status"] for t in rows if t["suite"]==s)) for s in {t["suite"] for t in rows}},
           "results":rows,"failedCases":[r for r in rows if r["status"]=="FAIL"],
           "unexecutedDependencies":missing,"externalInputCases":catalog["requiredInputCases"],
           "liveSurfaces":reports["native-live"].get("betaLiveSurfaces",[]),
           "originalBoundedSurfaces":reports["native-live"].get("liveSurfaces",[]),
           "publicProviders":reports["native-live"].get("liveProviders",[]),
           "safetyStop":reports["native-live"].get("betaSafetyStop"),
           "productionChangesDuringInitialPass":False,"publicBetaChangedDuringInitialPass":False,
           "independentAccuracyAccepted":False,
           "limits":"Real-browser controls and actual public-site observations are separate from independent truth/photo/native/legal/publisher/elapsed-time acceptance. Unavailable and blocked cases are not passes. Chrome133/155 scope is packaged runtime; expanded native/OCR is Chromium156 / Linux."}
assert summary["reconciledBrowserExecutions"] == 260
(evidence / "INITIAL-SUMMARY.json").write_text(json.dumps(summary,indent=2,ensure_ascii=False)+"\n")
print(json.dumps({k:summary[k] for k in ["status","counts","perSuite","failedCases","unexecutedDependencies"]},indent=2))
