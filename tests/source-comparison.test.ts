import test from 'node:test';
import assert from 'node:assert/strict';
import {buildProductFingerprint} from '../src/forensics/product-fingerprint';
import {findIndexedSourceMatches} from '../src/analysis/source-match';
import type {ProductSnapshot} from '../src/types/product';
import {calculateVerdict} from '../src/analysis/evidence-engine';
const product=(domain:string,patch:Partial<ProductSnapshot>={}):ProductSnapshot=>({url:`https://${domain}/product`,domain,capturedAt:'2026-10-17T00:00:00Z',imageUrls:[],jsonLdProductCount:1,claims:[],pageSignals:[],...patch});
function matches(a:Partial<ProductSnapshot>,b:Partial<ProductSnapshot>){
 const current=product('shop.example',a),other=product('aliexpress.com',b);
 return findIndexedSourceMatches(current,[{id:'source',identityKey:'source',domain:other.domain,url:other.url,capturedAt:other.capturedAt,report:{version:1,product:other,merchant:{domain:other.domain},evidence:[],contradictions:[],verdict:calculateVerdict([])}}]);
}
test('DS062 shared store-local SKU must not become cross-store technical evidence',()=>{
 const a={sku:'ITEM-42',technicalFingerprint:buildProductFingerprint({sku:'ITEM-42'}).canonical};
 assert.equal(matches(a,a).length,0);
});
test('DS062 generic material must not become cross-store technical evidence',()=>{
 const a={technicalFingerprint:buildProductFingerprint({title:'Cotton'}).canonical};
 assert.equal(matches(a,a).length,0);
});
test('DS062 a GTIN copied into a fingerprint must not count as a second independent channel',()=>{
 const a={gtin:'012345678905',technicalFingerprint:buildProductFingerprint({gtin:'012345678905'}).canonical};
 assert.equal(matches(a,a)[0]?.technicalFingerprintMatch,false);
});

import {compareProductListings} from '../src/analysis/product-comparison';
import {comparisonUrl,productFromPublicHtml,fetchPublicProduct,publicComparisonEvidence} from '../src/osint/public-product-comparison';
const source='https://manufacturer.example/products/lamp';
const html=(p:unknown)=>'<script type="application/ld+json">'+JSON.stringify(p)+'</script>';
const data=(patch:Record<string,unknown>={})=>({'@type':'Product',url:source,name:'Lamp',brand:'Maker',mpn:'L-100',gtin:'012345678905',offers:{'@type':'Offer',url:source,price:'20.50',priceCurrency:'USD'},...patch});

test('public comparison rejects sensitive, private, insecure and query-selected destinations',()=>{
 for(const url of ['http://shop.example/p','https://localhost/p','https://192.168.1.1/p','https://x.local/p','https://user:pass@shop.example/p','https://shop.example/account/p','https://shop.example/p?variant=42','https://shop.example/p#variant','https://shop.example/','https://shop.example/p%2faccount'])assert.equal(comparisonUrl(url),undefined,url);
 assert.equal(comparisonUrl(source),source);
});
test('public comparison binds typed identifiers and a numeric single-offer price',()=>{
 const p=productFromPublicHtml(html(data()),source,'2026-10-17T00:00:00Z')!;
 assert.equal(p.gtin,'012345678905');assert.equal(p.price,20.5);assert.equal(p.currency,'USD');assert.equal(p.brand,'Maker');assert.deepEqual(p.imageUrls,[]);
});
test('recommendations, unrelated singleton, duplicate bound products and variants abstain',()=>{
 for(const p of [data({url:'/another',offers:undefined}),{'@type':'ItemList',itemListElement:[data()]},[data(),data({sku:"different-variant"})],{'@type':'ProductGroup',hasVariant:[data(),data({url:source+'?variant=2',offers:undefined})]}]){
  const result=productFromPublicHtml(html(p),source,'2026-10-17T00:00:00Z');
  if((p as any)['@type']==='ProductGroup')assert.equal(result?.mpn,'L-100');else assert.equal(result,undefined);
 }
 assert.equal(productFromPublicHtml(html(data({url:undefined,offers:undefined})),source,'2026-10-17T00:00:00Z'),undefined);
});
test('exact Offer URL can bind a product without selecting unrelated variant prices',()=>{
 const p=productFromPublicHtml(html(data({url:undefined,offers:[{'@type':'Offer',url:source+'?variant=2',price:8,priceCurrency:'USD'},{'@type':'Offer',url:source,price:25,priceCurrency:'USD'}]})),source,'2026-10-17T00:00:00Z');assert.equal(p?.price,25);
 const ambiguous=productFromPublicHtml(html(data({offers:[{'@type':'Offer',price:8,priceCurrency:'USD'},{'@type':'Offer',price:25,priceCurrency:'USD'}]})),source,'2026-10-17T00:00:00Z');assert.equal(ambiguous?.price,undefined);
});
test('conflicting GTIN fields, excessive JSON work and oversized scripts are refused',()=>{
 assert.throws(()=>productFromPublicHtml(html(data({gtin13:'4006381333931'})),source,'2026-10-17T00:00:00Z'),/conflict/);
 assert.throws(()=>productFromPublicHtml(html(data({name:'x'.repeat(260000)})),source,'2026-10-17T00:00:00Z'),/work limit/);
 assert.throws(()=>productFromPublicHtml(html(Array.from({length:1300},()=>({}))),source,'2026-10-17T00:00:00Z'),/work limit/);
});
test('raw JSON scripts inside comments, templates or other scripts never become products',()=>{
 for(const wrapper of [(s:string)=>'<!--'+s+'-->',(s:string)=>'<template>'+s+'</template>',(s:string)=>'<textarea>'+s+'</textarea>',(s:string)=>'<script type="text/javascript">const fake='+JSON.stringify(s)+'</script>'])assert.equal(productFromPublicHtml(wrapper(html(data())),source,'2026-10-17T00:00:00Z'),undefined);
});
test('negative/free-form prices cannot be mistaken for current selected offer prices',()=>{
 for(const price of [-1,'1,234','10-20','from 20',Infinity,''])assert.equal(productFromPublicHtml(html(data({offers:{'@type':'Offer',price,priceCurrency:'USD'}})),source,'2026-10-17T00:00:00Z')?.price,undefined);
});
test('numeric specs corroborate a typed identity once; conflicting specs veto the match',()=>{
 const a=product('shop.example',{gtin:'012345678905',specifications:{wattage:'10W',height:'20cm',weight:'100g'}});
 const b=product('source.example',{...a,domain:'source.example',url:source});
 assert.equal(compareProductListings(a,b).technicalFingerprintMatch,true);
 assert.equal(compareProductListings({...a,gtin:undefined},{...b,gtin:undefined}).matched,false);
 assert.equal(compareProductListings(a,{...b,specifications:{...b.specifications,wattage:'30W'}}).matched,false);
 const evidence=publicComparisonEvidence(a,b);assert.equal(evidence.weight,0);assert.equal(evidence.severity,'info');assert.match(evidence.title,/Matching/);
});
test('public request sends no credentials, follows no redirects and refuses non-HTML',async()=>{
 let calls=0;
 const request=(async(url,options)=>{calls++;assert.equal(url,source);assert.equal(options?.credentials,'omit');assert.equal(options?.redirect,'error');assert.equal(options?.referrerPolicy,'no-referrer');return new Response(html(data()),{headers:{'content-type':'text/html'}});}) as typeof fetch;
 assert.equal((await fetchPublicProduct(source,AbortSignal.timeout(500),request)).mpn,'L-100');assert.equal(calls,1);
 await assert.rejects(fetchPublicProduct(source+'?token=private',AbortSignal.timeout(500),request));assert.equal(calls,1);
 await assert.rejects(fetchPublicProduct(source,AbortSignal.timeout(500),async()=>new Response('{}',{headers:{'content-type':'application/json'}})),/HTML/);
});
test('chunked overflow and pre-canceled requests cannot yield a comparison',async()=>{
 await assert.rejects(fetchPublicProduct(source,AbortSignal.timeout(1000),async()=>new Response(new Uint8Array(1_000_001),{headers:{'content-type':'text/html'}})),/size limit/);
 let requested=false;const ctl=new AbortController();ctl.abort();await assert.rejects(fetchPublicProduct(source,ctl.signal,async()=>{requested=true;return new Response();}));assert.equal(requested,false);
});

test('an exact absolute Product @id binds identity without inventing an Offer URL',()=>{
 const p=productFromPublicHtml(html(data({url:undefined,'@id':source,offers:{'@type':'Offer',price:20,priceCurrency:'USD'}})),source,'2026-10-17T00:00:00Z');assert.equal(p?.gtin,'012345678905');assert.equal(p?.price,20);
});
test('identical duplicate Product declarations consolidate; conflicting variants still abstain',()=>{
 const p=data();assert.equal(productFromPublicHtml(html([p,{...p}]),source,'2026-10-17T00:00:00Z')?.gtin,'012345678905');
 assert.equal(productFromPublicHtml(html([p,{...p,sku:'variant2'},{...p,sku:'variant1'}]),source,'2026-10-17T00:00:00Z'),undefined);
});

test('a lightweight @id-only graph reference does not shadow a complete URL-bound Product',()=>{
 assert.equal(productFromPublicHtml(html([data(),{'@type':'Product','@id':source+'#product',name:'Lamp'}]),source,'2026-10-17T00:00:00Z')?.mpn,'L-100');
 assert.throws(()=>productFromPublicHtml(html([data(),{'@type':'Product','@id':source+'#product',gtin:'4006381333931'}]),source,'2026-10-17T00:00:00Z'),/conflict/);
});
