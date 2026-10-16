import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {extractPageScan} from '../src/extraction/page-scan';
import {COMMERCE_LANGUAGE_KIT as kit} from '../src/languages/commerce-kit';
import {runPassiveRules} from '../src/analysis/passive-rules';
import {analyzeHistory} from '../src/analysis/history-signals';
import {dedupeEvidence,calculateVerdict} from '../src/analysis/evidence-engine';
import type {DropShredderReport} from '../src/types/report';
import type {StoredObservation} from '../src/storage/history';

const url='https://shop.example/products/lamp';
function scan(nodes:unknown,body='',href=url){
 const {document,window}=parseHTML(`<html><head><script type="application/ld+json">${JSON.stringify(nodes)}</script></head><body><main><h1>Lamp</h1>${body}</main></body></html>`);
 for(const [key,selector] of [['scripts','script'],['images','img']] as const){const n=[...document.querySelectorAll(selector)];Object.defineProperty(document,key,{value:{length:n.length,item:(i:number)=>n[i]}});}
 const g=globalThis as unknown as Record<string,unknown>,values={document,window,location:new URL(href),NodeFilter:{SHOW_TEXT:4,SHOW_ELEMENT:1},HTMLElement:window.HTMLElement};
 const old=Object.fromEntries(Object.keys(values).map(k=>[k,g[k]]));Object.assign(g,values);
 try{for(const field of document.querySelectorAll('input,textarea,select'))Object.defineProperty(field,'value',{get(){throw Error('Private/control value must not be inspected');}});return extractPageScan(kit);}
 finally{for(const k of Object.keys(values))if(old[k]===undefined)delete g[k];else g[k]=old[k];}
}
const child={'@type':'Product','@id':'#variant',url,name:'Lamp',sku:'BLUE-1',color:'Blue',offers:{price:20,priceCurrency:'USD'}};
const group={'@type':'ProductGroup','@id':'#group',name:'Lamp',url,brand:{'@type':'Brand',name:'Acme'},material:'Cotton',variesBy:['https://schema.org/color'],hasVariant:[child]};
test('bound ProductGroup variant inherits common brand/material but no parent identifiers or offer',()=>{
 const p=scan({...group,gtin:'012345678905',mpn:'PARENT',sku:'PARENT',offers:{price:999}}).product;
 assert.equal(p.brand,'Acme');assert.equal(p.specifications?.material,'Cotton');assert.equal(p.sku,'BLUE-1');assert.equal(p.price,20);assert.equal(p.gtin,undefined);assert.equal(p.mpn,undefined);
});
test('variant local properties override parent and variesBy fields are not inherited',()=>{
 const p=scan({...group,material:'Cotton',color:'Red',variesBy:['https://schema.org/color','https://schema.org/material'],hasVariant:[{...child,brand:'Local'}]}).product;
 assert.equal(p.brand,'Local');assert.equal(p.specifications?.color,'Blue');assert.equal(p.specifications?.material,undefined);
});
test('explicit local isVariantOf and brand @id references resolve without network or transitive inheritance',()=>{
 const p=scan({'@graph':[{...child,isVariantOf:{'@id':'#group'}},{...group,hasVariant:undefined,brand:{'@id':'#brand'},isVariantOf:{'@id':'#other'}},{'@id':'#brand','@type':'Brand',name:'Acme'},{'@id':'#other','@type':'ProductGroup',mpn:'UNRELATED'}]}).product;
 assert.equal(p.brand,'Acme');assert.equal(p.specifications?.material,'Cotton');assert.equal(p.mpn,undefined);
});
test('ambiguous group ancestry or duplicate brand IDs cannot lend product identity',()=>{
 assert.equal(scan([group,{...group,'@id':'#other',brand:'Other'}]).product.brand,undefined);
 const p=scan({'@graph':[{...child,brand:{'@id':'#brand'}},{'@id':'#brand','@type':'Brand',name:'Acme'},{'@id':'#brand','@type':'Brand',name:'Other'}]}).product;
 assert.equal(p.brand,undefined);
});
test('unselected ProductGroup parent cannot borrow a variant brand or offer',()=>{
 const p=scan({...group,hasVariant:[{...child,url:url+'?color=blue'},{...child,url:url+'?color=red',color:'Red'}]}).product;
 assert.equal(p.brand,undefined);assert.equal(p.price,undefined);assert.equal(p.gtin,undefined);
});
test('DefinedTerm variesBy and unknown dimensions cannot lend a variable material',()=>{
 assert.equal(scan({...group,variesBy:[{'@id':'https://schema.org/material'}]}).product.specifications?.material,undefined);
 assert.equal(scan({...group,variesBy:[{termCode:'unresolved'}]}).product.specifications?.material,undefined);
});
test('one explicitly current variant Offer URL binds its parent-named Product without guessing a variant',()=>{
 const href=url+'?variant=one',p=scan({...child,brand:'Acme',offers:{'@type':'Offer',url:href,price:20,priceCurrency:'USD'}},'',href).product;
 assert.equal(p.extraction?.structuredIdentityResolved,true);assert.equal(p.extraction?.offerResolved,true);assert.equal(p.brand,'Acme');assert.equal(p.price,20);
});
test('an unrelated or multiple variant offer cannot choose canonical parent identity',()=>{
 const href=url+'?variant=one';
  assert.equal(scan({...child,url:url+'?variant=other',offers:{'@type':'Offer',url:href,price:20}},'',href).product.extraction?.structuredIdentityResolved,false);
 assert.equal(scan({...child,offers:{'@type':'Offer',url:url+'?variant=other',price:20}},'',href).product.extraction?.structuredIdentityResolved,false);
 assert.equal(scan({...child,offers:[{'@type':'Offer',url:href,price:20},{'@type':'Offer',url:url+'?variant=other',price:30}]},'',href).product.extraction?.structuredIdentityResolved,false);
});
function micro(body:string,extra=''){return `<section itemscope itemtype="https://schema.org/Product"><meta itemprop="url" content="${url}"><span itemprop="name">Lamp</span>${body}</section>${extra}`;}
test('one current Product Microdata scope supplies explicitly typed brand MPN and valid GTIN',()=>{
 const p=scan({},micro('<span itemprop="brand" itemscope itemtype="https://schema.org/Brand"><meta itemprop="name" content="Acme"></span><meta itemprop="mpn" content="ABC-1"><meta itemprop="gtin12" content="012345678905">')).product;
 assert.equal(p.brand,'Acme');assert.equal(p.mpn,'ABC-1');assert.equal(p.gtin,'012345678905');assert.equal(p.extraction?.offerResolved,false);
});
test('Microdata ignores conflicting codes, invalid checksums and store-local model/SKU for global identity',()=>{
 const p=scan({},micro('<meta itemprop="mpn" content="ONE"><meta itemprop="mpn" content="TWO"><meta itemprop="gtin12" content="012345678904"><meta itemprop="sku" content="SKU-1"><meta itemprop="model" content="MODEL-1">')).product;
 assert.equal(p.mpn,undefined);assert.equal(p.gtin,undefined);assert.equal(p.sku,undefined);
});
test('Microdata cannot choose an unresolved variant or replace already bound JSON-LD identity',()=>{
 const data=micro('<meta itemprop="mpn" content="OTHER"><meta itemprop="brand" content="Other">');
 assert.equal(scan({},data,url+'?variant=2').product.mpn,undefined);
 const p=scan({...child,brand:'Acme',mpn:'CURRENT'},data).product;assert.equal(p.mpn,'CURRENT');assert.equal(p.brand,'Acme');
});
test('Microdata from private fields, hidden or unrelated nested products is never collected',()=>{
 for(const extra of ['<div hidden><meta itemprop="mpn" content="HIDDEN"></div>','<div style="display:none"><meta itemprop="mpn" content="CSSHIDDEN"></div>','<form><input type="password" value="PRIVATE"><meta itemprop="mpn" content="PRIVATE"></form>','<div class="related-products" itemscope itemtype="https://schema.org/Product"><meta itemprop="mpn" content="RELATED"></div>','<input itemprop="mpn" value="PRIVATE">']){
  assert.equal(scan({},micro(extra)).product.mpn,undefined);
 }
});
test('multiple public product scopes must abstain when current identity is ambiguous',()=>{
 assert.equal(scan({},micro('<meta itemprop="mpn" content="ONE">')+micro('<meta itemprop="mpn" content="TWO">')).product.mpn,undefined);
});
test('typed text excludes CSS-hidden descendants and nested recommendation strings',()=>{
 const p=scan({},micro('<span itemprop="mpn">ABC-1<span style="display:none">HIDDEN</span><span class="related-products">OTHER</span></span>')).product;
 assert.equal(p.mpn,'ABC-1');
});
test('typed identifier fallback is recorded in the extraction method without resolving an offer',()=>{
 const p=scan({},micro('<meta itemprop="mpn" content="ABC-1">')).product;
 assert.match(p.extraction?.method??'',/Microdata/);assert.equal(p.extraction?.offerResolved,false);
});
function report(at:string,text:string):DropShredderReport{
 const product={url,domain:'shop.example',title:'Lamp',imageUrls:[],jsonLdProductCount:1,capturedAt:at,claims:[],pageSignals:[]};
 const evidence=runPassiveRules(product,text);return {version:1,product,merchant:{domain:product.domain},evidence,contradictions:[],verdict:calculateVerdict(evidence)};
}
function stored(r:DropShredderReport):StoredObservation{return {id:r.product.capturedAt,identityKey:'url:'+url,capturedAt:r.product.capturedAt,domain:r.product.domain,url,title:r.product.title,report:r};}
test('explicit countdown remains in the evidence so a later reset can be measured',()=>{
 const e=report('2026-10-16T00:00:00Z','Offer ends in 00:10:00').evidence.find(x=>x.id==='SCARCITY_LANGUAGE');assert.match(e?.observedValue??'',/00:10:00/);
});
test('static low stock across real visits cannot become a strong time-limited-offer accusation',()=>{
 const r=report('2026-10-16T00:00:00Z','Only 3 left'),old=['2026-10-10T00:00:00Z','2026-10-12T00:00:00Z'].map(t=>stored(report(t,'Only 3 left')));
 assert.equal(analyzeHistory(r,old).some(e=>e.id==='REPEATED_SCARCITY_CLAIM'&&['moderate','strong','direct'].includes(e.severity)),false);
});
test('elapsed countdown expiry that repeatedly moves later is recorded with observation provenance',()=>{
 const r=report('2026-10-16T00:30:00Z','Offer ends in 00:10:00');const old=['2026-10-16T00:00:00Z','2026-10-16T00:15:00Z'].map(t=>stored(report(t,'Offer ends in 00:10:00')));
 const e=analyzeHistory(r,old).find(e=>e.id==='REPEATED_SCARCITY_CLAIM');assert.ok(e);assert.ok(e.provenance?.observedAt);assert.match(e.observedValue??'',/deadline|expiry/i);
 assert.equal(dedupeEvidence([...r.evidence,e]).filter(x=>x.family==='scarcity').length,1);assert.equal(calculateVerdict([...r.evidence,e]).severeWarningAllowed,false);
});
test('normally decreasing countdown and a malformed clock cannot imply a reset',()=>{
 const r=report('2026-10-16T00:02:00Z','Offer ends in 00:08:00');const old=[stored(report('2026-10-16T00:00:00Z','Offer ends in 00:10:00')),stored(report('2026-10-16T00:01:00Z','Offer ends in 00:09:00'))];
 assert.equal(analyzeHistory(r,old).some(e=>e.id==='REPEATED_SCARCITY_CLAIM'),false);
 const bad=report('2026-10-16T00:03:00Z','Offer ends in 00:99:99');assert.equal(analyzeHistory(bad,old).some(e=>e.id==='REPEATED_SCARCITY_CLAIM'),false);
});
