import assert from 'node:assert/strict';
import test from 'node:test';
import { parseHTML } from 'linkedom';
import { extractPageScan } from '../src/extraction/page-scan';
import { collectShoppingPageFacts } from '../src/detection/page-facts';
import { applyFeaturePatch, normalizeFeatureSettings } from '../src/settings/features';
import { lookupDomainRdap, registeredDomain, rdapEndpoint } from '../src/osint/rdap';
import { isEtsyDomain } from '../src/adapters/etsy';
import { showSearchChooser } from '../src/ui/search-chooser';

function page(nodes:unknown,href='https://shop.example/products/lamp',price='$29.99'){
  const w=parseHTML(`<html><head><link rel="canonical" href="https://shop.example/products/lamp"><script type="application/ld+json">${JSON.stringify(nodes)}</script></head><body><main><h1>Target Lamp</h1><div class="product-price">${price}</div><button name="add">Add to cart</button></main></body></html>`);
  const doc=w.document;
  for(const [key,selector] of [['scripts','script'],['images','img']] as const){
    const elements=Array.from(doc.querySelectorAll(selector));
    Object.defineProperty(doc,key,{value:{length:elements.length,item:(i:number)=>elements[i]}});
  }
  return {w,doc,href};
}
function scan(nodes:unknown,href?:string){
  const {w,doc,href:url}=page(nodes,href),g=globalThis as unknown as Record<string,unknown>;
  const values={document:doc,window:w,location:new URL(url),NodeFilter:{SHOW_TEXT:4,SHOW_ELEMENT:1},HTMLElement:w.HTMLElement};
  const old=Object.fromEntries(Object.keys(values).map(k=>[k,g[k]]));Object.assign(g,values);
  try{return extractPageScan();}finally{for(const k of Object.keys(values)) if(old[k]===undefined) delete g[k];else g[k]=old[k];}
}
const product=(name='Target Lamp',url='https://shop.example/products/lamp',price=29)=>({'@type':'Product',name,url,sku:name,image:`https://images.example/${name}.jpg`,offers:{'@type':'Offer',price,priceCurrency:'USD'},aggregateRating:{ratingValue:4.8,reviewCount:100}});

test('recommendations before the target cannot supply price, ratings, images or identity',()=>{
  const s=scan([product('Recommendation','https://shop.example/products/other',999),product()]);
  assert.equal(s.product.title,'Target Lamp');assert.equal(s.product.price,29);
  assert.equal(s.hostedReviews?.subjectId,'Target Lamp');assert.deepEqual(s.product.imageUrls,['https://images.example/Target Lamp.jpg']);
});
test('ProductGroup selects the current variant URL and abstains at ambiguous parent',()=>{
  const variants=[product('Small','https://shop.example/products/lamp?variant=1',10),product('Large','https://shop.example/products/lamp?variant=2',20)];
  const group={'@type':'ProductGroup',hasVariant:variants};
  assert.equal(scan(group,'https://shop.example/products/lamp?variant=2').product.price,20);
  const unknown=scan(group);assert.equal(unknown.product.price,undefined);assert.equal(unknown.product.sku,undefined);assert.equal(unknown.hostedReviews,undefined);
});
test('unresolved offers and unrelated aggregate ratings remain unknown',()=>{
  const p={...product(),offers:[{price:1},{price:99}],aggregateRating:undefined};
  const s=scan([p,{'@type':'Organization',aggregateRating:{ratingValue:5,reviewCount:999}}]);
  assert.equal(s.product.price,undefined);assert.equal(s.hostedReviews,undefined);
});
test('URL-less metadata requires matching visible identity and no unresolved variant selection',()=>{
  assert.equal(scan({...product(),url:undefined}).product.price,29);
  assert.equal(scan({...product('Other'),url:undefined}).product.price,undefined);
  assert.equal(scan({...product(),url:undefined},'https://shop.example/products/lamp?variant=2').product.price,undefined);
});
test('schema-free visible currency prices are detected without mistaking arbitrary text for prices',()=>{
  for(const price of ['$29.99','29.99 USD','€ 29,99']){const {doc,href}=page({},undefined,price);assert.equal(collectShoppingPageFacts(doc,href).visiblePrice,true);}
  const {doc,href}=page({},undefined,'Call for details');assert.equal(collectShoppingPageFacts(doc,href).visiblePrice,false);
});
test('malformed persisted settings cannot enable monitoring',()=>{
  assert.deepEqual(normalizeFeatureSettings({autoProtection:'false',autoSourceHunt:1,preferMadeInUSA:[],toneMode:'anything',unknown:true}),{autoProtection:false,autoSourceHunt:false,preferMadeInUSA:false,toneMode:'professional'});
});
test('concurrent setting patches preserve unrelated changes and recover after a failed write',async()=>{
  const g=globalThis as unknown as {chrome:unknown},old=g.chrome;let stored:Record<string,unknown>={};let fail=false;
  g.chrome={storage:{local:{get:async()=>({...stored}),set:async(v:Record<string,unknown>)=>{await new Promise(r=>setTimeout(r,2));if(fail){fail=false;throw Error('disk');}stored={...stored,...v};}}}};
  try{
    await Promise.all([applyFeaturePatch({autoSourceHunt:true}),applyFeaturePatch({preferMadeInUSA:true}),applyFeaturePatch({toneMode:'nuclear'})]);
    const s=normalizeFeatureSettings(stored['dropshredder-feature-settings-v1']);assert.equal(s.autoSourceHunt,true);assert.equal(s.preferMadeInUSA,true);assert.equal(s.toneMode,'nuclear');
    await assert.rejects(applyFeaturePatch({autoProtection:'true'}));fail=true;await assert.rejects(applyFeaturePatch({autoProtection:true}));
    assert.equal((await applyFeaturePatch({toneMode:'professional'})).autoSourceHunt,true);
  }finally{g.chrome=old;}
});
test('RDAP resolves registered domains and uses the published HTTPS registry endpoint',()=>{
  assert.equal(registeredDomain('shop.example.co.uk'),'example.co.uk');
  assert.equal(registeredDomain('https://www.example.com/path'),'example.com');
  for(const value of ['127.0.0.1','localhost','https://secret@example.com','https://example.com:4433','http://example.com']) assert.equal(registeredDomain(value),undefined);
  assert.match(rdapEndpoint('example.com')??'',/^https:\/\/rdap\.verisign\.com\/com\/v1\/domain\/example.com$/);
});
test('cached RDAP results wait for consent, and denied consent performs no cache read or fetch',async()=>{
  const g=globalThis as unknown as {chrome:unknown},old=g.chrome,oldFetch=globalThis.fetch;let reads=0,requests=0,consent!:(v:boolean)=>void;
  g.chrome={permissions:{request:()=>new Promise<boolean>(r=>{consent=r;}),contains:async()=>true},storage:{session:{get:async()=>{reads++;return {'rdap:example.com':{at:Date.now(),value:{domain:'example.com',source:rdapEndpoint('example.com'),retrievedAt:new Date().toISOString(),nameservers:[],statuses:[]}}};}}}};
  globalThis.fetch=async()=>{requests++;throw Error('should not fetch');};
  try{const pending=lookupDomainRdap('example.com');assert.equal(reads,0);consent(false);assert.equal(await pending,undefined);assert.equal(reads,0);assert.equal(requests,0);
    const allowed=lookupDomainRdap('example.com');assert.equal(reads,0);consent(true);assert.equal((await allowed)?.domain,'example.com');assert.equal(reads,1);
  }finally{g.chrome=old;globalThis.fetch=oldFetch;}
});
test('RDAP rejects another domain response and never follows redirects or sends credentials',async()=>{
  const g=globalThis as unknown as {chrome:unknown},old=g.chrome,oldFetch=globalThis.fetch;
  g.chrome={permissions:{request:async()=>true,contains:async()=>true},storage:{session:{get:async()=>({}),set:async()=>{}}}};
  globalThis.fetch=async(_url,init)=>{assert.equal(init?.redirect,'error');assert.equal(init?.credentials,'omit');assert.equal(init?.referrerPolicy,'no-referrer');return new Response(JSON.stringify({ldhName:'other.com'}));};
  try{await assert.rejects(lookupDomainRdap('example.com'),/did not identify/);}finally{g.chrome=old;globalThis.fetch=oldFetch;}
});
test('search picker exposes all sources and opens only explicit bounded batches',async()=>{
  const {document:doc}=parseHTML('<html><body></body></html>'),g=globalThis as unknown as {chrome:unknown},old=g.chrome;const opened:string[]=[];
  // LinkeDOM has no native dialog method; this test covers controls, not modal rendering.
  const create=doc.createElement.bind(doc);doc.createElement=((name:string)=>{const el=create(name);if(name==='dialog') Object.assign(el,{showModal(){}});return el;}) as typeof doc.createElement;
  g.chrome={tabs:{create:async({url}:{url:string})=>{opened.push(url);}}};
  try{
    showSearchChooser(Object.fromEntries(Array.from({length:10},(_,i)=>[`source-${i}`,`https://google.com/search?q=${i}`])),doc);
    assert.equal(doc.querySelectorAll('label').length,10);assert.equal(opened.length,0);
    const button=doc.querySelector('button')!;button.click();await new Promise(r=>setImmediate(r));assert.equal(opened.length,8);
    button.click();await new Promise(r=>setImmediate(r));assert.equal(opened.length,10);
  }finally{g.chrome=old;}
});

test('Etsy routing accepts real subdomains and rejects hostname lookalikes',()=>{for(const host of ['etsy.com','www.etsy.com','www.ETSY.com']) assert.equal(isEtsyDomain(host),true);for(const host of ['notetsy.com','etsy.com.evil.test','etsyXcom']) assert.equal(isEtsyDomain(host),false);});

test('a recommendation fragment identifier cannot override its different product URL',()=>{
  const wrong={...product('Wrong','https://shop.example/products/other',999),'@id':'#recommendation'};
  assert.equal(scan([wrong,product()]).product.price,29);
  assert.equal(scan({...wrong,url:undefined}).product.price,undefined);
});
test('blank and null price values are not interpreted as free products',()=>{
  for(const price of [null,'',' ','NaN']) assert.equal(scan({...product(),offers:{price}}).product.price,undefined);
  assert.equal(scan({...product(),offers:{price:0}}).product.price,0);
});
test('revoking RDAP permission during fetch suppresses the result',async()=>{
 const g=globalThis as unknown as {chrome:unknown},old=g.chrome,oldFetch=globalThis.fetch;let allowed=true,writes=0;
 g.chrome={permissions:{request:async()=>true,contains:async()=>allowed},storage:{session:{get:async()=>({}),set:async()=>{writes++;}}}};
 globalThis.fetch=async()=>{allowed=false;return new Response(JSON.stringify({ldhName:'example.com',events:[{eventAction:'registration',eventDate:'2020-01-01'}]}));};
 try{assert.equal(await lookupDomainRdap('example.com'),undefined);assert.equal(writes,0);}finally{g.chrome=old;globalThis.fetch=oldFetch;}
});
