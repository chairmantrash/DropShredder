import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'../..');
const fixtures=JSON.parse(await fs.readFile(path.join(root,'tests/fixtures/multilingual-commerce.json'),'utf8'));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export async function installMultilingualFixtures(context){
 await context.route('https://fixture.example.com/languages/**',route=>{
  const u=new URL(route.request().url()),parts=u.pathname.split('/'),f=fixtures.find(f=>f.lang===parts[2]);
  if(!f)return route.fulfill({status:404,body:'Unknown owned fixture'});
  if(parts[3]==='policy')return route.fulfill({contentType:'text/html',body:`<html lang="${f.lang}"><body>${esc(f.returnPolicy)}</body></html>`});
  if(parts[3]==='hero')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="240"><rect width="200" height="240" fill="#cad4de"/><path d="M100 50L150 120H50Z" fill="#53677a"/><path d="M100 120V200H60H140" stroke="#53677a" stroke-width="8"/></svg>'});
  const translated=parts[3]==='translated',schemaFree=parts[3]==='plain',url=u.origin+u.pathname;
  const product={'@context':'https://schema.org','@type':'Product',name:translated?'Ceramic table lamp':f.title,sku:'MODEL-123',brand:'灯品牌',gtin:'012345678905',mpn:'LAMP-123',image:`${u.origin}/languages/${f.lang}/hero`,description:f.spec,offers:{'@type':'Offer',price:'1234.56',priceCurrency:f.currency}};
  if(!translated)product.url=url;
  const base=`${u.origin}/languages/${f.lang}/policy`;
  const schema=schemaFree?'':`<script type="application/ld+json">${JSON.stringify(product)}</script>`;
  const privateAction={en:'checkout',zh:'支付',hi:'भुगतान',es:'pago',ar:'الدفع',fr:'paiement',bn:'পেমেন্ট','pt-BR':'pagamento'}[f.lang];
  const sensitive=parts[3]==='private-form'?`<form action="/${encodeURIComponent(privateAction)}"><input name="private" value="PRIVATE-NEVER-SCAN"></form>`:'';
  const reviews=Array.from({length:5},(_,i)=>`<section data-hook="review" id="owned-review-${i}"><span data-hook="review-star-rating">${f.lang==='ar'?'٥٫٠':f.lang==='bn'?'৫.০':f.lang==='hi'?'५.०':'5,0'}</span><span data-hook="review-body">${esc(i===4?f.incentive:f.review)}</span><span data-hook="review-date">2026-10-09</span><span data-hook="avp-badge">Owned verified fixture</span></section>`).join('');
  const large=parts[3]==='large'?('<div>Owned neutral page filler, no commerce claim</div>').repeat(20_000):'';
  return route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="${f.lang}" dir="${f.lang==='ar'?'rtl':'ltr'}" ${translated?'class="translated-ltr"':''}><head><meta charset="utf-8"><title>${esc(f.title)}</title><meta property="og:title" content="${translated?'Ceramic table lamp':esc(f.title)}"><meta property="product:price:currency" content="${f.currency}">${schema}<style>body{font:20px 'Noto Sans',sans-serif;padding:30px;background:#f4f6f8}main{max-width:800px;margin:auto}button{padding:12px}img{width:200px;height:240px}.product-price{font-weight:bold}</style></head><body><main><h1>${esc(f.title)}</h1><img itemprop="image" src="${u.origin}/languages/${f.lang}/hero" alt="${esc(f.title)}"><p class="product-price">${esc(f.price)}</p><button>${esc(f.buy)}</button><p>${esc(f.shipping)}</p><p>${esc(f.scarcity)}</p><p>${esc(f.handmade)}. ${esc(f.partner)}. ${esc(f.quality)}.</p><p>${esc(f.spec)}</p><a href="${base}/about">${esc(f.about)}</a> <a href="${base}/shipping">${esc(f.shippingLink)}</a> <a href="${base}/returns">${esc(f.returnsLink)}</a> <a href="${base}/contact">${esc(f.contact)}</a>${reviews}${sensitive}${large}</main></body></html>`});
 });
}
export async function runMultilingualSuite({page,native,worker,context,test,until,pause,output}){
 const scan=async()=>{await native.click('#scan');await until(()=>native.evaluate("!document.querySelector('#scan').disabled"),'localized manual scan',30000);const raw=await native.evaluate("document.querySelector('#raw').textContent");assert.ok(raw,'Localized product must return a report');return JSON.parse(raw);};
 for(const f of fixtures){
  const url=new URL(`https://fixture.example.com/languages/${f.lang}/detail${f.productPath}`).href;
  await test(`M-${f.lang}`,'Native toast-to-panel and repeated manual scan of an owned original-language product',async()=>{
   await page.goto(url);await page.bringToFront();await page.locator('#dropshredder-auto-verdict').waitFor({state:'visible',timeout:15000});
   assert.match(await page.locator('#dropshredder-auto-verdict').innerText(),new RegExp(f.title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
   await page.screenshot({path:path.join(output,`merchant-${f.lang}-toast.png`),fullPage:true});
   await page.locator('#dropshredder-auto-verdict button.body').click();
   await until(async()=>{const raw=await native.evaluate("document.querySelector('#raw').textContent");try{return JSON.parse(raw).product.url===url;}catch{return false;}},'exact originating multilingual toast scan',30000);
   const report=JSON.parse(await native.evaluate("document.querySelector('#raw').textContent"));
   assert.equal(report.product.title,f.title);assert.equal(report.product.sku,'MODEL-123');assert.equal(report.product.gtin,'012345678905');assert.equal(report.product.price,1234.56);assert.equal(report.product.currency,f.currency);assert.equal(report.product.shippingText,f.shipping);assert.equal(report.verdict.severeWarningAllowed,false);
   for(const id of ['LONG_SHIPPING_WINDOW','SCARCITY_LANGUAGE','INTERNATIONAL_RETURN_AT_CUSTOMER_COST','RESTOCKING_FEE','VERY_SHORT_RETURN_WINDOW'])assert.ok(report.evidence.some(e=>e.id===id),`${f.lang} missing ${id}`);
   assert.equal(report.evidence.find(e=>e.id==='LONG_SHIPPING_WINDOW').observedValue,f.shipping);
   assert.ok(report.product.claims.includes(f.handmade));
   assert.equal(report.reviewIntegrity.total,5);assert.equal(report.reviewIntegrity.rated,5);assert.equal(report.reviewIntegrity.displayedRating,5);assert.ok(report.evidence.some(e=>e.id==='REVIEW_TEXT_DUPLICATION'));
   await page.bringToFront();const manual=await scan();assert.equal(manual.product.url,url);assert.equal(manual.product.title,f.title);assert.equal(manual.product.price,report.product.price);
   await native.screenshot(`merchant-${f.lang}-native-panel.png`);
   return {uiLanguage:await worker.evaluate(()=>chrome.i18n.getUILanguage()),merchantLanguage:f.lang,url,product:manual.product,evidence:manual.evidence.map(e=>({id:e.id,weight:e.weight,observedValue:e.observedValue})),verdict:manual.verdict,scope:'Owned equivalent fixture, native panel and original product attribution; not live-market accuracy'};
  });
  await test(`P-${f.lang}`,'Schema-free translated purchase, price and hero detection without guessed identity',async()=>{
   const target=`https://fixture.example.com/languages/${f.lang}/plain/unique-model-123`;await page.goto(target);await page.bringToFront();await page.locator('#dropshredder-auto-verdict').waitFor({state:'visible',timeout:15000});
   const r=await scan();assert.equal(r.product.url,target);assert.equal(r.product.title,f.title);assert.equal(r.product.price,1234.56);assert.equal(r.product.currency,f.currency);assert.equal(r.product.extraction.structuredIdentityResolved,false);assert.equal(r.product.gtin,undefined);assert.equal(r.verdict.severeWarningAllowed,false);return {url:target,price:r.product.price,currency:r.product.currency,structuredIdentityResolved:false};
  });
  await test(`Q-${f.lang}`,'Localized collection, editorial, home and private pages remain quiet',async()=>{
   const cases=[f.collectionPath,'/blog/lamp',f.sensitivePath];
   for(const suffix of cases){const url=`https://fixture.example.com/languages/${f.lang}/quiet${suffix}`;await page.goto(url);await pause(2400);assert.equal(await page.locator('#dropshredder-auto-verdict').count(),0,url);}
   await native.click('#scan');await until(()=>native.evaluate("!document.querySelector('#scan').disabled"),'localized sensitive refusal');assert.equal(await native.evaluate("document.querySelector('#raw').textContent"),'');
   await page.goto(`https://fixture.example.com/languages/${f.lang}/private-form${f.productPath}`);await pause(2400);assert.equal(await page.locator('#dropshredder-auto-verdict').count(),0);await native.click('#scan');await until(()=>native.evaluate("!document.querySelector('#scan').disabled"),'localized private form refusal');assert.equal(await native.evaluate("document.querySelector('#raw').textContent"),'');
   await page.goto(`https://fixture.example.com/${f.lang}/`);await pause(2400);assert.equal(await page.locator('#dropshredder-auto-verdict').count(),0);
   return {paths:cases,scope:'Explicit translated path exclusions, including percent-encoded Unicode; no scan of credentials'};
  });
 }
 await test('M-browser-translated','Visible French heading with unchanged English schema retains exact original identifiers',async()=>{
  const f=fixtures.find(f=>f.lang==='fr'),url='https://fixture.example.com/languages/fr/translated/produits/lampe';await page.goto(url);const r=await scan();assert.equal(r.product.title,f.title);assert.equal(r.product.extraction.originalStructuredTitle,'Ceramic table lamp');assert.equal(r.product.gtin,'012345678905');assert.equal(r.product.sku,'MODEL-123');return {scope:'Owned modeled translated-DOM state, not a Google Translate service test',product:r.product};
 });
 await test('M-large','Bounded manual scan of a 20,000-element original-language product page',async()=>{
  await page.goto('https://fixture.example.com/languages/bn/large/পণ্য/বাতি');const start=Date.now();const r=await scan(),elapsedMs=Date.now()-start;assert.equal(r.product.title,fixtures.find(f=>f.lang==='bn').title);assert.ok(elapsedMs<15000,`Unusable bounded scan: ${elapsedMs}ms`);return {elements:20_000,elapsedMs,scope:'Owned large fixture; wall time includes panel/IPC/intelligence, not isolated CPU benchmark'};
 });
 for(const [language,text,font,script] of [
  ['chi_sim','产品型号 测试','Noto Sans CJK SC','Han'],['hin','उत्पाद मॉडल','Noto Sans Devanagari','Devanagari'],
  ['spa','MODELO PRODUCTO','Noto Sans',null],['ara','نموذج المنتج','Noto Sans Arabic','Arabic'],
  ['fra','MODÈLE PRODUIT','Noto Sans',null],['ben','পণ্যের মডেল','Noto Sans Bengali','Bengali'],['por','MODELO PRODUTO','Noto Sans',null],
 ])await test(`O-${language}`,'Native reader selects a packaged offline language model on a synthetic local label',async()=>{
  const canvasPage=await context.newPage();await canvasPage.goto(`chrome-extension://${new URL(worker.url()).host}/sidepanel.html`);
  const png=await canvasPage.evaluate(async({text,font})=>{await document.fonts.load(`52px "${font}"`);const c=document.createElement('canvas');c.width=1000;c.height=240;const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,1000,240);x.fillStyle='black';x.font=`52px "${font}"`;x.fillText(text,40,90);x.font='52px sans-serif';x.fillText('MODEL12345',40,170);return c.toDataURL('image/png').split(',')[1];},{text,font});
  await canvasPage.close();await page.bringToFront();const filename=path.join(output,`ocr-${language}.png`);await fs.writeFile(filename,Buffer.from(png,'base64'));
  if(!(await native.evaluate("document.querySelector('#label-image').closest('details').open"))) await native.click('.label-reader-panel > summary');
  await native.click('#label-language');await native.key('Home','Home',36);
  for(let i=0;i<['eng','chi_sim','hin','spa','ara','fra','ben','por'].indexOf(language);i++) await native.key('Down','ArrowDown',40);
  await native.key('Enter','Enter',13);assert.equal(await native.evaluate("document.querySelector('#label-language').value"),language);
  await native.setFiles('#label-image',[filename]);await native.click('#label-read');await until(()=>native.evaluate("(/Local analysis complete|Offline OCR failed|unavailable|Could not/.test(document.querySelector('#label-status').textContent))"),'packaged localized OCR',60000);
  const status=await native.evaluate("document.querySelector('#label-status').textContent"),recognized=await native.evaluate("document.querySelector('#label-results').textContent");assert.match(status,/Local analysis complete/);assert.match(recognized,/MODEL\s*12345/i);
  if(script)assert.ok(new RegExp(`\\p{Script=${script}}`,'u').test(recognized),`${language} must recognize original script, not only Latin SKU`);
  return {language,text,recognized:recognized.slice(0,600),scope:'Packaged model invocation on a synthetic known-script label; independent photo accuracy untested'};
 });
}
