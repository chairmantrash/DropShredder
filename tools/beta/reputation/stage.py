"""Stage exact existing CI bytes after wrapper digest and all compiled-file checks."""
import hashlib,io,json,pathlib,sys,zipfile
root=pathlib.Path(__file__).resolve().parents[3]
meta=json.loads(pathlib.Path(sys.argv[2]).read_text());wrapper=pathlib.Path(sys.argv[1]).read_bytes()
assert hashlib.sha256(wrapper).hexdigest()==meta['digest'].removeprefix('sha256:')
assert meta['workflow_run']['head_sha']=='c2fa68b38ea352e7de485ff67ce623264d980d01' and not meta['expired']
with zipfile.ZipFile(io.BytesIO(wrapper)) as z:
 assert z.namelist()==['dropshredder-0.2.0-chrome.zip'];payload=z.read(z.namelist()[0])
build=json.loads((root/'tools/browser-smoke/candidate-build-info.json').read_text());assert build['sourceCommit']=='9aed11c9d26f79ba1f1824a92ccc1adec78905ce'
expected={f['path']:f for f in build['buildFiles']};assert len(expected)==54
dest=root/'.output/chrome-mv3';assert not dest.exists()
with zipfile.ZipFile(io.BytesIO(payload)) as z:
 assert len(z.namelist())==len(expected) and set(z.namelist())==set(expected)
 for name in z.namelist():
  b=z.read(name);assert len(b)==expected[name]['bytes'] and hashlib.sha256(b).hexdigest()==expected[name]['sha256']
  p=dest/name;assert p.resolve().is_relative_to(dest.resolve());p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
out=root/'browser-smoke-results';out.mkdir(exist_ok=True)
(out/'candidate-package-verified.json').write_text(json.dumps({'sourceCommit':build['sourceCommit'],'artifact':meta['id'],'artifactDigest':meta['digest'],'zipSha256':hashlib.sha256(payload).hexdigest(),'zipBytes':len(payload),'allPackageHashesMatch':True,'files':len(expected),'rebuilt':False},indent=2)+'\n')
print('Exact CI package staged:',len(expected),'files',hashlib.sha256(payload).hexdigest())
