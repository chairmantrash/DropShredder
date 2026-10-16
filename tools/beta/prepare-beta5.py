"""Prepare exact previously tested beta5 bytes; no runtime build."""
import hashlib,io,json,pathlib,shutil,sys,zipfile
root=pathlib.Path(__file__).resolve().parents[2]
wrapper=pathlib.Path(sys.argv[1]).read_bytes();assert hashlib.sha256(wrapper).hexdigest()=='defde4f159e3d8955d6433acf0250a4b5e7164dcbe750079363d1646c2793b85'
with zipfile.ZipFile(io.BytesIO(wrapper)) as z:
 assert z.namelist()==['dropshredder-0.2.0-chrome.zip'];payload=z.read(z.namelist()[0])
assert len(payload)==25986104 and hashlib.sha256(payload).hexdigest()=='17f5ae153b5c745e5488d4d81e12ad1864a3a4d4ffbb8f97da71e0b5df54ca3c'
build=json.loads((root/'tools/browser-smoke/candidate-build-info.json').read_text());assert build['sourceCommit']=='ae94718c310fdf253fcfbef156fc49b30bb4a8d9' and build['sourceTree']=='175ee8f1c2148fd774288bb5d1937731b71e3ff0'
expected={f['path']:f for f in build['buildFiles']};assert len(expected)==54
with zipfile.ZipFile(io.BytesIO(payload)) as z:
 assert len(z.namelist())==54 and set(z.namelist())==set(expected)
 for name in z.namelist():
  b=z.read(name);assert len(b)==expected[name]['bytes'] and hashlib.sha256(b).hexdigest()==expected[name]['sha256']
nativepath=pathlib.Path(sys.argv[2]);native=json.loads(nativepath.read_text());accepted='aa84acc6207340755ffb55b5c8d956995f57b504'
assert native['sourceCommit']==accepted and native['packagedSourceCommit']==build['sourceCommit']
assert native['testsPassed']==87 and len(native['tests'])==87 and all(t['status']=='PASS' for t in native['tests']) and not native['errors']
assert all(next(t for t in native['tests'] if t['id']==i)['status']=='PASS' for i in ['P01','P02','P03','R01','R02','R03','R04','R05','R06','R07'])
summary=json.loads((root/'workplane/runs/DS-058-AUDIT-SUMMARY-20261016.json').read_text());ledger=json.loads((root/'workplane/runs/DS-058-PAGE-OUTCOMES-20261016.json').read_text());assert ledger['summary']==summary
assert len(ledger['pages'])==268 and len({p['id'] for p in ledger['pages']})==268 and summary['recordedPageOutcomes']==268
assert summary['successfulExtractionMinimum150Met'] and summary['severeWarningPages']==0 and not summary['nativeScanRefusalCounts']
repro=next(p for p in ledger['pages'] if p['id']=='AUDIT-0001');assert repro['manufacturerCodeObservation']['pass'] and repro['scan']['product']['mpn']=='GW3773'
assert len(summary['nativeProfiles'])==8
for p in summary['nativeProfiles']:
 assert p['sourceCommit']==(accepted if p['shard'] in [1,4] else 'bbbed82e5027e26a9fae5fbf4c845732fde4e722') and p['packagedSourceCommit']==build['sourceCommit'] and p['status']=='LIVE AUDIT COLLECTION COMPLETE'
 assert not p['safetyStop'] and not p['uncaughtPanelErrors'] and len(p['bootstrapTests'])==9 and all(t['status']=='PASS' for t in p['bootstrapTests'])
observations={'acceptedHarnessHead':accepted,'productionSource':build['sourceCommit'],'ciHead':'1efffdc60ad5ecbc37427ba78fa2e836b352dd17','ciArtifact':12028542454,'zipSha256':hashlib.sha256(payload).hexdigest(),'allPackageHashesVerified':True,'packageFiles':54,'nativePassed':87,'corePassed':440,'browser':native['browser'],'liveAudit':summary,'independentAccuracyAccepted':False,'limits':summary['limits']}
packet=root/'beta5-packet';packet.mkdir(exist_ok=True);name='DropShredder-0.2.0-beta.5-chrome.zip';(packet/name).write_bytes(payload)
(packet/'BUILD-INFO.json').write_text(json.dumps(build,indent=2)+'\n');(packet/'BETA-OBSERVATIONS.json').write_text(json.dumps(observations,indent=2)+'\n')
shutil.copyfile(nativepath,packet/'NATIVE-PROTOCOL.json');shutil.copyfile(root/'workplane/runs/DS-058-PAGE-OUTCOMES-20261016.json',packet/'LIVE-PAGE-OUTCOMES.json');shutil.copyfile(root/'tools/beta/BETA5-INSTALL-AND-REPORT.md',packet/'INSTALL-AND-REPORT.md')
(packet/'SHA256SUMS.txt').write_text(hashlib.sha256(payload).hexdigest()+'  '+name+'\n');assert len(list(packet.iterdir()))==7
print(json.dumps({'source':build['sourceCommit'],'zipSha256':hashlib.sha256(payload).hexdigest(),'nativePassed':87,'liveSuccessfulExtractions':summary['accessibleDistinctPages'],'plannedOutcomes':268,'rebuilt':False}))
