import test from 'node:test';import assert from 'node:assert/strict';
import {fulfillmentDisclosure,fulfillmentDisclosureEvidence} from '../src/analysis/fulfillment-disclosure';
import {calculateVerdict} from '../src/analysis/evidence-engine';
import {runPassiveRules} from '../src/analysis/passive-rules';
import type {ProductSnapshot} from '../src/types/product';
const url='https://merchant.example/products/lamp',at='2026-10-17T08:45:00Z';
for(const [name,text,model] of [
 ['supplier subject','Our suppliers ship your orders directly to your door.','supplier-direct'],
 ['manufacturer subject','The manufacturer will ship these items to you directly.','factory-direct'],
 ['vendor origin','This is a special order item that ships directly from the vendor.','supplier-direct'],
 ['separate negation','We do not offer store pickup. Items ship directly from our supplier to you.','supplier-direct'],
 ['trailing unrelated negation','Ships directly from the manufacturer (tracking emails will not be sent).','factory-direct'],
] as const)test(name,()=>assert.equal(fulfillmentDisclosure([{text,url}],at)?.model,model));
for(const [name,text] of [
 ['inbound warehouse','Our suppliers ship directly to our warehouse.'],
 ['inbound origin','We ship directly from the manufacturer to our distribution center.'],
 ['negated','We do not ship directly from suppliers.'],
 ['question','Does this item ship directly from the manufacturer?'],
 ['reported customer claim','Customers say we ship directly from the manufacturer.'],
 ['single quoted claim',"A customer wrote: 'ships directly from the supplier'."],
 ['general definition','Dropshipping means products ship directly from suppliers to customers.'],
 ['hypothetical','If we shipped directly from suppliers, we could reduce storage costs.'],
 ['future intention','We plan to ship directly from the manufacturer next year.'],
 ['denial after verb','Items ship directly from our suppliers? No, we stock every item ourselves.'],
] as const)test(name+' abstains',()=>assert.equal(fulfillmentDisclosure([{text,url}],at),undefined));
test('only public sources and valid observation dates become disclosures',()=>{
 assert.equal(fulfillmentDisclosure([{text:'Ships directly from the factory.',url:'http://127.0.0.1/private'}],at),undefined);
 assert.equal(fulfillmentDisclosure([{text:'Ships directly from the factory.',url}], 'not-a-date'),undefined);
});
test('disclosed logistics remains unscored',()=>{
 const d=fulfillmentDisclosure([{text:'Our suppliers ship your orders directly to your door.',url}],at);
 assert.ok(d);const e=fulfillmentDisclosureEvidence(d);assert.equal(e[0]?.weight,0);assert.equal(calculateVerdict(e).dropshipLikelihood,null);assert.equal(calculateVerdict(e).severeWarningAllowed,false);
});
const product:ProductSnapshot={url,domain:'merchant.example',capturedAt:at,title:'Lamp',pageSignals:[],claims:[],imageUrls:[],jsonLdProductCount:0};
for(const text of ['Not limited time; this is our regular price.','We never say hurry.','Our policy prohibits advertising only 2 left.'])test('negated urgency: '+text,()=>{
 assert.equal(runPassiveRules(product,text).some(e=>e.id==='SCARCITY_LANGUAGE'),false);
});
test('affirmative urgency remains detectable',()=>assert.equal(runPassiveRules(product,'Sale ends tonight.').some(e=>e.id==='SCARCITY_LANGUAGE'),true));

import {merchantNetworkEvidence,MERCHANT_NETWORKS} from '../src/intelligence/merchant-networks';
import {crossDomainReferenceEvidence} from '../src/analysis/merchant-network';
test('affiliation alone never creates a shopper warning or merchant-risk score',()=>{
 for(const group of MERCHANT_NETWORKS)for(const domain of group.domains){
  const e=merchantNetworkEvidence(domain,new Date(at));
  assert.ok(e.length,domain);assert.equal(e[0]?.severity,'info',domain);assert.equal(e[0]?.weight,0,domain);
  assert.equal(calculateVerdict(e).merchantRisk,'unknown',domain);
 }
});
test('a genuine cross-brand reference is retained as unscored identity context',()=>{
 const e=crossDomainReferenceEvidence('suredesigntshirts.com','Visit HaremPants.com.', ['harempants.com','suredesigntshirts.com']);
 assert.equal(e.length,1);assert.equal(e[0]?.weight,0);assert.equal(e[0]?.severity,'info');
});
test('lookalike hostname substrings cannot create a cross-brand reference',()=>{
 for(const text of ['not-harempants.com','harempants.com.evil.test','notharempants.com','evil_harempants.com'])assert.deepEqual(crossDomainReferenceEvidence('suredesigntshirts.com',text,['harempants.com']),[],text);
});

import {parseHTML} from 'linkedom';
import {extractPageScan} from '../src/extraction/page-scan';
import {COMMERCE_LANGUAGE_KIT as kit} from '../src/languages/commerce-kit';
function scan(body:string){
 const {document,window}=parseHTML('<html><head></head><body><main><h1>Lamp</h1>'+body+'</main></body></html>');
 for(const [key,selector] of [['scripts','script'],['images','img']] as const){const n=[...document.querySelectorAll(selector)];Object.defineProperty(document,key,{value:{length:n.length,item:(i:number)=>n[i]}});}
 const g=globalThis as unknown as Record<string,unknown>,v={document,window,location:new URL(url),NodeFilter:{SHOW_TEXT:4,SHOW_ELEMENT:1},HTMLElement:window.HTMLElement},old=Object.fromEntries(Object.keys(v).map(k=>[k,g[k]]));Object.assign(g,v);
 try{return extractPageScan(kit);}finally{for(const k of Object.keys(v))if(old[k]===undefined)delete g[k];else g[k]=old[k];}
}
const amazonReview=(id:string,body:string,badge='')=>`<section data-hook="review" id="${id}"><span data-hook="review-body">${body}</span>${badge}</section>`;
test('review opinions are not merchant-authored shipping or scarcity claims',()=>{
 const r=scan(amazonReview('r1','Ships directly from the supplier. Only 2 left.'));
 assert.doesNotMatch(r.pageText,/supplier|Only 2/);assert.equal(r.reviews.length,1);
});
test('missing Amazon verification badge stays unknown',()=>{
 const r=scan(amazonReview('r1','Useful light.'));assert.equal(r.reviews[0]?.verified,undefined);
});
test('Amazon-shaped extraction omits hidden reviews and private/hidden descendants',()=>{
 const r=scan('<div hidden>'+amazonReview('hidden','Hidden words.')+'</div>'+amazonReview('visible','Safe words.<span hidden>HIDDEN</span><form><input type="password"><span>PRIVATE</span></form>'));
 assert.deepEqual(r.reviews.map(x=>x.id),['visible']);assert.equal(r.reviews[0]?.body,'Safe words.');
});
test('present visible Amazon verification badge stays true',()=>{
 const r=scan(amazonReview('r1','Useful light.','<span data-hook="avp-badge">Verified Purchase</span>'));assert.equal(r.reviews[0]?.verified,true);
});
for(const text of ["We don't ship directly from suppliers.",'Our suppliers won’t ship orders directly to your door.'])test('contracted dispatch denial: '+text,()=>assert.equal(fulfillmentDisclosure([{text,url}],at),undefined));
test('contracted urgency denial does not become a warning',()=>assert.equal(runPassiveRules(product,"Don't hurry.").some(e=>e.id==='SCARCITY_LANGUAGE'),false));
test('reassurance does not erase affirmative urgency',()=>assert.equal(runPassiveRules(product,"Don't miss out — limited time offer.").some(e=>e.id==='SCARCITY_LANGUAGE'),true));
