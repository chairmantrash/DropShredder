"""Bounded anonymous source captures for diagnosis, not native verdict tests."""
import concurrent.futures,datetime,hashlib,json,pathlib,subprocess,urllib.parse
ROOT=pathlib.Path(__file__).resolve().parents[3];OUT=ROOT/'coverage100-diagnosis';OUT.mkdir(exist_ok=True)
targets=json.loads((ROOT/'tools/beta/coverage100/targets.json').read_text())['targets']
def capture(t):
 row={**t,'observedAt':datetime.datetime.now(datetime.timezone.utc).isoformat()};p=OUT/(t['id']+'.html')
 try:
  r=subprocess.run(['curl','-L','--proto','=https,http','--proto-redir','=https,http','--max-redirs','4','--connect-timeout','8','--max-time','22','--max-filesize','4000000','-sS','-A','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/156.0.0.0 Safari/537.36','-o',str(p),'-w','%{http_code}\n%{url_effective}',t['url']],capture_output=True,text=True,timeout=26)
  m=r.stdout.splitlines();row['status']=int(m[0]) if m else 0;row['responseUrl']=m[1] if len(m)>1 else t['url']
  if r.returncode:raise ValueError(r.stderr[:300])
  if urllib.parse.urlsplit(row['responseUrl']).hostname.removeprefix('www.')!=t['host']:raise ValueError('Cross-host redirect; excluded from detached diagnosis')
  b=p.read_bytes();row['sha256']=hashlib.sha256(b).hexdigest();row['bytes']=len(b)
 except Exception as e:row['error']=str(e)[:300];row['status']=0
 return row
rows=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=16) as pool:
 for r in pool.map(capture,targets):
  rows.append(r)
  if len(rows)%25==0:print(json.dumps({'captured':len(rows),'http200':sum(r['status']==200 for r in rows)}),flush=True)
  (OUT/'source-receipts.json').write_text(json.dumps(rows,indent=2)+'\n')
print('Capture complete',len(rows),flush=True)
