import assert from 'node:assert/strict';
import test from 'node:test';
import {parseHTML} from 'linkedom';
import {hasSensitiveCommerceSurface,privateCommerceRegions} from '../src/security/sensitive-surface';
import {extractPageScan} from '../src/extraction/page-scan';
import {chromeProductSelectionStamp} from '../src/runtime/chrome-page';
import {collectShoppingPageFacts} from '../src/detection/page-facts';
import {COMMERCE_LANGUAGE_KIT as kit} from '../src/languages/commerce-kit';

const url='https://shop.example/products/lamp';
const product={'@type':'Product',url,name:'Public lamp',sku:'PUBLIC-12',offers:{price:12,priceCurrency:'USD'}};
function dom(extra:string,fn:(doc:Document)=>void){
  const w=parseHTML(`<html><head><script type="application/ld+json">${JSON.stringify(product)}</script><script>window.customer='HEAD-SECRET'</script><meta name="generator" content="Fixture store"></head><body>${extra}<main><h1>Public lamp</h1><div class="product-price">$12</div><button name="add">Add to cart</button></main></body></html>`);
  const doc=w.document as unknown as Document;
  for(const [name,tag] of [['scripts','script'],['images','img']] as const){const list=Array.from(doc.getElementsByTagName(tag));Object.defineProperty(doc,name,{value:{length:list.length,item:(i:number)=>list[i]}});}
  const globals=globalThis as unknown as Record<string,unknown>,values={document:doc,window:w,location:new URL(url),NodeFilter:{SHOW_TEXT:4,SHOW_ELEMENT:1},HTMLElement:w.HTMLElement};
  const old=Object.fromEntries(Object.keys(values).map(k=>[k,globals[k]]));Object.assign(globals,values);
  try{fn(doc);}finally{for(const k of Object.keys(values))if(old[k]===undefined)delete globals[k];else globals[k]=old[k];}
}

test('dormant credential forms do not block public products; opening the same form blocks again',()=>{
  for(const hidden of ['hidden','aria-hidden="true"','style="display:none"'])dom(`<form ${hidden}><input type="password"></form>`,doc=>{
    assert.equal(hasSensitiveCommerceSurface(kit.privateFormParts,doc),false);
    const form=doc.querySelector('form')!;form.removeAttribute('hidden');form.removeAttribute('aria-hidden');form.removeAttribute('style');
    assert.equal(hasSensitiveCommerceSurface(kit.privateFormParts,doc),true,'Active or uncertain layout must fail closed');
  });
});
test('active password/card fields and payment forms still block without reading values',()=>{
  for(const html of ['<input type="password">','<input autocomplete="section-billing cc-number">','<input autocomplete="cc-csc">','<form action="https://shop.example/checkout"><button>Pay</button></form>'])dom(html,doc=>{
    for(const input of doc.querySelectorAll('input'))Object.defineProperty(input,'value',{get(){throw Error('Credential value read');}});
    assert.equal(hasSensitiveCommerceSurface(kit.privateFormParts,doc),true);
  });
});
test('closed credential dialog stays dormant and activation is refused',()=>dom('<dialog><form><input type="password"></form></dialog>',doc=>{
  assert.equal(hasSensitiveCommerceSurface(kit.privateFormParts,doc),false);
  doc.querySelector('dialog')!.setAttribute('open','');assert.equal(hasSensitiveCommerceSurface(kit.privateFormParts,doc),true);
}));
test('private-region limit fails closed rather than skipping late credential fields',()=>dom(Array.from({length:65},()=>'<form hidden><input type="password"></form>').join(''),doc=>{
  assert.equal(hasSensitiveCommerceSurface(kit.privateFormParts,doc),true);
  assert.deepEqual(privateCommerceRegions(kit.privateFormParts,doc),[doc.documentElement]);
  assert.throws(()=>extractPageScan(kit),/Too many private/);
}));
test('a public snapshot excludes private text, JSON-LD, resources and malicious option values',()=>{
  const privateProduct={...product,name:'PRIVATE-TITLE',sku:'PRIVATE-SKU',offers:{price:999,priceCurrency:'USD'}};
  dom(`<form style="display:none"><h1>PRIVATE-TITLE</h1><span>PRIVATE-ACCOUNT-TEXT</span><input type="password" name="color" data-option-name="color" aria-pressed="true" value="PRIVATE-PASSWORD"><input type="radio" name="color" checked value="PRIVATE-RADIO"><script type="application/ld+json">${JSON.stringify(privateProduct)}</script><script src="https://private.example/PRIVATE-RESOURCE.js"></script><img src="https://private.example/PRIVATE-IMAGE.png"><a href="https://shop.example/PRIVATE-RETURNS">Return policy</a></form>`,doc=>{
    for(const field of doc.querySelectorAll('input'))Object.defineProperty(field,'value',{get(){throw Error('Private value read');}});
    const report=extractPageScan(kit);
    assert.equal(report.product.title,'Public lamp');assert.equal(report.product.sku,'PUBLIC-12');assert.equal(report.product.price,12);
    assert.equal(report.product.jsonLdProductCount,1);
    assert.doesNotMatch(JSON.stringify(report),/PRIVATE-|HEAD-SECRET/);
    assert.doesNotMatch(chromeProductSelectionStamp([],kit.privateFormParts),/PRIVATE-/);
    assert.equal(collectShoppingPageFacts(doc,url).title,'Public lamp');
  });
});
test('inline head scripts are not serialized into technology fingerprints',()=>dom('',doc=>{
  const script=doc.querySelector('script:not([type])')!;Object.defineProperty(script,'outerHTML',{get(){throw Error('Inline script serialized');}});
  const report=extractPageScan(kit);assert.doesNotMatch(report.htmlSignature,/HEAD-SECRET/);assert.match(report.htmlSignature,/Fixture store/);
}));
