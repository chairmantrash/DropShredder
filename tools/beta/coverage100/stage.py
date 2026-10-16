"""Verify the unchanged public beta6 ZIP and every compiled file before use."""
import hashlib,json,pathlib,sys,zipfile
root=pathlib.Path(__file__).resolve().parents[3];payload=pathlib.Path(sys.argv[1]).read_bytes()
assert hashlib.sha256(payload).hexdigest()=='83d3a687f02de89bfa57ddbf5113d81cc919852c9dba568b44c1e502e400d43b'
build=json.loads((root/'tools/browser-smoke/candidate-build-info.json').read_text());assert build['sourceCommit']=='5bdd16f282bae1aff9b2193f9c98b3fca1e89737'
expected={f['path']:f for f in build['buildFiles']};assert len(expected)==54
dest=root/'.output/chrome-mv3';assert not dest.exists()
with zipfile.ZipFile(sys.argv[1]) as z:
 assert len(z.namelist())==54 and set(z.namelist())==set(expected)
 for name in z.namelist():
  b=z.read(name);assert len(b)==expected[name]['bytes'] and hashlib.sha256(b).hexdigest()==expected[name]['sha256']
  p=dest/name;assert p.resolve().is_relative_to(dest.resolve());p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
out=root/'browser-smoke-results';out.mkdir(exist_ok=True)
(out/'candidate-package-verified.json').write_text(json.dumps({'sourceCommit':build['sourceCommit'],'zipSha256':hashlib.sha256(payload).hexdigest(),'allPackageHashesMatch':True,'files':54,'rebuilt':False},indent=2)+'\n')
print('Public beta6 staged: 54 exact files; no rebuild')
