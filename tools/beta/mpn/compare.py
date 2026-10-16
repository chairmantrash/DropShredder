"""Compare measured beta observations; never treat historical labels as accuracy truth."""
import collections,json,pathlib
root=pathlib.Path(__file__).resolve().parents[3]
before=json.loads((root/'workplane/runs/DS-057-PAGE-OUTCOMES-20261016.json').read_text())
after=json.loads((root/'workplane/runs/DS-058-PAGE-OUTCOMES-20261016.json').read_text())
assert before['summary']['manifestSha256']==after['summary']['manifestSha256']
assert len(before['pages'])==len(after['pages'])==268
old={p['id']:p for p in before['pages']};rows=[]
for p in after['pages']:
 b=old[p['id']];pre=b.get('scan',{}).get('product',{});post=p.get('scan',{}).get('product',{})
 if pre.get('mpn')!=post.get('mpn') or b['status']!=p['status']:
  rows.append({'id':p['id'],'url':p['url'],'beforeStatus':b['status'],'afterStatus':p['status'],'beforeMpn':pre.get('mpn'),'afterMpn':post.get('mpn'),'afterSku':post.get('sku'),'manufacturerCodeObservation':p.get('manufacturerCodeObservation')})
result={'scope':'Same frozen public targets; different live responses and repaired collector isolation. Code identity is from explicit merchant labels, not independently verified manufacture. No fraud/dropshipping accuracy claim.','before':{k:before['summary'][k] for k in ['accessibleDistinctPages','distinctHostnames','positiveWeightEvidencePages','severeWarningPages','rowStatusCounts']},'after':{k:after['summary'][k] for k in ['accessibleDistinctPages','distinctHostnames','positiveWeightEvidencePages','severeWarningPages','rowStatusCounts']},'beforeMpnReports':sum(bool(p.get('scan',{}).get('product',{}).get('mpn')) for p in before['pages']),'afterMpnReports':sum(bool(p.get('scan',{}).get('product',{}).get('mpn')) for p in after['pages']),'changes':rows}
(root/'workplane/runs/DS-058-BEFORE-AFTER-20261016.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k!='changes'},indent=2))
