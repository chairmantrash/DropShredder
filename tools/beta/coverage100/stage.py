"""Stage exact existing CI ZIP after wrapper/source and all-file verification."""
import hashlib,io,json,os,pathlib,sys,zipfile
root=pathlib.Path(__file__).resolve().parents[3]
meta=json.loads(pathlib.Path(sys.argv[2]).read_text());wrapper=pathlib.Path(sys.argv[1]).read_bytes()
assert not meta['expired'] and meta['workflow_run']['head_sha']==os.environ['ACCEPTED_HEAD']
assert hashlib.sha256(wrapper).hexdigest()==meta['digest'].removeprefix('sha256:')
with zipfile.ZipFile(io.BytesIO(wrapper)) as z:
 assert z.namelist()==['dropshredder-0.2.0-chrome.zip'];payload=z.read(z.namelist()[0])
build=json.loads((root/'tools/browser-smoke/candidate-build-info.json').read_text())
assert build['sourceCommit']=='ac30cadd3c415916e8c88d57de96193b90397420' and build['sourceTree']=='4491bb79a9bc1164ebc1cbf2b61f8bd4fe3ee2ae'
expected={e['path']:e for e in build['buildFiles']};assert len(expected)==54
dest=root/'.output/chrome-mv3';assert not dest.exists()
with zipfile.ZipFile(io.BytesIO(payload)) as z:
 assert len(z.namelist())==54 and set(z.namelist())==set(expected)
 for name in z.namelist():
  b=z.read(name);assert len(b)==expected[name]['bytes'] and hashlib.sha256(b).hexdigest()==expected[name]['sha256']
  p=dest/name;assert p.resolve().is_relative_to(dest.resolve());p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
out=root/'browser-smoke-results';out.mkdir(exist_ok=True)
(out/'candidate-package-verified.json').write_text(json.dumps({'sourceCommit':build['sourceCommit'],'artifact':meta['id'],'artifactDigest':meta['digest'],'zipSha256':hashlib.sha256(payload).hexdigest(),'zipBytes':len(payload),'allPackageHashesMatch':True,'files':54,'rebuilt':False},indent=2)+'\n')
print('Exact CI package staged:',54,'files',hashlib.sha256(payload).hexdigest())
