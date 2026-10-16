"""Offline historical comparison; does not call models or import runtime labels."""
import collections
import hashlib
import json
from pathlib import Path
import sys
import urllib.parse

root=Path(__file__).resolve().parents[2]
sources=root/"workplane/runs/DS-055-SCAMFERRET-SOURCE-RECEIPT-20261013.json"
audit=Path(sys.argv[1]) if len(sys.argv)>1 else root/"workplane/runs/DS-054-PAGE-OUTCOMES-20261013.json"
source=json.loads(sources.read_text());pages=json.loads(audit.read_text())["pages"]
def host(value):return (urllib.parse.urlsplit(value).hostname or "").removeprefix("www.").lower()
def page_key(value):
    u=urllib.parse.urlsplit(value)
    query=sorted((k,v) for k,v in urllib.parse.parse_qsl(u.query) if not k.startswith('utm_') and k not in ['gclid','fbclid'])
    return host(value),urllib.parse.unquote(u.path).rstrip('/') or '/',tuple(query)
records=[]
for s in source["records"]:
    record=s["record"];url=record["target_url"];matched=[p for p in pages if host(p.get("finalUrl") or p["url"])==host(url)]
    same=[p["id"] for p in matched if page_key(p.get("finalUrl") or p["url"])==page_key(url)]
    classification=s.get("parsedClassification")
    if classification:prediction="SCAM" if classification["scam"] else "NON_SCAM"
    else:prediction="INVALID_MACHINE_READABLE_OUTPUT"
    records.append({"sourceUrl":s["sourceUrl"],"sourceSha256":s["sha256"],"historicalTarget":url,"historicalDate":record.get("start_time"),"model":record.get("analysis_llm"),"historicalPrediction":prediction,"sameResourcePathCaseIds":same,"sameHostCaseIds":[p["id"] for p in matched],"historicalCostUsd":record.get("total_cost"),"historicalElapsedSeconds":record.get("execution_time_seconds"),"currentCaseStatuses":dict(collections.Counter(p["status"] for p in matched)),"scope":"Historical LLM conclusion; same-host/path match does not establish current content, truth, licensing or independent operator identity"})
result={"sourceCommit":source["sourceCommit"],"auditSha256":hashlib.sha256(audit.read_bytes()).hexdigest(),"historicalOutputCounts":dict(collections.Counter(r["historicalPrediction"] for r in records)),"sourceOutputFiles":len(records),"sourceHostnames":len({host(r["historicalTarget"]) for r in records}),"outputsWithSameResourcePath":sum(bool(r["sameResourcePathCaseIds"]) for r in records),"records":records,"currentAccuracyAccepted":False}
dest=Path(sys.argv[2]) if len(sys.argv)>2 else root/"workplane/runs/DS-055-SCAMFERRET-COMPARISON-20261013.json";dest.write_text(json.dumps(result,indent=2)+"\n")
print(json.dumps({k:v for k,v in result.items() if k!='records'},indent=2))
