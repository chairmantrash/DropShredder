"""Prepare exact previously tested beta4 bytes; no runtime build."""
import hashlib,io,json,pathlib,shutil,sys,zipfile
root=pathlib.Path(__file__).resolve().parents[2]
wrapper=pathlib.Path(sys.argv[1]).read_bytes();assert hashlib.sha256(wrapper).hexdigest()=='e4ed1015a1e4b1dd7c385a3fa0f96bd0b5f2f633ae585e510d919052c326b031'
with zipfile.ZipFile(io.BytesIO(wrapper)) as z:
 assert z.namelist()==['dropshredder-0.2.0-chrome.zip'];payload=z.read(z.namelist()[0])
assert len(payload)==25985652 and hashlib.sha256(payload).hexdigest()=='84edf93835f4daa490402630f1801fd2b49f64f81dd8dafb72ac4f1b8020c752'
build=json.loads((root/'tools/browser-smoke/candidate-build-info.json').read_text());assert build['sourceCommit']=='9aed11c9d26f79ba1f1824a92ccc1adec78905ce' and build['sourceTree']=='5956c9f997fd58ef24c360c1679af40a50bcc8a3'
expected={f['path']:f for f in build['buildFiles']};assert len(expected)==54
with zipfile.ZipFile(io.BytesIO(payload)) as z:
 assert len(z.namelist())==54 and set(z.namelist())==set(expected)
 for name in z.namelist():
  b=z.read(name);assert len(b)==expected[name]['bytes'] and hashlib.sha256(b).hexdigest()==expected[name]['sha256']
nativepath=pathlib.Path(sys.argv[2]);native=json.loads(nativepath.read_text());accepted='ac52c91f4e082fafc5ba7358aecdd39742d48adb'
assert native['sourceCommit']==accepted and native['packagedSourceCommit']==build['sourceCommit']
assert native['testsPassed']==86 and len(native['tests'])==86 and all(t['status']=='PASS' for t in native['tests']) and not native['errors']
assert all(next(t for t in native['tests'] if t['id']==i)['status']=='PASS' for i in ['P01','P02','P03','R01','R02','R03','R04','R05','R06'])
summary=json.loads((root/'workplane/runs/DS-056-AUDIT-SUMMARY-20261013.json').read_text());ledger=json.loads((root/'workplane/runs/DS-056-PAGE-OUTCOMES-20261013.json').read_text());assert ledger['summary']==summary
assert len(ledger['pages'])==268 and len({p['id'] for p in ledger['pages']})==268 and summary['recordedPageOutcomes']==268
assert summary['successfulExtractionMinimum150Met'] and summary['severeWarningPages']==0 and not summary['nativeScanRefusalCounts']
assert len(summary['nativeProfiles'])==8
for p in summary['nativeProfiles']:
 assert p['sourceCommit']==accepted and p['packagedSourceCommit']==build['sourceCommit'] and p['status']=='LIVE AUDIT COLLECTION COMPLETE'
 assert not p['safetyStop'] and not p['uncaughtPanelErrors'] and len(p['bootstrapTests'])==9 and all(t['status']=='PASS' for t in p['bootstrapTests'])
observations={'acceptedHarnessHead':accepted,'productionSource':build['sourceCommit'],'ciHead':'c2fa68b38ea352e7de485ff67ce623264d980d01','ciArtifact':11815875609,'zipSha256':hashlib.sha256(payload).hexdigest(),'allPackageHashesVerified':True,'packageFiles':54,'nativePassed':86,'corePassed':428,'browser':native['browser'],'liveAudit':summary,'independentAccuracyAccepted':False,'limits':summary['limits']}
packet=root/'beta4-packet';packet.mkdir(exist_ok=True);name='DropShredder-0.2.0-beta.4-chrome.zip';(packet/name).write_bytes(payload)
(packet/'BUILD-INFO.json').write_text(json.dumps(build,indent=2)+'\n');(packet/'BETA-OBSERVATIONS.json').write_text(json.dumps(observations,indent=2)+'\n')
shutil.copyfile(nativepath,packet/'NATIVE-PROTOCOL.json');shutil.copyfile(root/'workplane/runs/DS-056-PAGE-OUTCOMES-20261013.json',packet/'LIVE-PAGE-OUTCOMES.json');shutil.copyfile(root/'tools/beta/BETA4-INSTALL-AND-REPORT.md',packet/'INSTALL-AND-REPORT.md')
(packet/'SHA256SUMS.txt').write_text(hashlib.sha256(payload).hexdigest()+'  '+name+'\n');assert len(list(packet.iterdir()))==7
print(json.dumps({'source':build['sourceCommit'],'zipSha256':hashlib.sha256(payload).hexdigest(),'nativePassed':86,'liveSuccessfulExtractions':summary['accessibleDistinctPages'],'plannedOutcomes':268,'rebuilt':False}))
