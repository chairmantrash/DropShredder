"""Verify and stage the actual unauthenticated public beta4 ZIP, never rebuild."""
import hashlib,io,json,pathlib,sys,zipfile
root=pathlib.Path(__file__).resolve().parents[3];payload=pathlib.Path(sys.argv[1]).read_bytes()
assert len(payload)==25985652 and hashlib.sha256(payload).hexdigest()=='84edf93835f4daa490402630f1801fd2b49f64f81dd8dafb72ac4f1b8020c752'
build=json.loads((root/'tools/browser-smoke/candidate-build-info.json').read_text());assert build['sourceCommit']=='9aed11c9d26f79ba1f1824a92ccc1adec78905ce'
expected={f['path']:f for f in build['buildFiles']};assert len(expected)==54;dest=root/'.output/chrome-mv3';assert not dest.exists()
with zipfile.ZipFile(io.BytesIO(payload)) as z:
 assert len(z.namelist())==54 and set(z.namelist())==set(expected)
 for name in z.namelist():
  b=z.read(name);assert len(b)==expected[name]['bytes'] and hashlib.sha256(b).hexdigest()==expected[name]['sha256'];p=dest/name;assert p.resolve().is_relative_to(dest.resolve());p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
out=root/'browser-smoke-results';out.mkdir(exist_ok=True)
(out/'candidate-package-verified.json').write_text(json.dumps({'sourceCommit':build['sourceCommit'],'publicUrl':'https://github.com/chairmantrash/DropShredder/releases/download/v0.2.0-beta.4/DropShredder-0.2.0-beta.4-chrome.zip','zipSha256':hashlib.sha256(payload).hexdigest(),'zipBytes':len(payload),'allPackageHashesMatch':True,'files':len(expected),'rebuilt':False,'authenticated':False},indent=2)+'\n')
