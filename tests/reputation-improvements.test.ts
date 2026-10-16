import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {brandAffiliationEvidence} from '../src/analysis/brand-affiliation';
import {calculateVerdict} from '../src/analysis/evidence-engine';
import {fulfillmentDisclosure,fulfillmentDisclosureEvidence} from '../src/analysis/fulfillment-disclosure';
import {extractPageScan} from '../src/extraction/page-scan';
import {fetchPublicStorePages} from '../src/osint/public-store-pages';
import {COMMERCE_LANGUAGE_KIT as kit} from '../src/languages/commerce-kit';
import {publishedScamferretPaths,parsePublishedScamferret,lookupPublishedScamferret} from '../src/osint/scamferret-results';
import {urlscanCandidates,parseUrlscanResult,lookupUrlscan} from '../src/osint/urlscan';
import {consumerRecordLinks} from '../src/reputation/consumer-links';
import {mountOutsideResultControls} from '../src/ui/outside-result-controls';
import type {ProductSnapshot} from '../src/types/product';
import type {DropShredderReport} from '../src/types/report';
const now=new Date('2026-10-13T12:00:00Z'),url='https://shop.example.com/p/lamp';
const base:ProductSnapshot={url,domain:'shop.example.com',title:'Lamp',imageUrls:[],jsonLdProductCount:1,capturedAt:now.toISOString(),claims:[],pageSignals:[]};
const uuid='01a0a511-4386-77a7-8fd0-baac8b918a2c';

test('official-store claim is a dated partial-directory notice, never proof of fraud or dropshipping',()=>{
 const s=brandAffiliationEvidence({...base,domain:'nike-blazer.de',merchantIdentity:['Nike offizielle Deutschland']});
 assert.equal(s[0]?.id,'OFFICIAL_STORE_CLAIM_UNVERIFIED');assert.match(s[0]!.explanation,/incomplete/);
 const v=calculateVerdict(s);assert.equal(v.dropshipLikelihood,null);assert.equal(v.massResellLikelihood,null);assert.equal(v.severeWarningAllowed,false);
 assert.equal(s[0]!.provenance?.sourceUrl,url);assert.equal(s[0]!.referenceUrls?.[0],'https://www.nike.com/');
});
test('official host, ordinary reseller, negated affiliation and licensed-product language do not generate adverse notices',()=>{
 for(const p of [
  {...base,domain:'www.nike.com',merchantIdentity:['Nike Official Store']},
  {...base,domain:'footlocker.com',brand:'Nike',merchantIdentity:['Foot Locker official store']},
  {...base,domain:'nike-fans.example.com',merchantIdentity:['Unofficial Nike store']},
  {...base,domain:'nike-shoes.example.com',merchantIdentity:['Not the official Nike store']},
  {...base,domain:'retailer.example.com',merchantIdentity:['Officially licensed Nike jersey']},
  {...base,domain:'glowart.example.com',merchantIdentity:['Glow Art official store']},
 ])assert.equal(brandAffiliationEvidence(p).filter(e=>e.weight>0).length,0);
});
test('official-domain lookalike is not trusted, and stale/future/invalid reference chronology abstains',()=>{
 assert.equal(brandAffiliationEvidence({...base,domain:'nike.com.evil.example.com',merchantIdentity:['Nike Official Store']})[0]?.id,'OFFICIAL_STORE_CLAIM_UNVERIFIED');
 for(const capturedAt of ['2025-01-01','2028-01-01','not a date'])assert.deepEqual(brandAffiliationEvidence({...base,domain:'nike-blazer.de',merchantIdentity:['Nike official store'],capturedAt}),[]);
});
test('supplier/factory dispatch is a model disclosure with zero adverse weight; denials and review quotes abstain',()=>{
 for(const [text,model] of [['We ship your orders directly from our suppliers.','supplier-direct'],['Ships directly from the factory.','factory-direct']] as const){
  const d=fulfillmentDisclosure([{text,url}],now.toISOString());assert.equal(d?.model,model);
  const e=fulfillmentDisclosureEvidence(d);assert.equal(e[0]?.weight,0);assert.equal(calculateVerdict(e).dropshipLikelihood,null);
 }
 for(const text of ['We do not ship directly from suppliers.','Customer review: "we ship directly from the factory".','We ship from our warehouse.'])assert.equal(fulfillmentDisclosure([{text,url}],now.toISOString()),undefined);
});
function setup(html:string){
 const w=parseHTML(html),doc=w.document as unknown as Document,g=globalThis as unknown as Record<string,unknown>;
 for(const [name,tag] of [['scripts','script'],['images','img']] as const){const list=[...doc.getElementsByTagName(tag)];Object.defineProperty(doc,name,{value:{length:list.length,item:(i:number)=>list[i]}});}
 const values={document:doc,window:w,location:new URL(url),DOMParser:w.DOMParser,NodeFilter:{SHOW_TEXT:4,SHOW_ELEMENT:1},HTMLElement:w.HTMLElement};
 const old=Object.fromEntries(Object.keys(values).map(k=>[k,g[k]]));Object.assign(g,values);
 return {doc,restore:()=>{for(const k of Object.keys(values))if(old[k]===undefined)delete g[k];else g[k]=old[k];}};
}
test('current /p/ page retains labeled brand/SKU and merchant site suffix, excluding related and dormant-private values',()=>{
 const product={'@type':'Product',name:'Lamp',url,offers:{price:12,priceCurrency:'USD'}};
 const d=setup(`<html><head><title>Lamp | Nike official store</title><script type="application/ld+json">${JSON.stringify(product)}</script></head><body><form hidden><input type="password" value="PRIVATE"><p>Marca: PRIVATE SKU: PRIVATE</p></form><main><h1>Lamp</h1><p>Marca: Adidas <br> Color: Blue</p><p>SKU: PUB-12</p><p>Manufacturer Code: GW3773</p><div class="related"><p>Marca: Other</p><p>SKU: OTHER-99</p></div><button>Add to cart</button></main></body></html>`);
 try{for(const input of d.doc.querySelectorAll('input'))Object.defineProperty(input,'value',{get(){throw Error('Private value read');}});
  const s=extractPageScan(kit);assert.equal(s.product.brand,'Adidas');assert.equal(s.product.sku,'PUB-12');assert.equal(s.product.mpn,'GW3773');assert.deepEqual(s.product.merchantIdentity,['Nike official store']);assert.doesNotMatch(JSON.stringify(s),/PRIVATE/);assert.doesNotMatch(JSON.stringify(s.product),/OTHER-99/);
 }finally{d.restore();}
});
function response(text:string,target=url,status=200){const r=new Response(text,{status,headers:{'content-type':'text/html'}});Object.defineProperty(r,'url',{value:target});return r;}
test('fetched detached policy excludes script/hidden/credential text without inspecting field values',async()=>{
 const d=setup('<html><body></body></html>'),old=globalThis.fetch;
 globalThis.fetch=async(_,options)=>{assert.equal(options?.credentials,'omit');assert.equal(options?.referrerPolicy,'no-referrer');return response('<html><body><script>SECRET</script><form><input type="password" value="PRIVATE"><p>PRIVATE login account</p></form><p style="display:none">HIDDEN</p><p>Returns within 30 days.</p></body></html>','https://shop.example.com/returns');};
 try{const r=await fetchPublicStorePages([{kind:'returns',url:'https://shop.example.com/returns'}],kit.privateFormParts);assert.equal(r[0]?.text,'Returns within 30 days.');}finally{globalThis.fetch=old;d.restore();}
});
test('policy HTTP failures remain data; private/unrelated/query-token destinations never fetch',async()=>{
 const d=setup('<html><body></body></html>'),old=globalThis.fetch;let requests=0;
 globalThis.fetch=async()=>{requests++;return response('unavailable','https://shop.example.com/returns',503);};
 try{assert.equal((await fetchPublicStorePages([{kind:'returns',url:'https://shop.example.com/returns'}],kit.privateFormParts))[0]?.httpStatus,503);
  for(const url of ['https://shop.example.com/account/login','https://shop.example.com/returns?session=PRIVATE','https://other.example.com/returns'])assert.equal((await fetchPublicStorePages([{kind:'returns',url}],kit.privateFormParts))[0]?.text,undefined);
  assert.equal(requests,1);
 }finally{globalThis.fetch=old;d.restore();}
});
test('published ScamFerret uses original strict output and source date, never its dataset folder label',()=>{
 const path=publishedScamferretPaths('yeezys.com.mx')[0]!;assert.ok(path);
 const record={target_url:'https://www.yeezys.com.mx/p/item',start_time:'2025-08-31 03:44:21',llm_response:{scam:false,reason:'No evidence returned.'}};
 const r=parsePublishedScamferret(record,'yeezys.com.mx',path,now)!;assert.equal(r.outcome,'no-listed-concern');assert.equal(r.reportedAt,'2025-08-31');assert.equal(r.stale,true);
 assert.equal(parsePublishedScamferret({...record,target_url:'https://other.example.com'},'yeezys.com.mx',path,now),undefined);
 const invalid=parsePublishedScamferret({...record,llm_response:"{'scam': True}"},'yeezys.com.mx',path,now)!;assert.equal(invalid.outcome,'unclassified');
 assert.deepEqual(publishedScamferretPaths('not-in-published-source.example.com'),[]);
});
test('published lookup performs no request for an unknown domain and only pinned source GETs for a known one',async()=>{
 let calls=0;const request:typeof fetch=async(u,o)=>{calls++;assert.equal(o?.credentials,'omit');assert.equal(new URL(String(u)).hostname,'raw.githubusercontent.com');assert.ok(new URL(String(u)).pathname.startsWith('/ScamFerret/artifact/8cf8dc631edafe584141e2f95f0c0f51855fb7bc/'));return new Response(JSON.stringify({target_url:'https://yeezys.com.mx/',start_time:'2025-08-31 00:00:00',llm_response:{scam:true,reason:'Historical outside opinion'}}),{headers:{'content-type':'text/plain; charset=utf-8'}});};
 assert.deepEqual(await lookupPublishedScamferret('not-in-published-source.example.com',new AbortController().signal,request,now),[]);assert.equal(calls,0);
 const r=await lookupPublishedScamferret('yeezys.com.mx',new AbortController().signal,request,now);assert.ok(r.length);assert.ok(calls<=2);assert.ok(r.every(r=>r.stale));
});
const task={uuid,time:'2026-10-08T01:00:00Z',url:'https://shop.example.com/p/lamp'},page={url:'https://shop.example.com/p/lamp'};
test('security search ignores mismatches, invalid dates and stale rows; provider redirect URLs cannot select endpoints',()=>{
 const candidate={task,page,result:'https://evil.example.com/steal'};
 assert.deepEqual(urlscanCandidates({results:[candidate]},'shop.example.com',now),[uuid]);
 for(const changed of [{task:{...task,time:'nonsense'},page},{task:{...task,time:'2020-01-01'},page},{task,page:{url:'https://shop.example.com.evil.example/p'}}])assert.deepEqual(urlscanCandidates({results:[changed]},'shop.example.com',now),[]);
});
test('security verdict is scoped to an archived matching page; empty/mismatched records are not merchant clearance',()=>{
 const d={task,page,stats:{dataLength:500},verdicts:{urlscan:{malicious:false}}};const r=parseUrlscanResult(d,'shop.example.com',uuid,now)!;
 assert.equal(r.outcome,'no-listed-concern');assert.equal(r.scope,'security');assert.match(r.reason,/not a merchant-trust/);
 assert.equal(parseUrlscanResult({...d,stats:{dataLength:0}},'shop.example.com',uuid,now),undefined);
 assert.equal(parseUrlscanResult({...d,task:{...task,uuid:'invalid'}},'shop.example.com',uuid,now),undefined);
});
test('security lookup has at most three credentialless bounded GETs, and query is domain-only',async()=>{
 const calls:string[]=[];const request:typeof fetch=async(u,o)=>{calls.push(String(u));assert.equal(o?.credentials,'omit');assert.equal(o?.redirect,'error');
  return new Response(JSON.stringify(calls.length===1?{results:[{task,page}]}:{task,page,stats:{dataLength:500},verdicts:{urlscan:{malicious:true}}}),{headers:{'content-type':'application/json'}});};
 const r=await lookupUrlscan('shop.example.com',new AbortController().signal,request,now);assert.equal(calls.length,2);assert.equal(r[0]?.outcome,'reported-concern');
 assert.doesNotMatch(decodeURIComponent(calls[0]!),/\/p\/lamp|PRIVATE/);assert.match(calls[1]!,/^https:\/\/urlscan.io\/api\/v1\/result\/[a-f0-9-]+\/$/);
});
test('consumer navigation has only approved originals and rejects injected/private domains',()=>{
 const links=consumerRecordLinks('www.shop.example.com');assert.equal(links.length,6);
 assert.ok(links.every(l=>['www.trustpilot.com','www.bbb.org','www.ftc.gov','www.cpsc.gov','competition-bureau.canada.ca','www.gob.mx'].includes(new URL(l.url).hostname)));
 for(const v of ['localhost','127.0.0.1','shop.example.com/path','shop.example.com?email=private','user@shop.example.com'])assert.throws(()=>consumerRecordLinks(v));
});
test('native widget model never links to outside scam services or requests data after failed current-page guard',async()=>{
 const d=setup('<html><body><button id="outside-scamferret"></button><button id="outside-security"></button><button id="outside-cancel"></button><p id="outside-status"></p><div id="outside-results"></div><div id="consumer-record-links"></div></body></html>');
 const g=globalThis as unknown as Record<string,unknown>,oldChrome=g.chrome,oldFetch=globalThis.fetch;let calls=0,permissions=0;
 g.chrome={permissions:{request:async()=>{permissions++;return true;},contains:async()=>true,onRemoved:{addListener:()=>{}}}};
 globalThis.fetch=async()=>{calls++;throw Error('No data request allowed');};
 const report:DropShredderReport={version:1,product:base,merchant:{domain:base.domain},evidence:[],contradictions:[],verdict:calculateVerdict([]),outsideResults:[{provider:'ScamFerret research',domain:base.domain,reportedAt:'2025-08-31',retrievedAt:now.toISOString(),outcome:'reported-concern',scope:'historical-opinion',reason:'<script>not executable</script>',recordId:'owned',stale:true}]};
 try{const controls=mountOutsideResultControls(()=>report,()=>{throw Error('No stale result may apply');},async()=>false,d.doc);
  assert.equal(d.doc.querySelector('#outside-results a'),null);assert.equal(d.doc.querySelector('#outside-results script'),null);assert.match(d.doc.querySelector('#outside-results')!.textContent!,/HISTORICAL/);
  d.doc.getElementById('outside-security')!.click();await new Promise(r=>setTimeout(r,20));assert.equal(permissions,1);assert.equal(calls,0);controls.reset();
 }finally{globalThis.fetch=oldFetch;g.chrome=oldChrome;d.restore();}
});

// DS-058: public merchant description places its labeled code in a child span.
// These are owned structural fixtures, not merchant/accuracy ground truth.
for(const [label,markup,expected] of [
 ['Spanish span','<li>Código del fabricante: <span>GW3773</span></li>','GW3773'],
 ['English strong','<p>Manufacturer Code: <strong>AB123</strong></p>','AB123'],
 ['table cells','<table><tr><th>MPN:</th><td>ABC42</td></tr></table>','ABC42'],
 ['review exclusion','<div class="review"><p>MPN: <span>REVIEW-42</span></p></div>',undefined],
 ['related exclusion','<div class="related"><p>MPN: <span>RELATED-42</span></p></div>',undefined],
 ['hidden value exclusion','<p>MPN: <span hidden>HIDDEN-42</span></p>',undefined],
 ['CSS-hidden value exclusion','<p>MPN: <span style="display:none">HIDDEN-42</span></p>',undefined],
 ['field value exclusion','<p>MPN: <input value="PRIVATE-MPN-42"></p>',undefined],
 ['ambiguous codes','<p>MPN: <span>FIRST-12</span></p><p>MPN: <span>SECOND-34</span></p>',undefined],
 ['no cross-row borrowing','<p>MPN:</p><p>UNRELATED-42</p>',undefined],
 ['quote exclusion','<blockquote><p>MPN: <span>QUOTED-42</span></p></blockquote>',undefined],
 ['private account exclusion','<form action="/account/login" hidden><p>MPN: <span>ACCOUNT-42</span></p><input type="password" value="PRIVATE-PASS"></form>',undefined],
] as const)test('split public manufacturer-code extraction: '+label,()=>{
 const d=setup('<html><head><title>Lamp</title></head><body><main><h1>Lamp</h1><p>$12.00</p><button>Add to cart</button>'+markup+'</main></body></html>');
 try{for(const input of d.doc.querySelectorAll('input'))Object.defineProperty(input,'value',{get(){throw Error('Private field read');}});
  const s=extractPageScan(kit);assert.equal(s.product.mpn,expected);assert.doesNotMatch(JSON.stringify(s.product),/PRIVATE-/);
 }finally{d.restore();}
});
