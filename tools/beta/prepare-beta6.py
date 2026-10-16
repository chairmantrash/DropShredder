"""Prepare exact previously tested beta6 bytes; no runtime build."""
import hashlib,io,json,pathlib,shutil,sys,zipfile
root=pathlib.Path(__file__).resolve().parents[2]
wrapper=pathlib.Path(sys.argv[1]).read_bytes();assert hashlib.sha256(wrapper).hexdigest()=='7134a24cde3be14f944a22080c4a1d9b9855af4ec99ac2ff9b6ed369ca36c50d'
with zipfile.ZipFile(io.BytesIO(wrapper)) as z:
 assert z.namelist()==['dropshredder-0.2.0-chrome.zip'];payload=z.read(z.namelist()[0])
assert len(payload)==25988814 and hashlib.sha256(payload).hexdigest()=='83d3a687f02de89bfa57ddbf5113d81cc919852c9dba568b44c1e502e400d43b'
build=json.loads((root/'tools/browser-smoke/candidate-build-info.json').read_text());assert build['sourceCommit']=='5bdd16f282bae1aff9b2193f9c98b3fca1e89737' and build['sourceTree']=='ab126afcadd7c0b6015fc5e324ab45f33eadf569'
expected={f['path']:f for f in build['buildFiles']};assert len(expected)==54
with zipfile.ZipFile(io.BytesIO(payload)) as z:
 assert len(z.namelist())==54 and set(z.namelist())==set(expected)
 for name in z.namelist():
  b=z.read(name);assert len(b)==expected[name]['bytes'] and hashlib.sha256(b).hexdigest()==expected[name]['sha256']
nativepath=pathlib.Path(sys.argv[2]);native=json.loads(nativepath.read_text());accepted='0167f5b8a9beae6d87deed65c42593aaa043c690'
assert native['sourceCommit']==accepted and native['packagedSourceCommit']==build['sourceCommit']
assert native['testsPassed']==94 and len(native['tests'])==94 and all(t['status']=='PASS' for t in native['tests']) and not native['errors']
assert all(next(t for t in native['tests'] if t['id']==i)['status']=='PASS' for i in ['P01','P02','P03','R01','R02','R03','R04','R05','R06','R07','R08','R09','R10','R11','R12','R13','R14'])
summary=json.loads((root/'workplane/runs/DS-059-AUDIT-SUMMARY-20261016.json').read_text());ledger=json.loads((root/'workplane/runs/DS-059-PAGE-OUTCOMES-20261016.json').read_text());assert ledger['summary']==summary
assert len(ledger['pages'])==269 and len({p['id'] for p in ledger['pages']})==269 and summary['recordedPageOutcomes']==269
assert summary['successfulExtractionMinimum150Met'] and summary['severeWarningPages']==0
repro=next(p for p in ledger['pages'] if p['id']=='AUDIT-0001');assert repro['manufacturerCodeObservation']['pass'] and repro['scan']['product']['mpn']=='GW3773'
control=next(p for p in ledger['pages'] if p['id']=='CONTROL-010');product=control['scan']['product']
assert control['status']=='OBSERVED_SCAN' and product['sku']=='11677981' and product.get('brand') and product['extraction']['structuredIdentityResolved'] and product['extraction']['offerResolved'] and product.get('price',0)>0
assert len(summary['nativeProfiles'])==8
for p in summary['nativeProfiles']:
 assert p['sourceCommit']==accepted and p['packagedSourceCommit']==build['sourceCommit'] and p['status']=='LIVE AUDIT COLLECTION COMPLETE'
 assert not p['safetyStop'] and not p['uncaughtPanelErrors'] and len(p['bootstrapTests'])==9 and all(t['status']=='PASS' for t in p['bootstrapTests'])
observations={'acceptedHarnessHead':accepted,'productionSource':build['sourceCommit'],'ciHead':'0167f5b8a9beae6d87deed65c42593aaa043c690','ciArtifact':12035137095,'zipSha256':hashlib.sha256(payload).hexdigest(),'allPackageHashesVerified':True,'packageFiles':54,'nativePassed':94,'corePassed':459,'browser':native['browser'],'liveAudit':summary,'independentAccuracyAccepted':False,'limits':summary['limits']}
packet=root/'beta6-packet';packet.mkdir(exist_ok=True);name='DropShredder-0.2.0-beta.6-chrome.zip';(packet/name).write_bytes(payload)
(packet/'BUILD-INFO.json').write_text(json.dumps(build,indent=2)+'\n');(packet/'BETA-OBSERVATIONS.json').write_text(json.dumps(observations,indent=2)+'\n')
shutil.copyfile(nativepath,packet/'NATIVE-PROTOCOL.json');shutil.copyfile(root/'workplane/runs/DS-059-PAGE-OUTCOMES-20261016.json',packet/'LIVE-PAGE-OUTCOMES.json');shutil.copyfile(root/'tools/beta/BETA6-INSTALL-AND-REPORT.md',packet/'INSTALL-AND-REPORT.md')
(packet/'SHA256SUMS.txt').write_text(hashlib.sha256(payload).hexdigest()+'  '+name+'\n');assert len(list(packet.iterdir()))==7
print(json.dumps({'source':build['sourceCommit'],'zipSha256':hashlib.sha256(payload).hexdigest(),'nativePassed':94,'liveSuccessfulExtractions':summary['accessibleDistinctPages'],'plannedOutcomes':269,'rebuilt':False}))
