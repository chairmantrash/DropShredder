"""Preserve real N01-N09 Chrome Deny/Allow bootstrap, add owned regression suites."""
import hashlib,json,pathlib
root=pathlib.Path(__file__).resolve().parents[3]
(root/'workplane/runs/DS-062').mkdir(parents=True,exist_ok=True)
source=root/'tools/browser-smoke/probe-native.mjs';original=source.read_text()
anchor="      await test('N34','Native operating-system file picker";assert original.count(anchor)==1
text="import {runAudit59NativeSuite} from '../beta/audit59/native.mjs';\nimport {runComparison62} from '../beta/comparison62/native.mjs';\n"+original.split(anchor)[0]
old="const {requestId,request}=response.params;const url=request.url;providerRequests.push({url,mode:providerMode,at:new Date().toISOString()});"
assert old in text
# This extends only the explicitly routed fixture-response list, never browser permissions.
text=text.replace("patterns:[{urlPattern:","patterns:[{urlPattern:'https://comparison.example.com/*'},{urlPattern:",1)
needle="const target=new URL(url);assert.equal(target.protocol,'https:');"
assert needle in text
text=text.replace(needle,needle+'''
        if(target.hostname==='comparison.example.com'){
          const body='<script type="application/ld+json">'+JSON.stringify({'@type':'Product',url:target.href,name:'Owned comparison lamp',gtin:'012345678905',offers:{'@type':'Offer',url:target.href,price:20,priceCurrency:'USD'}})+'</script>';
          await call('Fetch.fulfillRequest',{requestId,responseCode:mode==='error'?503:200,responseHeaders:[{name:'content-type',value:'text/html'}],body:Buffer.from(body).toString('base64')});return;
        }
''',1)
text+='''
      report.comparison62Scope='Unchanged genuine N01-N09 bootstrap, C100-01..03, A59-01..04, C62-01..06 owned controls; no live merchant accuracy';
      await runCoverageNativeSuite({context,page,native,worker,test,until,pause});
      await runAudit59NativeSuite({context,page,native,test,until,pause});
      await runComparison62({context,page,native,test,until,pause,providerRequests,setMode:mode=>{providerMode=mode;}});
      report.status='PASS — TARGETED DS-062 NATIVE CONTROLS';
    }else throw Error('Genuine headed native Chrome required');
'''
text+=original[original.index("} catch (error) {\n  report.status = 'FAIL OR ENVIRONMENT BLOCKED'"):]
target=root/'tools/browser-smoke/probe-native-comparison62.mjs';target.write_text(text)
(root/'workplane/runs/DS-062/native-runner-identity.json').write_text(json.dumps({'baseSha256':hashlib.sha256(original.encode()).hexdigest(),'runnerSha256':hashlib.sha256(text.encode()).hexdigest(),'scope':'Test fixture transport and targeted controls; original native permission assertions unchanged'},indent=2)+'\n')
