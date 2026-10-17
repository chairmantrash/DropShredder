"""Keep unchanged genuine N01-N09 consent bootstrap; execute focused owned controls."""
import hashlib,json
from pathlib import Path
root=Path(__file__).resolve().parents[3]
source=root/'tools/browser-smoke/probe-native.mjs';original=source.read_text()
anchor="      await test('N34','Native operating-system file picker"
assert original.count(anchor)==1
text="import {runAudit59NativeSuite} from '../beta/audit59/native.mjs';\n"+original.split(anchor)[0]
text+='''
      report.audit59Scope='Unchanged N01-N09 genuine native/consent bootstrap, C100-01..03 and A59-01..04 owned regressions only; no independent merchant accuracy';
      await runCoverageNativeSuite({context,page,native,worker,test,until,pause});
      await runAudit59NativeSuite({context,page,native,test,until,pause});
      report.status='PASS — TARGETED DS-061 NATIVE CONTROLS';
    }else throw Error('Genuine headed native Chrome required');
'''
text+=original[original.index("} catch (error) {\n  report.status = 'FAIL OR ENVIRONMENT BLOCKED'"):]
target=root/'tools/browser-smoke/probe-native-audit59.mjs';target.write_text(text)
receipt=dict(basePath=str(source.relative_to(root)),baseSha256=hashlib.sha256(original.encode()).hexdigest(),runnerPath=str(target.relative_to(root)),runnerSha256=hashlib.sha256(text.encode()).hexdigest(),scope='Test harness only; native bootstrap/permission assertions unchanged; existing compiled production package')
(root/'workplane/runs/DS-061/native-runner-identity.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))
