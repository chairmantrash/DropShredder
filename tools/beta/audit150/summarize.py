"""Summarize actual native observations; never convert script PASS to accuracy."""
import collections
import hashlib
import json
from pathlib import Path
import sys
import urllib.parse

evidence = Path(sys.argv[1])
root = Path(__file__).resolve().parents[3]
manifests = list(evidence.glob("native-*/frozen-targets.json"))
assert manifests
manifest_bytes = manifests[0].read_bytes()
assert all(p.read_bytes() == manifest_bytes for p in manifests)
manifest = json.loads(manifest_bytes)
rows = []; profiles = []
for p in sorted(evidence.glob("native-*/browser-smoke-results/native-probe.json")):
    probe = json.loads(p.read_text()); audit = probe.get("audit150", {})
    profiles.append({"path": str(p.relative_to(evidence)), "sha256": hashlib.sha256(p.read_bytes()).hexdigest(), "sourceCommit": probe["sourceCommit"], "packagedSourceCommit": probe.get("packagedSourceCommit"), "bootstrapTests": [{"id": t["id"], "status": t["status"]} for t in probe["tests"]], "startedAt": probe["startedAt"], "finishedAt": probe["finishedAt"], "browser": probe.get("browser"), "status": probe["status"], "failure": probe.get("failure"), "uncaughtPanelErrors": probe["errors"], "shard": audit.get("shard"), "planned": audit.get("planned"), "safetyStop": audit.get("safetyStop")})
    rows.extend(audit.get("rows", []))
assert len({r["id"] for r in rows}) == len(rows), "Duplicate planned case IDs"
missing = [t for t in manifest["targets"] if t["id"] not in {r["id"] for r in rows}]
for target in missing: rows.append({**target, "status": "BLOCKED_PROFILE_BOOTSTRAP", "reason": "No recorded page outcome in raw native report"})
rows.sort(key=lambda r: r["id"])

def key(url):
    u = urllib.parse.urlsplit(url)
    return (u.scheme, u.netloc, u.path, u.query)

observed = [r for r in rows if r["status"] in ["OBSERVED_SCAN", "SEVERE_WARNING_QUARANTINED"] and r.get("commerceIdentityConfirmed") and r.get("scanReport")]
attempted = [r for r in rows if r.get("nativeScanAttemptedAt") and r.get("commerceIdentityConfirmed")]
attempted_unique = {key(r["finalUrl"]): r for r in attempted}
seen = set(); unique = []; duplicate = []
for row in observed:
    k = key(row["finalUrl"])
    if k in seen: duplicate.append(row["id"])
    else: unique.append(row); seen.add(k)

def data(row): return row.get("finalReport") or row["scanReport"]
positive = [r for r in unique if any(e.get("weight", 0) > 0 for e in data(r)["evidence"])]
no_positive = [r for r in unique if r not in positive]
numeric_unknown = [r for r in unique if data(r)["verdict"]["dropshipLikelihood"] is None and data(r)["verdict"]["massResellLikelihood"] is None]
actions = collections.Counter((a["action"], a["status"]) for r in rows for a in r.get("actions", []))
signals = collections.Counter(e["id"] for r in unique for e in data(r)["evidence"])
positive_signals = collections.Counter(e["id"] for r in unique for e in data(r)["evidence"] if e.get("weight", 0) > 0)
risks = {field: dict(collections.Counter(data(r)["verdict"][field] for r in unique)) for field in ["merchantRisk", "deceptionRisk", "manipulationRisk", "fulfillmentRisk"]}
summary = {"protocol": "DS-054", "requiredAccessibleDistinctPages": 150, "manifestSha256": hashlib.sha256(manifest_bytes).hexdigest(), "plannedPages": len(rows), "recordedPageOutcomes": len(rows)-len(missing), "nativeProfiles": profiles, "rowStatusCounts": dict(collections.Counter(r["status"] for r in rows)), "accessibleScansBeforeDeduplication": len(observed), "duplicateFinalPages": duplicate, "accessibleDistinctPages": len(unique), "distinctHostnames": len({urllib.parse.urlsplit(r["finalUrl"]).hostname.removeprefix("www.") for r in unique}), "minimum150Met": len(unique) >= 150 and not missing, "positiveWeightEvidencePages": len(positive), "noPositiveWeightEvidencePages": len(no_positive), "bothNumericalEstimatesUnknownPages": len(numeric_unknown), "severeWarningPages": sum(data(r)["verdict"]["severeWarningAllowed"] for r in unique), "riskDistributions": risks, "positiveSignalCounts": dict(positive_signals), "allSignalCounts": dict(signals), "languageCounts": dict(collections.Counter(r.get("pageIdentity", {}).get("language", "") for r in unique)), "actionCounts": [{"action": a, "status": s, "count": n} for (a, s), n in sorted(actions.items())], "limits": ["Historical source shopping-scam labels are not independent current fraud/dropshipping truth", "Multiple correlated products per merchant and unresolved operator clusters; hostname count is not independent operator count", "ScamFerret was known in development research; no source labels imported into installed extension", "No accepted precision/recall/false-warning rate; no delivery/checkout/authentication test", "Positive-weight evidence can concern manipulation rather than dropshipping or deception", "UNKNOWN is abstention, never clean or a correct scam detection"]}
summary.update({"accessibleDistinctNativeScanAttempts": len(attempted_unique), "nativeAttemptHostnames": len({urllib.parse.urlsplit(r["finalUrl"]).hostname.removeprefix("www.") for r in attempted_unique.values()}), "minimum150NativeFunctionTestsMet": len(attempted_unique) >= 150 and not missing, "successfulExtractionMinimum150Met": len(unique) >= 150 and not missing, "nativeScanRefusalCounts": dict(collections.Counter(r.get("scanStatus", "") for r in attempted_unique.values() if r["status"] == "NATIVE_SCAN_REFUSED_OR_FAILED")), "hiddenCredentialFlaggedAttempts": sum(r.get("pageIdentity", {}).get("credentialFieldPresent", False) for r in attempted_unique.values())})
ledger = []
for row in rows:
    record = {k: v for k, v in row.items() if k not in ["scanReport", "policyReport", "shippingReport", "finalReport"]}
    for stage in ["scan", "policy", "shipping", "final"]:
        report = row.get(stage+"Report")
        if report:
            record[stage] = {"product": {k: v for k, v in report["product"].items() if k in ["url", "title", "domain", "brand", "sku", "mpn", "gtin", "price", "currency", "claims", "extraction"]}, "merchant": report.get("merchant"), "verdict": report["verdict"], "evidence": report["evidence"], "contradictions": report.get("contradictions"), "supplyChain": report.get("supplyChain"), "rawReportSha256": hashlib.sha256(json.dumps(report, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()}
    ledger.append(record)
dest = root / "workplane/runs"
(dest / "DS-054-PAGE-OUTCOMES-20261013.json").write_text(json.dumps({"summary": summary, "pages": ledger}, separators=(",", ":"), ensure_ascii=False) + "\n")
(dest / "DS-054-AUDIT-SUMMARY-20261013.json").write_text(json.dumps(summary, indent=2) + "\n")
print(json.dumps({k: v for k, v in summary.items() if k not in ["nativeProfiles", "allSignalCounts", "limits"]}, indent=2))
