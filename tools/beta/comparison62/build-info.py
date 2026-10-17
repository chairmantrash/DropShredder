"""Pin every byte of this exact compiled candidate before invoking the unmodified package check."""
import pathlib,hashlib,subprocess,json
root=pathlib.Path(__file__).resolve().parents[3]
(root/'workplane/runs/DS-062').mkdir(parents=True,exist_ok=True)
output=root/'.output/chrome-mv3'
files=[{'path':str(p.relative_to(output)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(output.rglob('*')) if p.is_file()]
info={'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'sourceTree':subprocess.check_output(['git','rev-parse','HEAD^{tree}'],cwd=root,text=True).strip(),'version':'0.2.0','reviewedChange':'DS-062 bounded explicit public comparison and typed matching; exact built candidate, no accuracy claim','buildFiles':files}
(root/'tools/browser-smoke/candidate-build-info.json').write_text(json.dumps(info,indent=2)+'\n')
(root/'workplane/runs/DS-062/candidate-build-info.json').write_text(json.dumps(info,indent=2)+'\n')
print('Pinned',len(files),'files',sum(f['bytes'] for f in files),'bytes')
