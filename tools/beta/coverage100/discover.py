"""Anonymous bounded discovery; neither a detection nor native acceptance test."""
import concurrent.futures, datetime, hashlib, json, re, subprocess, urllib.parse
from html.parser import HTMLParser
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
HERE=Path(__file__).resolve().parent
OUT=ROOT/'coverage100-discovery';OUT.mkdir(exist_ok=True)
PRIVATE=re.compile(r'/(?:cart|checkout|account|login|signin|payment|admin|wp-admin)(?:[/.]|$)',re.I)
PRODUCT=re.compile(r'/(?:products?|item|items|p|dp|ip|pd|pdp)/[^/]+|/[^/]+(?:\.html?|\.aspx?)(?:\?|$)|/p[/?]?(?:$|\?)|/[^/]+-p\d+',re.I)
BLOCKED=re.compile(r'just a moment|access denied|verify you are human|robot check|buy this domain|website suspended|domain is for sale',re.I)
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.text=[];self.skip=0
 def handle_starttag(self,t,a):
  if t in ['script','style']:self.skip+=1
  if t=='a':self.links.extend(v for k,v in a if k=='href' and v)
 def handle_endtag(self,t):
  if t in ['script','style']:self.skip=max(0,self.skip-1)
 def handle_data(self,d):
  if not self.skip:self.text.append(d)
def fetch(seed):
 row={**seed,'status':'UNAVAILABLE','startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'targets':[]}
 host=urllib.parse.urlsplit(seed['url']).hostname;path=OUT/(hashlib.sha256(seed['url'].encode()).hexdigest()+'.html')
 try:
  r=subprocess.run(['curl','-L','--proto','=https,http','--proto-redir','=https,http','--max-redirs','4','--connect-timeout','8','--max-time','24','--max-filesize','4000000','-sS','-A','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/156.0.0.0 Safari/537.36','-o',str(path),'-w','%{http_code}\n%{url_effective}',seed['url']],capture_output=True,text=True,timeout=28)
  meta=r.stdout.splitlines();row['httpStatus']=int(meta[0]) if meta else 0;row['finalUrl']=meta[1] if len(meta)>1 else seed['url']
  if r.returncode:raise ValueError(r.stderr[:300])
  if row['httpStatus']!=200:raise ValueError('HTTP '+str(row['httpStatus']))
  payload=path.read_bytes();html=payload.decode('utf8',errors='replace');parser=Links();parser.feed(html)
  row['htmlSha256']=hashlib.sha256(payload).hexdigest();row['bytes']=len(payload)
  title=re.search(r'<title[^>]*>(.*?)</title>',html,re.I|re.S);row['title']=re.sub('<.*?>','',title[1])[:250] if title else ''
  if BLOCKED.search(row['title']):raise ValueError('Challenge or parked')
  dest=urllib.parse.urlsplit(row['finalUrl']);target_host=dest.hostname.removeprefix('www.')
  if PRIVATE.search(dest.path):raise ValueError('Private destination refused')
  urls=set()
  for href in parser.links[:6000]:
   u=urllib.parse.urlsplit(urllib.parse.urljoin(row['finalUrl'],href))
   if u.scheme not in ['http','https'] or u.hostname!=dest.hostname or PRIVATE.search(u.path) or not PRODUCT.search(u.path) or u.username or u.password:continue
   query=urllib.parse.urlencode([(k,v) for k,v in urllib.parse.parse_qsl(u.query) if k in ['products_id','product_id','id','pid','item','variant']])
   urls.add(urllib.parse.urlunsplit((u.scheme,u.netloc,u.path,query,'')))
  # Prior real product URL is preferred; otherwise deterministic discovery, never scored by result.
  selected=[row['finalUrl']] if seed.get('priorObservedTarget') else sorted(urls,key=lambda u:hashlib.sha256(u.encode()).hexdigest())[:1]
  if not selected:raise ValueError('No observed product URL in bounded HTML; homepage is not a product pass')
  row['status']='PUBLIC_PRODUCT_LEAD';row['targets']=[{'url':u,'host':target_host,'category':seed['category'],'sourceIds':seed['sourceIds'],'sourceSeedUrl':seed['url'],'scope':seed['scope'],'discoveryTitle':row['title'],'discoveryKind':'previous real product target' if seed.get('priorObservedTarget') else 'observed same-site product link'} for u in selected]
 except Exception as e:row['error']=str(e)[:500]
 row['finishedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();return row
seeds=json.loads((HERE/'seeds.json').read_text())['seeds'];records=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
 for r in pool.map(fetch,seeds):
  records.append(r)
  if len(records)%20==0:print(json.dumps({'checked':len(records),'leads':sum(x['status']=='PUBLIC_PRODUCT_LEAD' for x in records)}),flush=True)
  (OUT/'discovery.json').write_text(json.dumps({'records':records},indent=2)+'\n')
targets=[];seen=set()
for r in records:
 for t in r['targets']:
  if t['host'] not in seen:seen.add(t['host']);targets.append({'id':f'SITE-{len(targets)+1:04}',**t})
manifest={'protocol':'DS-060','frozenAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'poolSha256':hashlib.sha256((HERE/'seeds.json').read_bytes()).hexdigest(),'targets':targets,'counts':{'seeds':len(seeds),'hosts':len(seen),'pages':len(targets)},'limits':['Developer-selected category controls, not independent current merchant fraud labels','Every unavailable page retained; current source observations do not verify manufacture','One target per hostname; registered-domain and operator clustering measured separately']}
(HERE/'targets.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps(manifest['counts']),flush=True)
