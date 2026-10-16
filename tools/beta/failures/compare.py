"""Same-cohort functional comparison; historical allegations are never truth labels."""
import collections,json,pathlib,statistics,urllib.parse
root=pathlib.Path(__file__).resolve().parents[3]
before=json.loads((root/'workplane/runs/DS-058-PAGE-OUTCOMES-20261016.json').read_text())
after=json.loads((root/'workplane/runs/DS-059-PAGE-OUTCOMES-20261016.json').read_text())
old={p['id']:p for p in before['pages']};new={p['id']:p for p in after['pages']}
assert len(old)==268 and len(new)==269 and set(old)<set(new)
for id in old:assert old[id]['url']==new[id]['url']
assert len(after['summary']['nativeProfiles'])==8 and all(p['status']=='LIVE AUDIT COLLECTION COMPLETE' and not p['safetyStop'] for p in after['summary']['nativeProfiles'])
def observed(rows):
 seen=set();out=[]
 for p in rows:
  if p['status']!='OBSERVED_SCAN' or not p.get('scan'):continue
  u=urllib.parse.urlsplit(p['finalUrl']);key=(u.scheme,u.netloc,u.path,u.query)
  if key in seen:continue
  seen.add(key);out.append(p)
 return out
def stats(rows):
 rows=list(rows);scans=observed(rows);products=[p['scan']['product'] for p in scans]
 out={'outcomes':len(rows),'rowStatuses':dict(collections.Counter(p['status'] for p in rows)),'successfulDistinctScans':len(scans),'hosts':len({urllib.parse.urlsplit(p['finalUrl']).hostname.removeprefix('www.') for p in scans})}
 out['identityFields']={key:sum(p.get(key) is not None for p in products) for key in ['brand','sku','mpn','gtin','price','currency']}
 out['structuredProductResolved']=sum(p.get('extraction',{}).get('structuredIdentityResolved',False) for p in products)
 out['selectedOfferResolved']=sum(p.get('extraction',{}).get('offerResolved',False) for p in products)
 out['bothNumericalEstimatesUnknown']=sum(p['scan']['verdict']['massResellLikelihood'] is None and p['scan']['verdict']['dropshipLikelihood'] is None for p in scans)
 out['structuredAdmissionsWithUnresolvedExtractedPrice']=[p['id'] for p in scans if p.get('commerceAdmission',{}).get('reason','').startswith('current named structured') and p['scan']['product'].get('price') is None]
 durations=[a['elapsedMs'] for p in scans for a in p.get('actions',[]) if a['action']=='scan' and a.get('status')=='OBSERVED' and isinstance(a.get('elapsedMs'),(int,float))]
 if durations:out['nativeScanElapsedMs']={'observations':len(durations),'median':statistics.median(durations),'p95':sorted(durations)[min(len(durations)-1,int(.95*len(durations)))]}
 return out
changes=[]
for id,p in old.items():
 a=new[id];left=p.get('scan',{}).get('product',{});right=a.get('scan',{}).get('product',{})
 fields={key:{'before':left.get(key),'after':right.get(key)} for key in ['brand','sku','mpn','gtin','price','currency'] if left.get(key)!=right.get(key)}
 if fields or p['status']!=a['status']:changes.append({'id':id,'url':p['url'],'beforeStatus':p['status'],'afterStatus':a['status'],'fields':fields})
control=new['CONTROL-010']
result={'scope':'Original268 same targets compared separately; one additional public variant control. Changes include merchant responses, collector admission and product parsing, not independent detection accuracy. Baseline snapshot omitted specifications/shipping/fingerprints; no missing-field inference from those omissions.','beforeOriginal268':stats(old.values()),'afterOriginal268':stats(new[id] for id in old),'all269':stats(new.values()),'newPublicControl':control,'changes':changes,'independentAccuracyAccepted':False}
(root/'workplane/runs/DS-059-BEFORE-AFTER-20261016.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k not in ['newPublicControl','changes']},indent=2))
