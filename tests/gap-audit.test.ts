import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { parseHTML } from 'linkedom';
import { calculateVerdict, dedupeEvidence } from '../src/analysis/evidence-engine';
import { analyzeReturnPolicy } from '../src/analysis/return-policy';
import { contradictionEvidence, businessAgeContradictions } from '../src/analysis/contradictions';
import { buildSupplyChainProfile } from '../src/analysis/supply-chain-profile';
import { qualityClaimEvidence } from '../src/analysis/quality-claims';
import { analyzeReputationObservations } from '../src/reputation/complaint-analysis';
import { reviewDiscrepancyEvidence } from '../src/reputation/review-discrepancy';
import { normalizeDisplayPreferences, DISPLAY_KEY } from '../src/ui/preferences';
import { publicEvidenceUrl } from '../src/security/public-url';
import { exportCurrentReport, readPanelReport } from '../src/reporting/export-report';
import { renderShopperReport } from '../src/ui/report-renderer';
import { mountPanelControls } from '../src/ui/panel-controls';
import { setReportGuard } from '../src/ui/report-guard';
import { lookupRecallCandidates, recallQueryUrl, parseRecallCandidates } from '../src/osint/cpsc';
import type { DropShredderReport } from '../src/types/report';

const report=():DropShredderReport=>({version:1,product:{url:'https://shop.example/product?token=secret#x',domain:'shop.example',title:'Lamp',brand:'Acme',mpn:'X100',capturedAt:'2026-10-08T00:00:00Z',imageUrls:['https://img.example/private'],jsonLdProductCount:1,claims:[],pageSignals:[]},merchant:{domain:'shop.example',email:'person@example.com'},evidence:[{id:'DIRECT',family:'provenance',severity:'direct',confidence:1,weight:30,title:'Exact identifier',explanation:'Observed https://upstream.example/p?token=secret#fragment',independentKey:'product',observedValue:'contact person@example.com; token=secret',provenance:{sourceUrl:'https://upstream.example/p?token=secret#fragment',observedAt:'2026-10-08',method:'exact identifier comparison'}},{id:'INFO',family:'technology',severity:'info',confidence:1,weight:0,title:'Platform context',explanation:'No accusation',independentKey:'context'}],contradictions:[],verdict:calculateVerdict([])});
const external={source:'Trustpilot',url:'https://www.trustpilot.com/review/shop.example',rating:1.8,reviewCount:100,snippets:['Poor quality material.','Flimsy stitching.','Cheap material.', 'High priced junk.']};
const notice={RecallID:123,RecallNumber:'25123',Title:'Acme X100 lamps recalled',Description:'Some X100 units, with specific serials.',URL:'https://www.cpsc.gov/Recalls/2025/example?secret=x',RecallDate:'2025-01-01',Products:[{Name:'Lamps',Model:'X100'}]};
const tick=()=>new Promise<void>(resolve=>setImmediate(resolve));

async function dom(fn:(document:Document,window:ReturnType<typeof parseHTML>,writes:unknown[])=>void|Promise<void>){
 const window=parseHTML(fs.readFileSync('entrypoints/sidepanel/index.html','utf8')),g=globalThis as unknown as Record<string,unknown>;
 const keys=['document','MutationObserver','chrome'],old=keys.map(k=>g[k]),writes:unknown[]=[];
 g.document=window.document;g.MutationObserver=window.MutationObserver;g.chrome={storage:{local:{get:async()=>({}),set:async(value:unknown)=>{writes.push(value);}}},permissions:{request:async()=>false}};
 // LinkeDOM omits native default selection; emulate only that documented DOM-harness limitation.
 for(const s of window.document.querySelectorAll('select')) if(!s.value && s.firstElementChild) (s.firstElementChild as HTMLOptionElement).selected=true;
 try{await fn(window.document as unknown as Document,window,writes);}finally{keys.forEach((k,i)=>{if(old[i]===undefined)delete g[k];else g[k]=old[i];});}
}
function select(doc:Document,id:string,value:string){const o=[...doc.querySelectorAll<HTMLOptionElement>('#'+id+' option')].find(o=>o.value===value);if(o)o.selected=true;}

test('refund processing time and delivery time are not return deadlines',()=>{
 for(const text of ['Refund processed within 3 business days. Returns accepted within 30 days.','Delivery takes 5 days. Return items within 30 days.','Refund within 7 days after approval.'])
  assert.equal(analyzeReturnPolicy(text).some(e=>e.id==='VERY_SHORT_RETURN_WINDOW'),false);
});
test('explicit short return deadlines remain detectable',()=>{
 for(const text of ['Return within 5 days of delivery.','Returns accepted within 7 calendar days.','A 3-day return window applies.','You have 7 days to return the item.'])
  assert.ok(analyzeReturnPolicy(text).some(e=>e.id==='VERY_SHORT_RETURN_WINDOW'),text);
});
test('negated and zero return charges do not create warnings',()=>{
 for(const text of ['No 25% restocking fee applies.','A 0% restocking fee applies.','Customers are not responsible for international return costs.'])
  assert.equal(analyzeReturnPolicy(text).filter(e=>e.weight>0).length,0,text);
});
test('contact/RMA and warehouse inspection alone are informational',()=>{
 const e=analyzeReturnPolicy('Contact us for return instructions. Refund issued once warehouse has received and inspected the return.');
 assert.ok(e.length);assert.ok(e.every(x=>x.weight===0));assert.equal(calculateVerdict(e).merchantRisk,'unknown');
});
test('one return-policy observation cannot masquerade as several sources',()=>{
 const e=analyzeReturnPolicy('Customers pay international return costs. Return within 3 days. A 25% restocking fee applies.');
 assert.ok(e.length>=2);assert.equal(dedupeEvidence(e).length,1);
});
test('a younger domain is not proof an older business-age claim is deceptive',()=>{
 const c=businessAgeContradictions([{kind:'business-age',text:'Established 1990',normalizedValue:'1990',confidence:1}],{source:'RDAP',registeredAt:'2025-01-01'});
 assert.equal(c.length,1);assert.equal(contradictionEvidence(c)[0]?.weight,0);assert.equal(calculateVerdict(contradictionEvidence(c)).deceptionRisk,'unknown');
});
test('supply-chain pronouns and incidental policy geography do not establish roles',()=>{
 const p=buildSupplyChainProfile({mainPageText:'Made by us. Contact us.',pages:[{kind:'returns',url:'https://shop.example/returns',text:'We comply with United States law. Contact us for returns.'}]});
 assert.equal(p.classification,'unknown');assert.equal(p.nodes.some(n=>n.country),false);
});
test('conflicting role jurisdictions abstain and unobserved chain stays unknown',()=>{
 const p=buildSupplyChainProfile({mainPageText:'Made in China and United States.',pages:[]});assert.equal(p.classification,'unknown');
 const q=buildSupplyChainProfile({mainPageText:'Made in China.',pages:[{kind:'shipping',url:'https://shop.example/s',text:'Ships from China.'},{kind:'returns',url:'https://shop.example/r',text:'Return address: China.'}]});
 assert.match(q.label,/REST OF CHAIN UNKNOWN/);assert.match(q.preferenceNote,/unobserved/i);
});
test('numeric poison and duplicate snippets cannot establish public complaint volume',()=>{
 for(const rating of [-1,NaN,Infinity,8]) assert.equal(analyzeReputationObservations([{...external,rating,snippets:[]}]).length,0);
 assert.equal(analyzeReputationObservations([{...external,rating:undefined,reviewCount:undefined,snippets:['refund received quickly','refund received quickly','refund received quickly']}]).length,0);
});
test('the same provider URL with different labels does not create source independence',()=>{
 const e=analyzeReputationObservations([external,{...external,source:'Independent review site'}]);assert.equal(e.length,1);assert.equal(e[0]?.severity,'moderate');
});
test('quality complaints need volume from their own source and no negation',()=>{
 assert.equal(qualityClaimEvidence('Premium quality',[{...external,reviewCount:2},{source:'Sitejabber',url:'https://sitejabber.com/p',reviewCount:500}]).length,0);
 assert.equal(qualityClaimEvidence('Premium quality',[{...external,snippets:['Not poor quality.','Not cheap material.']}]).length,0);
});
test('independent sources can corroborate a quality concern, with shared complaint ancestry',()=>{
 const second={...external,source:'Sitejabber',url:'https://sitejabber.com/p',snippets:['Fell apart after washing.','Frayed seams.']};
 const e=qualityClaimEvidence('Premium quality',[external,second]);assert.equal(e[0]?.severity,'strong');
 assert.equal(dedupeEvidence([...e,...analyzeReputationObservations([external,second])]).length,1);
});
test('rating gaps require matching subject and scope before scoring',()=>{
 const hosted={rating:4.9,reviewCount:100,source:'Store'};
 assert.equal(reviewDiscrepancyEvidence(hosted,external)[0]?.weight,0);
 assert.equal(reviewDiscrepancyEvidence({...hosted,scope:'product',subjectId:'X'}, {...external,scope:'merchant',subjectId:'X'})[0]?.weight,0);
 assert.equal(reviewDiscrepancyEvidence({...hosted,scope:'merchant',subjectId:'shop.example'}, {...external,scope:'merchant',subjectId:'shop.example'})[0]?.severity,'strong');
 assert.equal(reviewDiscrepancyEvidence({...hosted,rating:NaN},external).length,0);
});
test('display preference validation is bounded and independent of evidence thresholds',()=>{
 assert.deepEqual(normalizeDisplayPreferences({theme:'javascript:',textScale:999,density:'bad',autoProtection:true}),{theme:'dark',density:'comfortable',textScale:100});
 assert.deepEqual(normalizeDisplayPreferences({theme:'system',textScale:130,density:'compact'}),{theme:'system',density:'compact',textScale:130});
});
test('public source links reject credentials, local/private destinations and executable schemes',()=>{
 for(const url of ['javascript:alert(1)','https://user:secret@shop.example/p','https://127.0.0.1/p','https://localhost/p','https://intranet.local/p','https://[::1]/p','https://shop.example:8080/p']) assert.equal(publicEvidenceUrl(url),undefined);
 assert.equal(publicEvidenceUrl('https://shop.example/p?token=x#fragment'),'https://shop.example/p');
});
test('scan export excludes raw contacts/images and redacts URL/text secrets',()=>{
 const value=exportCurrentReport(report()),json=JSON.stringify(value);
 assert.doesNotMatch(json,/secret|person@example|img\.example|contactEmails/);assert.match(json,/upstream\.example\/p/);
 assert.equal(readPanelReport('bad'),undefined);assert.equal(readPanelReport('x'.repeat(2_000_001)),undefined);
 assert.equal(readPanelReport(JSON.stringify(report()))?.product.title,'Lamp');
});
test('renderer labels direct evidence correctly and safely exposes source/method',async()=>dom(doc=>{
 const p=report();p.evidence[0]!.title='<img src=x onerror=alert(1)>';
 renderShopperReport(p,{summary:doc.getElementById('summary')!,evidenceList:doc.getElementById('evidence')!,raw:doc.getElementById('raw')!},'professional');
 assert.equal(doc.querySelector('.severity-direct .evidence-head span')?.textContent,'DIRECT');assert.equal(doc.querySelector('#evidence img'),null);
 const a=doc.querySelector<HTMLAnchorElement>('#evidence a')!;assert.equal(a.getAttribute('href'),'https://upstream.example/p');assert.equal(a.rel,'noopener noreferrer');
 assert.match(doc.getElementById('summary')!.textContent!,/not measured probabilities/);assert.match(doc.getElementById('evidence')!.textContent!,/exact identifier comparison/);
}));
test('renderer bounds evidence work and does not claim missing source details',async()=>dom(doc=>{
 const p=report();p.evidence=Array.from({length:350},(_,i)=>({...p.evidence[1]!,id:String(i)}));
 renderShopperReport(p,{summary:doc.getElementById('summary')!,evidenceList:doc.getElementById('evidence')!,raw:doc.getElementById('raw')!},'professional');
 assert.equal(doc.querySelectorAll('.evidence-row').length,300);assert.match(doc.getElementById('evidence')!.textContent!,/first 300 of 350/);
 assert.match(doc.getElementById('evidence')!.textContent!,/did not record a source/);
}));
test('panel filters report hidden counts and invalidate export after report removal',async()=>dom(async(doc,window)=>{
 renderShopperReport(report(),{summary:doc.getElementById('summary')!,evidenceList:doc.getElementById('evidence')!,raw:doc.getElementById('raw')!},'professional');
 const controls=mountPanelControls(doc);await tick();
 select(doc,'evidence-filter','warnings');doc.getElementById('evidence-filter')!.dispatchEvent(new window.Event('change'));
 assert.equal(doc.querySelector('.severity-info')?.hasAttribute('hidden'),true);assert.match(doc.getElementById('evidence-count')!.textContent!,/1 of 2/);
 const search=doc.getElementById('evidence-query') as HTMLInputElement;search.value='no match';search.dispatchEvent(new window.Event('input'));assert.match(doc.getElementById('evidence-count')!.textContent!,/0 of 2/);
 doc.getElementById('raw')!.textContent='';await tick();assert.equal((doc.getElementById('export-report') as HTMLButtonElement).disabled,true);controls.dispose();
}));
test('panel customization persists validated appearance and reset restores display only',async()=>dom(async(doc,window,writes)=>{
 const controls=mountPanelControls(doc);await tick();select(doc,'display-theme','light');select(doc,'display-scale','130');
 doc.getElementById('display-theme')!.dispatchEvent(new window.Event('change'));await tick();
 assert.equal(doc.documentElement.dataset.theme,'light');assert.equal(doc.documentElement.dataset.textScale,'130');
 assert.deepEqual((writes.at(-1) as Record<string,unknown>)[DISPLAY_KEY],{theme:'light',density:'comfortable',textScale:130});
 doc.getElementById('reset-display')!.dispatchEvent(new window.Event('click'));await tick();assert.equal(doc.documentElement.dataset.theme,'dark');controls.dispose();
}));
test('recall query uses only documented nonempty bounded parameters',()=>{
 const u=new URL(recallQueryUrl('Anker'));assert.equal(u.searchParams.get('RecallTitle'),'Anker');assert.equal(u.searchParams.get('format'),'json');
 for(const query of ['', 'x','%%','https://private.example/p','me@example.com','x'.repeat(101)]) assert.throws(()=>recallQueryUrl(query));
 assert.throws(()=>recallQueryUrl('123','UPC'));assert.throws(()=>recallQueryUrl('Anker','brand' as never));
});
test('recall parser returns candidate scope, discards hostile links and caps results',()=>{
 const r=parseRecallCandidates([notice,{...notice,RecallID:124,URL:'https://cpsc.gov.evil.example/Recalls/x'}], 'X100');
 assert.equal(r.candidates.length,1);assert.equal(r.candidates[0]?.modelMentioned,true);assert.equal(r.candidates[0]?.url,'https://www.cpsc.gov/Recalls/2025/example');
 assert.equal(parseRecallCandidates([notice],'X10').candidates[0]?.modelMentioned,false);
 const capped=parseRecallCandidates(Array.from({length:220},(_,i)=>({...notice,RecallID:i+1})));assert.equal(capped.candidates.length,12);assert.equal(capped.inspected,200);assert.equal(capped.truncated,true);
 assert.throws(()=>parseRecallCandidates({not:'records'}));
});
test('recall denied permission makes no request and permission starts synchronously',async()=>{
 let permissionStarted=false,requests=0;
 const result=lookupRecallCandidates('Anker','RecallTitle',undefined,new AbortController().signal,{requestPermission:()=>{permissionStarted=true;return Promise.resolve(false);},fetch:async()=>{requests++;throw Error('No fetch');}});
 assert.equal(permissionStarted,true);assert.equal(await result,undefined);assert.equal(requests,0);
});
test('recall cancellation after consent makes no network request',async()=>{
 const controller=new AbortController();let resolve!:(v:boolean)=>void,requests=0;
 const task=lookupRecallCandidates('Anker','RecallTitle',undefined,controller.signal,{requestPermission:()=>new Promise(r=>{resolve=r;}),fetch:async()=>{requests++;throw Error('No fetch');}});
 controller.abort();resolve(true);await assert.rejects(task,{name:'AbortError'});assert.equal(requests,0);
});
test('recall network work omits credentials, refuses redirects and returns inert candidates',async()=>{
 let options:RequestInit|undefined;
 const r=await lookupRecallCandidates('Anker','RecallTitle','X100',new AbortController().signal,{requestPermission:async()=>true,fetch:async(_url,init)=>{options=init;return new Response(JSON.stringify([notice]),{headers:{'content-type':'application/json'}});}});
 assert.equal(options?.credentials,'omit');assert.equal(options?.redirect,'error');assert.equal(options?.referrerPolicy,'no-referrer');assert.equal(r?.candidates.length,1);assert.equal('evidence' in r!,false);
});
test('recall bounds chunked responses and rejects invalid content or HTTP failures',async()=>{
 const lookup=(response:Response)=>lookupRecallCandidates('Anker','RecallTitle',undefined,new AbortController().signal,{requestPermission:async()=>true,fetch:async()=>response});
 await assert.rejects(lookup(new Response('no',{status:503})),/503/);
 await assert.rejects(lookup(new Response('<html>blocked</html>',{headers:{'content-type':'text/html'}})),/JSON/);
 await assert.rejects(lookup(new Response('[]',{headers:{'content-type':'application/json','content-length':'2000001'}})),/2 MB/);
 const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(1_000_001));c.enqueue(new Uint8Array(1_000_001));c.close();}});
 await assert.rejects(lookup(new Response(stream,{headers:{'content-type':'application/json'}})),/2 MB/);
});
test('base themes meet tested normal-text and badge contrast pairs',()=>{
 const css=fs.readFileSync('entrypoints/sidepanel/style.css','utf8');
 const luminance=(hex:string)=>{const h=hex.length===4?'#'+hex.slice(1).split('').map(c=>c+c).join(''):hex;
  const rgb=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*rgb[0]!+.7152*rgb[1]!+.0722*rgb[2]!;};
 for(const selector of [':root{',':root[data-theme="light"]{']){
  const block=css.slice(css.indexOf(selector)+selector.length).split('}')[0]!;
  const values=new Map([...block.matchAll(/--([\w-]+):(#[a-f\d]{3,6})/gi)].map(m=>[m[1]!,m[2]!]));
  for(const [fg,bg] of [['text','surface'],['muted','surface'],['dim','surface'],['dim','bg'],['code','surface'],['accent','bg'],['badge-text','badge-bg'],['watch-text','watch-bg']]){
   const a=luminance(values.get(fg!)!),b=luminance(values.get(bg!)!);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,`${selector} ${fg}/${bg}`);
  }
 }
});

test('export controls prepare a local bounded file without a third-party request',async()=>dom(async(doc,window)=>{
 setReportGuard(async()=>true);
 renderShopperReport(report(),{summary:doc.getElementById('summary')!,evidenceList:doc.getElementById('evidence')!,raw:doc.getElementById('raw')!},'professional');
 const controls=mountPanelControls(doc);await tick();let filename='';
 doc.body.addEventListener('click',e=>{const a=e.target as HTMLAnchorElement;if(a.tagName==='A')filename=a.download;});
 doc.getElementById('export-report')!.dispatchEvent(new window.Event('click'));
 await tick();
 assert.equal(filename,'DropShredder-current-scan.json');assert.match(doc.getElementById('controls-status')!.textContent!,/export prepared/);setReportGuard(async()=>false);controls.dispose();
}));
test('cancel and stale-report UI prevent a consent-delayed recall request',async()=>dom(async(doc,window)=>{
 const g=globalThis as unknown as Record<string,unknown>,originalFetch=g.fetch;let resolve!:(v:boolean)=>void,requests=0;
 const chrome=g.chrome as {permissions:{request:()=>Promise<boolean>}};
 chrome.permissions.request=()=>new Promise(r=>{resolve=r;});g.fetch=async()=>{requests++;throw Error('No request allowed');};
 const controls=mountPanelControls(doc);
 try{
  for(const cancelBy of ['button','navigation']){
   renderShopperReport(report(),{summary:doc.getElementById('summary')!,evidenceList:doc.getElementById('evidence')!,raw:doc.getElementById('raw')!},'professional');controls.refresh();
   doc.getElementById('recall-lookup')!.dispatchEvent(new window.Event('click'));
   assert.equal(typeof resolve,'function');
   if(cancelBy==='button')doc.getElementById('recall-cancel')!.dispatchEvent(new window.Event('click'));
   else{doc.getElementById('raw')!.textContent='';await tick();}
   resolve(true);await tick();assert.equal(requests,0);assert.equal(doc.getElementById('recall-results')!.children.length,0);
  }
 }finally{controls.dispose();g.fetch=originalFetch;}
}));
test('invalid or sensitive report payloads cannot enable export/recall utilities',()=>{
 const p=report();p.product.url='https://shop.example/account/orders';assert.equal(readPanelReport(JSON.stringify(p)),undefined);
 const invalid=report();(invalid.evidence as unknown[]).push(null);assert.equal(readPanelReport(JSON.stringify(invalid)),undefined);
 for(const modify of [
   (p:DropShredderReport)=>{p.product.brand=42 as never;},
   (p:DropShredderReport)=>{p.verdict.reason={secret:'private'} as never;},
   (p:DropShredderReport)=>{p.verdict.dropshipLikelihood=101;},
   (p:DropShredderReport)=>{p.evidence[0]!.family={secret:'private'} as never;}
 ]) {const malformed=report();modify(malformed);assert.equal(readPanelReport(JSON.stringify(malformed)),undefined);}
});
