import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {COMMERCE_LANGUAGE_KIT} from '../src/languages/commerce-kit';
import {commerceText,canonicalCommerceText,commerceTokens} from '../src/languages/commerce-text';
import {collectShoppingPageFacts,detectShoppingPage} from '../src/detection/page-facts';
import {extractPageScan} from '../src/extraction/page-scan';
import {runPassiveRules} from '../src/analysis/passive-rules';
import {analyzeReturnPolicy} from '../src/analysis/return-policy';
import {calculateVerdict} from '../src/analysis/evidence-engine';
import {extractClaims} from '../src/analysis/claims';
import {analyzeEtsyPage} from '../src/adapters/etsy';
import {reviewHasIncentiveLanguage,reviewTextSimilarity} from '../src/analysis/review-primitives';
import {buildProductFingerprint} from '../src/forensics/product-fingerprint';
import {chromeProductSelectionStamp} from '../src/runtime/chrome-page';
const fixtures=JSON.parse(fs.readFileSync('tests/fixtures/multilingual-commerce.json','utf8')) as Array<Record<string,string>>;
function withPage<T>(fixture:Record<string,string>,fn:(doc:Document)=>T,structured=true):T {
 const href='https://fixture.example.com'+fixture.productPath;
 const product={'@type':'Product',name:fixture.title,url:href,sku:'MODEL-123',gtin:'012345678905',brand:{name:'灯品牌'},image:'https://fixture.example.com/hero.png',offers:{'@type':'Offer',price:'1234.56',priceCurrency:fixture.currency},description:fixture.spec};
 const w=parseHTML(`<html lang="${fixture.lang}" dir="${fixture.lang==='ar'?'rtl':'ltr'}"><head><meta property="product:price:currency" content="${fixture.currency}">${structured?`<script type="application/ld+json">${JSON.stringify(product)}</script>`:''}</head><body><main><h1>${fixture.title}</h1><img itemprop="image" alt="${fixture.title}" src="https://fixture.example.com/hero.png"><div class="product-price">${fixture.price}</div><button>${fixture.buy}</button><p>${fixture.shipping}</p><p>${fixture.scarcity}</p><p>${fixture.handmade}. ${fixture.partner}. ${fixture.quality}.</p><p>${fixture.spec}</p><a href="https://fixture.example.com/about">${fixture.about}</a><a href="https://fixture.example.com/shipping">${fixture.shippingLink}</a><a href="https://fixture.example.com/returns">${fixture.returnsLink}</a><a href="https://fixture.example.com/contact">${fixture.contact}</a></main></body></html>`);
 const doc=w.document;
 for(const [key,selector] of [['scripts','script'],['images','img']] as const){const elements=[...doc.querySelectorAll(selector)];Object.defineProperty(doc,key,{value:{length:elements.length,item:(i:number)=>elements[i]}});}
 for(const a of doc.querySelectorAll('a')) Object.defineProperty(a,'pathname',{value:new URL(a.href).pathname});
 const g=globalThis as unknown as Record<string,unknown>,values={document:doc,window:w,location:new URL(href),NodeFilter:{SHOW_TEXT:4,SHOW_ELEMENT:1},HTMLElement:w.HTMLElement};
 const old=Object.fromEntries(Object.keys(values).map(k=>[k,g[k]]));Object.assign(g,values);
 try{return fn(doc as unknown as Document);}finally{for(const key of Object.keys(values)) if(old[key]===undefined)delete g[key];else g[key]=old[key];}
}
for(const f of fixtures){
 test(`${f.lang}: purchasable original-language page preserves identity and equivalent evidence`,()=>withPage(f,doc=>{
  const facts=collectShoppingPageFacts(doc,'https://fixture.example.com'+f.productPath);
  assert.equal(facts.purchaseAction,true,JSON.stringify(facts));assert.equal(facts.visiblePrice,true);
  assert.equal(detectShoppingPage(doc,facts.url).showToast,true);
  const scan=extractPageScan(COMMERCE_LANGUAGE_KIT);
  assert.equal(scan.product.title,f.title);assert.equal(scan.product.price,1234.56);assert.equal(scan.product.gtin,'012345678905');assert.equal(scan.product.sku,'MODEL-123');assert.equal(scan.product.brand,'灯品牌');
  assert.equal(scan.product.shippingText,f.shipping);
  assert.deepEqual(scan.siteLinks.map(l=>l.kind),['about','shipping','returns','contact']);
  const evidence=runPassiveRules(scan.product,scan.pageText);
  assert.deepEqual(evidence.map(e=>[e.id,e.weight]),[['LONG_SHIPPING_WINDOW',10],['SCARCITY_LANGUAGE',4]]);
  assert.equal(evidence[0]!.observedValue,f.shipping);assert.ok(f.scarcity!.includes(evidence[1]!.observedValue!));
  assert.equal(calculateVerdict(evidence).severeWarningAllowed,false);
  assert.equal(extractClaims(scan.pageText).some(c=>c.kind==='handmade'&&c.text===f.handmade),true);
  assert.deepEqual(analyzeEtsyPage(scan.pageText).evidence.map(e=>e.id),['ETSY_HANDMADE_CLAIM','ETSY_PRODUCTION_PARTNER_DISCLOSURE']);
 }));
 test(`${f.lang}: schema-free local price and hero recognition works with explicit currency`,()=>withPage(f,doc=>{
  const scan=extractPageScan(COMMERCE_LANGUAGE_KIT);assert.equal(scan.product.price,1234.56);assert.equal(scan.product.currency,f.currency);assert.equal(scan.product.extraction?.structuredIdentityResolved,false);
  const facts=collectShoppingPageFacts(doc,'https://fixture.example.com/unique-model-123');assert.equal(facts.focusedHero,true);assert.equal(detectShoppingPage(doc,facts.url).showToast,true);
 },false));
 test(`${f.lang}: sensitive, collection and editorial pages stay quiet`,()=>withPage(f,doc=>{
  for(const path of [f.sensitivePath,f.collectionPath,'/blog/lamp',`/${f.lang}/`]) assert.equal(detectShoppingPage(doc,'https://fixture.example.com'+path).showToast,false,path);
  doc.querySelector('main')!.insertAdjacentHTML('beforeend','<input type="password" value="PRIVATE-MUST-NOT-SCAN">');
  const facts=collectShoppingPageFacts(doc,'https://fixture.example.com'+f.productPath);assert.equal(facts.hasSensitiveFields,true);assert.equal(facts.structuredProduct,undefined);
 }));
 test(`${f.lang}: return-policy positives match English without treating negation as a fee`,()=>{
  assert.deepEqual(analyzeReturnPolicy(f.returnPolicy!).map(e=>[e.id,e.weight]).sort(),[['INTERNATIONAL_RETURN_AT_CUSTOMER_COST',9],['RESTOCKING_FEE',8],['VERY_SHORT_RETURN_WINDOW',9]].sort(),canonicalCommerceText(f.returnPolicy!));
  assert.equal(analyzeReturnPolicy(f.negativePolicy!).some(e=>e.id==='RESTOCKING_FEE'),false);
 });
 test(`${f.lang}: original-script reviews, incentives and technical material fingerprints are retained`,()=>{
  assert.ok(commerceTokens(f.review!).length>=4);assert.equal(reviewTextSimilarity(f.review!,f.review!),1);assert.equal(reviewHasIncentiveLanguage(f.incentive!),true);
  const fp=buildProductFingerprint({description:f.spec});assert.ok(fp.materials.includes('ceramic'));assert.ok(fp.units.includes('12 cm'),JSON.stringify(fp));
 });
}
test('native scripts are bounded, source-mapped and never fabricate new observed wording',()=>{
 const text='الدفع ١٢٣. हिंदी १२। বাংলা ১২।';const matching=commerceText(text);
 assert.match(matching.text,/123/);assert.match(matching.text,/12/);assert.equal(matching.original(0,matching.text.length),text);
 assert.equal(canonicalCommerceText('privacy '+ 'x'.repeat(200_000)).length,100_000);
 assert.equal(canonicalCommerceText('materialist'), 'materialist','Partial vocabulary words must not become evidence');
});
test('translated selected variant names invalidate stamps without examining arbitrary input values',()=>{
 const f=fixtures[5]!;withPage(f,doc=>{
  doc.querySelector('main')!.insertAdjacentHTML('beforeend','<button data-option-name="couleur" data-option-value="rouge" aria-pressed="true">Rouge</button><input name="secret" value="NEVER-COPY-THIS">');
  const names=Object.values(COMMERCE_LANGUAGE_KIT.variants).flat(),first=chromeProductSelectionStamp(names);
  assert.doesNotMatch(first,/NEVER-COPY/);doc.querySelector('[data-option-name]')!.setAttribute('data-option-value','bleu');assert.notEqual(chromeProductSelectionStamp(names),first);
 });
});

test('browser-translated heading keeps original schema identity with independently matching original metadata',()=>{
 const f=fixtures[5]!;withPage(f,doc=>{
  doc.documentElement.classList.add('translated-ltr');doc.head.insertAdjacentHTML('beforeend','<meta property="og:title" content="Ceramic table lamp">');
  const node=JSON.parse(doc.querySelector('script')!.textContent!);node.name='Ceramic table lamp';delete node.url;doc.querySelector('script')!.textContent=JSON.stringify(node);
  const scan=extractPageScan(COMMERCE_LANGUAGE_KIT);assert.equal(scan.product.title,f.title);assert.equal(scan.product.gtin,'012345678905');assert.equal(scan.product.extraction?.originalStructuredTitle,'Ceramic table lamp');assert.equal(scan.product.price,1234.56);
  doc.querySelector('meta[property="og:title"]')!.setAttribute('content','Unrelated recommendation');assert.equal(extractPageScan(COMMERCE_LANGUAGE_KIT).product.gtin,undefined);
 });
});
test('regional display ambiguity and invalid language tags cannot invent a resolved amount',()=>{
 for(const [lang,value] of [['','1,234'],['invalid_tag','1.234,56'],['fr','12,00–20,00'],['fr','12.00'],['en','12,00']] as const){
  withPage({...fixtures[5]!,lang,price:value},()=>assert.equal(extractPageScan(COMMERCE_LANGUAGE_KIT).product.price,undefined),false);
 }
 withPage(fixtures[5]!,doc=>{doc.querySelector('main')!.insertAdjacentHTML('beforeend','<div class="product-price">999,99 €</div>');assert.equal(extractPageScan(COMMERCE_LANGUAGE_KIT).product.price,undefined);},false);
});
test('localized private form actions block before content extraction, including percent-encoded paths',()=>{
 for(const path of COMMERCE_LANGUAGE_KIT.privateFormParts)withPage(fixtures[5]!,doc=>{
  Object.defineProperty(doc,'baseURI',{value:'https://fixture.example.com/products/lamp'});
  doc.querySelector('main')!.insertAdjacentHTML('beforeend',`<form action="/${encodeURIComponent(path)}"><input value="PRIVATE-NOT-READ"></form>`);
  const facts=collectShoppingPageFacts(doc,'https://fixture.example.com/products/lamp');assert.equal(facts.hasSensitiveFields,true,path);assert.equal(facts.structuredProduct,undefined);
 });
});
test('decomposed accents and repeated CJK urgency cues stay source-mapped and work-bounded',()=>{
 const original='Fait à la main';assert.match(canonicalCommerceText('qualité supérieure'),/premium quality/);
 const matching=commerceText(('仅剩３件。').repeat(15_000));assert.ok(matching.text.length<300_000);assert.equal(matching.match(/only\s+3\s+left/)?.original,'仅剩３件');
 assert.ok(original.length>0);
});

test('disabled or hidden translated purchase controls cannot qualify a page as purchasable',()=>{
 for(const f of fixtures)withPage(f,doc=>{
  doc.querySelector('button')!.setAttribute('disabled','');assert.equal(collectShoppingPageFacts(doc,'https://fixture.example.com'+f.productPath).purchaseAction,false);
  doc.querySelector('button')!.removeAttribute('disabled');doc.querySelector('button')!.setAttribute('hidden','');assert.equal(collectShoppingPageFacts(doc,'https://fixture.example.com'+f.productPath).purchaseAction,false);
 });
});
