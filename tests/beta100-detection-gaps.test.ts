import assert from 'node:assert/strict';
import test from 'node:test';
import {parseHTML} from 'linkedom';
import {extractPageScan} from '../src/extraction/page-scan';
import {COMMERCE_LANGUAGE_KIT as kit} from '../src/languages/commerce-kit';
import {renderStamp} from '../src/ui/stamp';
import {calculateVerdict} from '../src/analysis/evidence-engine';
import type {EvidenceSignal} from '../src/types/evidence';
import type {DropShredderReport} from '../src/types/report';

const url='https://shop.example/products/lamp';
function dom(body:string,fn:(doc:Document)=>void){
 const {document,window}=parseHTML(`<html><head><script type="application/ld+json">${JSON.stringify({'@type':'Product',url,name:'Lamp',sku:'LAMP-1',offers:{price:20,priceCurrency:'USD'}})}</script></head><body><main><h1>Lamp</h1>${body}</main></body></html>`);
 for(const [key,selector] of [['scripts','script'],['images','img']] as const){const n=[...document.querySelectorAll(selector)];Object.defineProperty(document,key,{value:{length:n.length,item:(i:number)=>n[i]}});}
 const g=globalThis as unknown as Record<string,unknown>,values={document,window,location:new URL(url),NodeFilter:{SHOW_TEXT:4,SHOW_ELEMENT:1},HTMLElement:window.HTMLElement};
 const old=Object.fromEntries(Object.keys(values).map(k=>[k,g[k]]));Object.assign(g,values);
 try{for(const field of document.querySelectorAll('input,textarea,select'))Object.defineProperty(field,'value',{get(){throw Error('Control value read');}});fn(document as unknown as Document);}
 finally{for(const k of Object.keys(values))if(old[k]===undefined)delete g[k];else g[k]=old[k];}
}
function review(id='r1',attributes='',body='The lamp arrived intact and the switch works.',rating='4'){
 return `<div class="jdgm-rev" data-review-id="${id}" data-product-url="/products/lamp" ${attributes}><span class="jdgm-rev__rating" data-score="${rating}"></span><span class="jdgm-rev__timestamp" data-content="2026-10-01"></span><b class="jdgm-rev__title">Useful light</b><div class="jdgm-rev__body"><p>${body}</p></div></div>`;
}
const widget=(html:string)=>`<div id="judgeme_product_reviews" class="jdgm-widget jdgm-review-widget">${html}</div>`;

test('current-product visible Judge.me reviews reach the existing review detectors',()=>dom(widget(review('r1','data-verified-buyer="true"')),()=>{
 const r=extractPageScan(kit).reviews;assert.equal(r.length,1);assert.equal(r[0]?.platform,'judgeme');assert.equal(r[0]?.rating,4);assert.equal(r[0]?.date,'2026-10-01');assert.equal(r[0]?.verified,true);assert.equal(r[0]?.body,'The lamp arrived intact and the switch works.');
}));
test('missing verification state remains unknown and invalid ratings are not accepted',()=>dom(widget(review('r1')+review('r2','data-verified-buyer="unknown"','Still working','99')),()=>{
 const r=extractPageScan(kit).reviews;assert.equal(r.length,2);assert.equal(r[0]?.verified,undefined);assert.equal(r[1]?.verified,undefined);assert.equal(r[1]?.rating,undefined);
}));
test('explicit nonverified status stays distinct from a missing badge',()=>dom(widget(review('r1','data-verified-buyer="false"')),()=>{assert.equal(extractPageScan(kit).reviews[0]?.verified,false);}));
test('different-product and store-wide/carousel review widgets cannot contaminate current-product checks',()=>{
 const unrelated=review('wrong').replace('data-product-url="/products/lamp"','data-product-url="/products/phone"');
 dom(widget(review('current')+unrelated)+`<div class="jdgm-all-reviews-widget">${review('store')}</div><div class="jdgm-carousel-wrapper">${review('carousel')}</div>`,()=>{const r=extractPageScan(kit).reviews;assert.deepEqual(r.map(r=>r.id),['current']);});
});
test('hidden legacy copies, private review forms and duplicate review IDs are excluded',()=>dom(widget(`<div hidden>${review('hidden')}</div><div style="display:none">${review('legacy')}</div><form><input type="password">${review('private')}</form>${review('same')}${review('same')}`),()=>{assert.deepEqual(extractPageScan(kit).reviews.map(r=>r.id),['same']);}));
test('review body extraction omits private, hidden and editable descendant text',()=>dom(widget(review('r1','',`Safe words.<span hidden>HIDDEN</span><form><input type="password"><span>PRIVATE</span></form><textarea>EDITABLE</textarea>`)),()=>{const r=extractPageScan(kit).reviews;assert.equal(r.length,1);assert.equal(r[0]?.body,'Safe words.');}));
test('a widget without product attribution is not assumed to concern the current listing',()=>dom(widget(review().replace(' data-product-url="/products/lamp"','')),()=>{assert.equal(extractPageScan(kit).reviews.length,0);}));
test('review extraction remains bounded when the widget contains hundreds of reviews',()=>dom(widget(Array.from({length:120},(_,i)=>review('r'+i)).join('')),()=>{const r=extractPageScan(kit).reviews;assert.equal(r.length,60);}));
test('cross-origin and explicitly different-variant review declarations stay out',()=>dom(widget(review('current')+review('foreign').replace('/products/lamp','https://other.example/products/lamp')+review('other-variant').replace('/products/lamp','/products/lamp?variant=other')),()=>{assert.deepEqual(extractPageScan(kit).reviews.map(r=>r.id),['current']);}));

function report(signals:EvidenceSignal[]):DropShredderReport{return {version:1,product:{url,domain:'shop.example',title:'Lamp',imageUrls:[],jsonLdProductCount:1,capturedAt:'2026-10-16T00:00:00Z',claims:[],pageSignals:[]},merchant:{domain:'shop.example'},evidence:signals,contradictions:[],verdict:calculateVerdict(signals)};}
const info:EvidenceSignal={id:'PLATFORM',family:'technology',severity:'info',confidence:1,weight:0,title:'Store platform',explanation:'Context only',independentKey:'platform'};
test('informational-only stamps do not claim a warning or a detection',()=>dom('',doc=>{
 renderStamp(report([info]));const text=doc.querySelector('#dropshredder-stamp-host')?.shadowRoot?.querySelector('.headline')?.textContent??'';assert.match(text,/NO VERDICT/);assert.doesNotMatch(text,/⚠|SIGNALS FOUND|CAUGHT SOMETHING|UNKNOWN%/);
}));
test('invalid or zero-confidence evidence does not create a warning stamp',()=>dom('',doc=>{
 renderStamp(report([{...info,severity:'strong',family:'provenance',weight:30,confidence:0}]));assert.match(doc.querySelector('#dropshredder-stamp-host')?.shadowRoot?.querySelector('.headline')?.textContent??'',/NO VERDICT/);
}));

test('retail promotional dates and brand slogans never become shipment origins',async()=>{
 const {parseFulfillmentObservation}=await import('../src/analysis/fulfillment-observation');
 for(const text of ['Complimentary Shipping From Oct 6-19. Terms may change from time to time as part of our commitment.','From Kitchen to Skincare. Free shipping on orders from $25.','Our shipping options range from standard to express.'])assert.equal(parseFulfillmentObservation(text).origin,undefined,text);
});
test('real tracking origin stops before destination and keeps an anchored route excerpt',async()=>{
 const {parseFulfillmentObservation}=await import('../src/analysis/fulfillment-observation');
 const r=parseFulfillmentObservation('Navigation and shop collections. Carrier: 4PX. Shipped from Shenzhen, China to Chicago, USA.');assert.equal(r.origin,'Shenzhen, China');assert.match(r.routeText??'',/^Shipped from Shenzhen, China/);assert.doesNotMatch(r.routeText??'',/^Navigation/);
});
test('unknown prose cannot contradict a recognized shipping jurisdiction',async()=>{
 const {fulfillmentContradictions}=await import('../src/analysis/contradictions');
 const claim={kind:'ships-from' as const,text:'Shipping from US Warehouse',normalizedValue:'US Warehouse',confidence:.9};
 for(const origin of ['Kitchen to Skincare In addition','time to time as part of our commitment','Unknown warehouse','China or USA'])assert.equal(fulfillmentContradictions([claim],{origin,source:'https://carrier.example/track'}).length,0);
 assert.equal(fulfillmentContradictions([claim],{origin:'Shenzhen, China',source:'https://carrier.example/track'}).length,1);
 assert.equal(fulfillmentContradictions([claim],{origin:'Chicago, United States',source:'https://carrier.example/track'}).length,0);
});
test('negated and quoted shipping statements cannot supply an observed origin',async()=>{
 const {parseFulfillmentObservation}=await import('../src/analysis/fulfillment-observation');
 assert.equal(parseFulfillmentObservation('Not shipped from China. Shipped from Canada.').origin,'Canada');
 assert.equal(parseFulfillmentObservation('The customer said "Shipped from China".').origin,undefined);
});
