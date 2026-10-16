"""Compile artifact-backed beta observations; never infer fraud accuracy from coverage."""
import collections,csv,hashlib,io,json,math,pathlib,subprocess,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[3]
OUT=ROOT/'coverage100-report';OUT.mkdir(exist_ok=True)
def api(path):return json.loads(subprocess.check_output(['gh','api','repos/chairmantrash/DropShredder/'+path]))
manifest_bytes=(ROOT/'tools/beta/coverage100/targets.json').read_bytes()
assert hashlib.sha256(manifest_bytes).hexdigest()=='38df85d3b7e6e19c273584eb9728334a1bab561570630eef6df8dd67cd9b6960'
targets=json.loads(manifest_bytes)['targets'];assert len(targets)==233
receipts=[]
def read_artifact(meta):
 b=subprocess.check_output(['gh','api',f'repos/chairmantrash/DropShredder/actions/artifacts/{meta["id"]}/zip'])
 assert hashlib.sha256(b).hexdigest()==meta['digest'].removeprefix('sha256:')
 with zipfile.ZipFile(io.BytesIO(b)) as z:
  audit=[n for n in z.namelist() if n.endswith('audit150.json')]
  probe=[n for n in z.namelist() if n.endswith('native-probe.json')]
  package=[n for n in z.namelist() if n.endswith('candidate-package-verified.json')]
  return {'artifact':meta,'audit':json.loads(z.read(audit[0])) if audit else None,'probe':json.loads(z.read(probe[0])) if probe else None,'package':json.loads(z.read(package[0])) if package else None}
def get(run,prefix):
 result=[]
 for a in api(f'actions/runs/{run}/artifacts')['artifacts']:
  if a['name'].startswith(prefix):
   assert not a['expired'];result.append(read_artifact(a))
 return result
baseline=get(38980203200,'ds060-baseline-')
retry7=get(38981127797,'ds060-baseline-retry-7')
retry4=get(38982144400,'ds060-baseline-retry-4')
repaired=get(38983826714,'ds060-repaired-')
assert len(baseline)==8 and len(retry7)==1 and len(retry4)==1 and len(repaired)==8
all_attempts=baseline+retry7+retry4+repaired
for p in all_attempts:
 probe=p['probe'];receipts.append({'artifact':p['artifact'],'counts':p['audit'].get('counts') if p['audit'] else None,'savedRows':len(p['audit']['rows']) if p['audit'] else 0,'probeStatus':probe.get('status') if probe else None,'failure':probe.get('failure') if probe else 'No final probe after step interruption','package':p['package']})
selected_baseline=[p for p in baseline if p['artifact']['name'] not in ['ds060-baseline-4','ds060-baseline-7']]+retry7+retry4
def weighted(e):
 return e.get('severity')!='info' and isinstance(e.get('weight'),(int,float)) and isinstance(e.get('confidence'),(int,float)) and math.isfinite(e['weight']) and math.isfinite(e['confidence']) and e['weight']>0 and 0<e['confidence']<=1
def phase(profiles):
 byid={};evidence=collections.Counter();issues=[];ziphashes=set()
 for p in profiles:
  assert p['package'] and p['package'].get('allPackageHashesMatch') and p['package'].get('files')==54
  ziphashes.add(p['package']['zipSha256'])
  assert p['probe'] and all(t['status']=='PASS' for t in p['probe']['tests'])
  assert p['audit']['manifestSha256']==hashlib.sha256(manifest_bytes).hexdigest()
  if p['audit'].get('safetyStop'):issues.append(p['audit']['safetyStop'])
  for row in p['audit']['rows']:
   assert row['id'] not in byid
   final=row.get('finalReport') or row.get('scanReport') or {};scan=row.get('scanReport') or {}
   final_evidence=final.get('evidence',[]);verdict=final.get('verdict',{})
   adverse=[e for e in final_evidence if weighted(e)]
   stamp_warning=any(s in (row.get('stamp') or '') for s in ['⚠','CAUGHT SOMETHING','RED FLAGS','SIGNALS FOUND','FOUND SOMETHING WORTH CHECKING'])
   context_stamp=bool(row.get('stamp')) and not any(weighted(e) for e in scan.get('evidence',[]))
   data={k:row.get(k) for k in ['id','url','host','category','sourceIds','status','httpStatus','finalUrl','scanStatus','commerceAdmission','error','actions']}
   data.update({'product':final.get('product'),'verdict':verdict,'evidence':final_evidence,'reviewIntegrity':final.get('reviewIntegrity'),'fulfillmentDisclosure':final.get('fulfillmentDisclosure'),'sourceArtifact':p['artifact']['id'],'contextOnlyStamp':context_stamp,'contextOnlyStampWarning':context_stamp and stamp_warning,'severe':bool(verdict.get('severeWarningAllowed'))})
   byid[row['id']]=data
   if row['status']=='OBSERVED_SCAN':evidence.update(e['id'] for e in adverse)
 rows=[byid.get(t['id'],{**t,'status':'NOT_EXECUTED'}) for t in targets]
 scans=[r for r in rows if r['status']=='OBSERVED_SCAN']
 hosts=sorted({r['host'] for r in scans})
 registered=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {getDomain} from 'tldts';console.log(JSON.stringify(JSON.parse(process.argv[1]).map(h=>getDomain(h,{allowPrivateDomains:true})??h)))",json.dumps(hosts)],cwd=ROOT,text=True))
 stats={'planned':233,'recorded':sum(r['status']!='NOT_EXECUTED' for r in rows),'successfulScans':len(scans),'hostnames':len(hosts),'registeredDomains':len(set(registered)),'statusCounts':dict(collections.Counter(r['status'] for r in rows)),'categoryCounts':dict(collections.Counter(r['category'] for r in scans)),'structuredIdentityResolved':sum(bool((r.get('product') or {}).get('extraction',{}).get('structuredIdentityResolved')) for r in scans),'pricedReports':sum((r.get('product') or {}).get('price') is not None for r in scans),'reviewReports':sum(bool((r.get('reviewIntegrity') or {}).get('total')) for r in scans),'visibleReviews':sum((r.get('reviewIntegrity') or {}).get('total',0) for r in scans),'numericalUnknown':sum(r['verdict'].get('massResellLikelihood') is None and r['verdict'].get('dropshipLikelihood') is None for r in scans),'weightedEvidencePages':sum(any(weighted(e) for e in r['evidence']) for r in scans),'contextOnlyStamps':sum(r['contextOnlyStamp'] for r in scans),'contextOnlyStampWarnings':sum(r['contextOnlyStampWarning'] for r in scans),'severe':sum(r['severe'] for r in scans),'evidenceIds':dict(evidence),'safetyStops':issues,'zipSha256':sorted(ziphashes)}
 return stats,rows
before,before_rows=phase(selected_baseline);after,after_rows=phase(repaired)
native_run=int((ROOT/'native-accepted-run.txt').read_text())
native_artifacts=get(native_run,'dropshredder-headed-permission-evidence')
assert len(native_artifacts)==1
native=native_artifacts[0]['probe']
native_summary={'artifact':native_artifacts[0]['artifact'],'sourceCommit':native.get('sourceCommit'),'status':native.get('status'),'failure':native.get('failure'),'tests':native.get('tests'),'errors':native.get('errors')}
specific=[]
for sid in ['SITE-0112','SITE-0130']:
 b=next(r for r in before_rows if r['id']==sid);a=next(r for r in after_rows if r['id']==sid)
 specific.append({'id':sid,'host':b['host'],'beforeStatus':b['status'],'afterStatus':a['status'],'beforeShippingConflict':any(e['id']=='FULFILLMENT_ORIGIN_CONFLICT' for e in b['evidence']),'afterShippingConflict':any(e['id']=='FULFILLMENT_ORIGIN_CONFLICT' for e in a['evidence'])})
summary={'protocol':'DS-060','baseline':before,'repaired':after,'specificShippingFalsePositives':specific,'native':native_summary,'limits':['Developer-selected and development-exposed corpus, not independent current fraud ground truth','UNKNOWN is abstention; no consumer satisfaction or detection accuracy is established','Unavailable/changed/private pages are never counted as successful detections','Live availability can change; field/behavior repairs and coverage changes are separate'],'sourceCommit':'ac30cadd3c415916e8c88d57de96193b90397420','acceptedLiveHarness':'c17ee9b683f3b40615b2761a864e8569809cf212','nativeRun':native_run,'manifestSha256':hashlib.sha256(manifest_bytes).hexdigest()}
(OUT/'DS-060-SUMMARY.json').write_text(json.dumps(summary,indent=2)+'\n')
(OUT/'DS-060-ARTIFACT-RECEIPTS.json').write_text(json.dumps(receipts,indent=2)+'\n')
(OUT/'DS-060-BASELINE-OUTCOMES.json').write_text(json.dumps(before_rows,indent=2)+'\n')
(OUT/'DS-060-REPAIRED-OUTCOMES.json').write_text(json.dumps(after_rows,indent=2)+'\n')
with (OUT/'DS-060-WEBSITE-COMPARISON.csv').open('w') as f:
 writer=csv.writer(f);writer.writerow(['id','host','category','baseline_status','repaired_status','baseline_review_count','repaired_review_count','baseline_context_warning','repaired_context_warning','repaired_unknown'])
 for b,a in zip(before_rows,after_rows):
  writer.writerow([b['id'],b['host'],b['category'],b['status'],a['status'],(b.get('reviewIntegrity') or {}).get('total',0),(a.get('reviewIntegrity') or {}).get('total',0),b.get('contextOnlyStampWarning'),a.get('contextOnlyStampWarning'),a.get('verdict',{}).get('massResellLikelihood') is None and a.get('verdict',{}).get('dropshipLikelihood') is None])
print('DS_C100_SUMMARY='+json.dumps(summary))
assert after['recorded']==233 and after['registeredDomains']>=100 and not after['safetyStops']
assert native['status']=='PASS' and all(t['status']=='PASS' for t in native['tests'])
assert all(not r['afterShippingConflict'] and r['afterStatus']=='OBSERVED_SCAN' for r in specific)
assert after['contextOnlyStampWarnings']==0
assert after['reviewReports']>0
