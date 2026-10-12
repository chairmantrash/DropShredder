import assert from 'node:assert/strict';
import test from 'node:test';
import {inspectCodeql} from '../scripts/audit-codeql-results.mjs';

const sarif=(results:unknown[])=>({version:'2.1.0',runs:[{tool:{driver:{name:'CodeQL'}},invocations:[{executionSuccessful:true}],results}]});

test('successful CodeQL execution with warning, unchanged or suppressed findings still blocks acceptance',()=>{
 const result=inspectCodeql(sarif([{ruleId:'js/unsafe',level:'warning',baselineState:'unchanged',suppressions:[{kind:'inSource',status:'accepted'}],message:{text:'Unresolved finding'}}]));
 assert.equal(result.status,'FINDINGS_REMAIN');assert.equal(result.findings.length,1);
 assert.equal(inspectCodeql(sarif([])).status,'NO_FINDINGS');
});

test('missing, malformed or unsuccessful security analysis cannot masquerade as no findings',()=>{
 assert.throws(()=>inspectCodeql({version:'2.1.0',runs:[]}),/Missing/);
 assert.throws(()=>inspectCodeql({version:'2.1.0',runs:[{tool:{driver:{name:'CodeQL'}},results:[]}]}),/execution/);
 const failed=sarif([]);failed.runs[0]!.invocations[0]!.executionSuccessful=false;
 assert.throws(()=>inspectCodeql(failed),/execution/);
});
