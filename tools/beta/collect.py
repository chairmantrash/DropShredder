"""Generate test-only collectors from existing runners, preserving assertions."""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parents[2]
RUNNERS = ROOT / "tools/browser-smoke"


def replace_once(text, before, after):
    assert text.count(before) == 1, f"Collector anchor changed: {before[:90]}"
    return text.replace(before, after)


generated = []
for name in ["probe-native", "run", "locales", "lifecycle"]:
    original = (RUNNERS / (name + ".mjs")).read_text()
    text = original
    if name == "probe-native":
        text = "import {weeklyCheck,additionalFeatureChecks} from '../beta/feature-checks.mjs';\nimport {runLiveTests} from '../beta/live-tests.mjs';\n" + text
        text = replace_once(text, "error: String(error) }); throw error;", "error: String(error) }); console.error(`COLLECTED FAIL ${id}: ${error}`); await native?.screenshot(`collected-${id}-failure.png`).catch(()=>{}); if(['N01','N08','N09','N16','N17','N18','N35'].includes(id))throw error;")
        text = replace_once(text, "await native.screenshot('native-signed-feed-onboarding.png');", "await native.screenshot('native-signed-feed-onboarding.png');\n        await weeklyCheck({native,worker,test,until,providerRequests});")
        text = replace_once(text, "await runMultilingualSuite({page,native,worker,context,test,until,pause,output});", "await additionalFeatureChecks({context,page,native,test,until,pause,externalRequests});\n      await runLiveTests({context,page,native,worker,until,pause,report,output,downloads,downloadDir});\n      await runMultilingualSuite({page,native,worker,context,test,until,pause,output});")
        text = replace_once(text, "for(const entry of report.liveSurfaces??[])", "for(const origin of report.betaApprovedRequestOrigins??[])allowedOrigins.add(origin);\n        for(const entry of report.liveSurfaces??[])")
        text = replace_once(text, "report.finishedAt = new Date().toISOString(); report.testsPassed", "if(report.tests.some(t=>t.status==='FAIL')||report.betaLiveTests?.some(t=>t.status==='FAIL')){report.status='FAIL — COLLECTION COMPLETE OR DEPENDENCIES BLOCKED';process.exitCode=1;}\n  report.finishedAt = new Date().toISOString(); report.testsPassed")
    elif name == "run":
        text = replace_once(text, "throw error; // stop at the first failure, no automatic retries", "console.error(`COLLECTED FAIL ${id}: ${error}`); if(['R01','R02'].includes(id))throw error;")
        text = replace_once(text, "report.finishedAt = new Date().toISOString();", "if(report.tests.some(t=>t.status==='FAIL')){report.status='FAIL — COLLECTION COMPLETE OR DEPENDENCIES BLOCKED';process.exitCode=1;}\n  report.finishedAt = new Date().toISOString();")
    elif name == "locales":
        text = replace_once(text, "error:String(error)});throw error;", "error:String(error)});console.error(`COLLECTED FAIL L-${locale}: ${error}`);")
        text = replace_once(text, "report.status='PASS';", "report.status=report.tests.some(t=>t.status==='FAIL')?'FAIL — ALL LOCALES ATTEMPTED':'PASS';if(report.status.startsWith('FAIL'))process.exitCode=1;")
    else:
        text = replace_once(text, "error:String(e)});throw e;", "error:String(e)});console.error(`COLLECTED FAIL ${id}: ${e}`);await screenshot(`collected-${id}-failure.png`).catch(()=>{});if(id==='L01')throw e;")
        text = replace_once(text, "finally{report.finishedAt=", "finally{if(report.tests.some(t=>t.status==='FAIL')){report.status='FAIL — LIFECYCLE COLLECTION COMPLETE';process.exitCode=1;}report.finishedAt=")
    target = RUNNERS / (name + "-beta.mjs")
    target.write_text(text)
    generated.append({"runner":str(target.relative_to(ROOT)),"baselineSha256":hashlib.sha256(original.encode()).hexdigest(),"collectorSha256":hashlib.sha256(text.encode()).hexdigest(),"scope":"Test harness collection only; production package unmodified"})
(RUNNERS / "beta-collector-manifest.json").write_text(json.dumps(generated,indent=2)+"\n")
print(json.dumps(generated,indent=2))
