"""Retain the proven real native permission bootstrap; then only live audit."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
runner = ROOT / "tools/browser-smoke/probe-native.mjs"
baseline = runner.read_text()
anchor = "      await test('N34','Native operating-system file picker"
assert baseline.count(anchor) == 1
text = baseline.split(anchor)[0]
text = "import {runAudit150} from '../beta/audit150/live.mjs';\n" + text
text += """
    await native.liveProviders();
    // N05 failed before host permission: no successful fixture observation.
    report.auditBootstrapScope='N01-N09 real package/native permission checks only; no synthetic scan, imported list or provider verdict before public audit';
    await runAudit150({context,page,native,worker,until,pause,report,output});
    report.status='LIVE AUDIT COLLECTION COMPLETE';
  } else throw Error('Genuine headed native Chrome required');
"""
end = baseline[baseline.index("} catch (error) {\n  report.status = 'FAIL OR ENVIRONMENT BLOCKED'"):]
end = end.replace("await fs.rm(profile, { recursive: true, force: true });", "await fs.rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });")
text += end
target = ROOT / "tools/browser-smoke/probe-native-audit-beta.mjs"
target.write_text(text)
manifest = {"baselinePath": str(runner.relative_to(ROOT)), "baselineSha256": hashlib.sha256(baseline.encode()).hexdigest(), "runnerPath": str(target.relative_to(ROOT)), "runnerSha256": hashlib.sha256(text.encode()).hexdigest(), "scope": "Test-only live collector; published package unmodified; N01-N09 assertions unchanged"}
(ROOT / "browser-smoke-results").mkdir(exist_ok=True)
(ROOT / "browser-smoke-results/audit-runner-identity.json").write_text(json.dumps(manifest, indent=2) + "\n")
print(json.dumps(manifest))
