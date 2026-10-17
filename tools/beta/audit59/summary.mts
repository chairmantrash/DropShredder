import fs from 'node:fs';
import {merchantNetworkEvidence,merchantNetworkForDomain} from '../../../src/intelligence/merchant-networks';
import {crossDomainReferenceEvidence} from '../../../src/analysis/merchant-network';
import {calculateVerdict,warningSignalCount} from '../../../src/analysis/evidence-engine';
import type {EvidenceSignal,Verdict} from '../../../src/types/evidence';

interface RecordedOutcome {
  id:string;host:string;status:string;
  product:{capturedAt:string};evidence:EvidenceSignal[];verdict:Verdict;
}
interface SourceRecord {id:string;status:string;reviewCount?:number;pageTextHash?:string;warningCount?:number}
interface SourceReplay {scope:string;records:SourceRecord[]}
interface Challenge {scope:string;correct:number}
const directory='workplane/runs/DS-061';
const read=<T,>(file:string):T=>JSON.parse(fs.readFileSync(file,'utf8')) as T;
const prior=read<{pages:RecordedOutcome[]}>('workplane/runs/DS-060-REPAIRED-OUTCOMES-20261017.json').pages;
const native=prior.filter(page=>page.status==='OBSERVED_SCAN');
const replay=native.map(page=>{
  if(!page.product||!page.verdict||!Array.isArray(page.evidence))throw Error('Incomplete successful record: '+page.id);
  const now=new Date(page.product.capturedAt),network=merchantNetworkForDomain(page.host);
  const evidence=page.evidence.flatMap(item=>{
    if(item.id==='KNOWN_AFFILIATED_MERCHANT_NETWORK')return merchantNetworkEvidence(page.host,now);
    if(item.id==='CROSS_DOMAIN_MERCHANT_REFERENCE')return crossDomainReferenceEvidence(page.host,item.observedValue??'',network?.domains??[]);
    return [item];
  });
  return {
    id:page.id,host:page.host,
    beforeWarnings:warningSignalCount(page.evidence),afterWarnings:warningSignalCount(evidence),
    beforeMerchantRisk:page.verdict.merchantRisk,afterMerchantRisk:calculateVerdict(evidence).merchantRisk,
    scope:'Stored-evidence affiliation rule replay only, not a fresh live scan',
  };
});
const before=read<SourceReplay>(directory+'/source-replay-before.json');
const after=read<SourceReplay>(directory+'/source-replay-after.json');
const counts=(rows:Array<{status:string}>)=>Object.fromEntries([...new Set(rows.map(row=>row.status))].map(status=>[status,rows.filter(row=>row.status===status).length]));
const baselineChallenge=read<Challenge>(directory+'/disclosure-baseline-corrected-metadata.json');
const repairedChallenge=read<Challenge>(directory+'/disclosure-repaired-corrected-metadata.json');
const output={
  sourceCommit:read<{sourceCommit:string}>('tools/browser-smoke/candidate-build-info.json').sourceCommit,
  priorNative:{total:prior.length,successful:native.length,statusCounts:counts(prior),independentAccuracyLabels:0},
  affiliationReplay:{
    scope:'Only affiliation rules are replayed on retained evidence; not detector-wide or fresh website performance',
    pages:replay.length,
    warningPagesBefore:replay.filter(row=>row.beforeWarnings>0).length,
    warningPagesAfter:replay.filter(row=>row.afterWarnings>0).length,
    changed:replay.filter(row=>row.beforeWarnings!==row.afterWarnings||row.beforeMerchantRisk!==row.afterMerchantRisk),
  },
  staticReplay:{
    scope:after.scope,before:counts(before.records),after:counts(after.records),
    reviewsBefore:before.records.reduce((total,row)=>total+(row.reviewCount??0),0),
    reviewsAfter:after.records.reduce((total,row)=>total+(row.reviewCount??0),0),
    changed:after.records.filter((row,index)=>row.pageTextHash!==before.records[index]?.pageTextHash||row.warningCount!==before.records[index]?.warningCount).map(row=>row.id),
  },
  disclosureChallenge:{scope:repairedChallenge.scope,before:baselineChallenge.correct,after:repairedChallenge.correct,total:12},
  accuracy:read<Record<string,unknown>>(directory+'/accuracy-result.json'),
};
fs.writeFileSync(directory+'/audit-summary.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({affiliation:output.affiliationReplay,staticReplay:output.staticReplay,challenge:output.disclosureChallenge,accuracy:output.accuracy.status}));
