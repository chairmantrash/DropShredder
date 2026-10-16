import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// A successful analyzer job is not evidence that its findings were empty.
// No severity, baseline state or suppression silently exempts a finding.
export function inspectCodeql(document){
 if(document.version!=='2.1.0'||!Array.isArray(document.runs)||!document.runs.length)throw Error('Missing CodeQL SARIF runs');
 const findings=[];
 for(const run of document.runs){
  if(run.tool?.driver?.name!=='CodeQL'||!Array.isArray(run.results))throw Error('Incomplete CodeQL SARIF result inventory');
  if(!run.invocations?.length||run.invocations.some(i=>i.executionSuccessful!==true))throw Error('CodeQL query execution was not confirmed successful');
  for(const result of run.results){
   if(['pass','notApplicable'].includes(result.kind))continue;
   findings.push({ruleId:result.ruleId,level:result.level??'warning',message:result.message?.text,locations:result.locations?.map(l=>l.physicalLocation)});
  }
 }
 return {status:findings.length?'FINDINGS_REMAIN':'NO_FINDINGS',findings};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const directory=path.resolve(process.argv[2]??'codeql-results');
  const files=fs.readdirSync(directory).filter(f=>f.endsWith('.sarif')).sort();
  if(!files.length)throw Error('No CodeQL SARIF output files');
  const reports=files.map(file=>{const bytes=fs.readFileSync(path.join(directory,file));return {file,sha256:createHash('sha256').update(bytes).digest('hex'),...inspectCodeql(JSON.parse(bytes.toString('utf8')))};});
  const receipt={sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),recordedAt:new Date().toISOString(),status:reports.every(r=>r.status==='NO_FINDINGS')?'NO_FINDINGS':'FINDINGS_REMAIN',reports};
  fs.writeFileSync(path.join(directory,'SECURITY-RECEIPT.json'),JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify(receipt,null,2));
  if(receipt.status!=='NO_FINDINGS')process.exitCode=2;
 }catch(error){console.error(error.message);process.exitCode=1;}
}
