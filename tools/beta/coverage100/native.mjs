import assert from 'node:assert/strict';

/** Owned native regressions, not independent merchant accuracy. */
export async function runCoverageNativeSuite({context,page,native,worker,test,until,pause}){
 const quiet='https://fixture.example.com/products/c100-context',reviewsUrl='https://fixture.example.com/products/c100-reviews';
 const product=url=>({'@context':'https://schema.org','@type':'Product',url,name:'Owned C100 lamp',sku:'C100-LAMP-1',offers:{price:20,priceCurrency:'USD'}});
 const html=(url,body)=>'<!doctype html><html><head><title>Owned C100 lamp</title><script type="application/ld+json">'+JSON.stringify(product(url))+'</script></head><body><main><h1>Owned C100 lamp</h1><p>$20.00</p><button>Add to cart</button>'+body+'</main></body></html>';
 const review=(id,body,attrs='')=>'<div class="jdgm-rev" data-review-id="'+id+'" data-product-url="/products/c100-reviews" '+attrs+'><span class="jdgm-rev__rating" data-score="4"></span><span class="jdgm-rev__timestamp" data-content="2026-01-10"></span><div class="jdgm-rev__body"><p>'+body+'</p></div></div>';
 const bodies=['The lamp arrived intact and the switch works perfectly.','The lamp arrived intact and the switch works perfectly.','The lamp arrived intact and the switch works perfectly.','Warm lighting beside the bed at night.','The cable length fits my desk layout.','Package instructions were easy to follow.','The base has a smooth finish and is stable.'];
 await context.route(quiet,route=>route.fulfill({contentType:'text/html',body:html(quiet,'<p>Product details.</p>')}));
 await context.route(reviewsUrl,route=>route.fulfill({contentType:'text/html',body:html(reviewsUrl,'<div class="jdgm-widget jdgm-review-widget">'+bodies.map((body,i)=>review('r'+i,body,i===0?'data-verified-buyer="true"':'')).join('')+'<div hidden>'+review('hidden','HIDDEN-REVIEW-SENTINEL')+'</div>'+review('different','WRONG-PRODUCT-SENTINEL').replace('data-product-url="/products/c100-reviews"','data-product-url="/products/phone"')+'</div><div class="jdgm-all-reviews-widget">'+review('store','STORE-WIDE-SENTINEL')+'</div>')}));
 const scan=async url=>{await page.goto(url);await page.bringToFront();await pause(600);await native.click('#scan');await until(()=>native.evaluate("!document.querySelector('#scan').disabled"),'C100 native scan',20000);const raw=await native.evaluate("document.querySelector('#raw').textContent");assert.ok(raw);const data=JSON.parse(raw);assert.equal(data.product.url,url);return data;};
 await test('C100-01','Native context-only scan has a neutral stamp in all three tones',async()=>{
  const observations=[];
  if(!await native.evaluate("document.querySelector('.settings-panel').open"))await native.click('.settings-panel > summary');
  for(const [tone,down] of [['professional',0],['aggressive',1],['nuclear',2]]){
   await native.click('#tone-mode');await native.key('Home','Home',36);for(let i=0;i<down;i++)await native.key('ArrowDown','ArrowDown',40);await native.key('Enter','Enter',13);
   await until(()=>worker.evaluate(async value=>((await chrome.storage.local.get('dropshredder-feature-settings-v1'))['dropshredder-feature-settings-v1'])?.toneMode===value,tone),'tone saved');await pause(200);
   const data=await scan(quiet);assert.equal(data.verdict.severeWarningAllowed,false);assert.ok(data.evidence.every(e=>e.weight===0));
   const headline=await page.evaluate(()=>document.querySelector('#dropshredder-stamp-host')?.shadowRoot?.querySelector('.headline')?.textContent);
   assert.match(headline??'',/NO VERDICT/);assert.doesNotMatch(headline??'',/⚠|CAUGHT|RED FLAGS|SIGNALS FOUND/);observations.push({tone,headline,evidence:data.evidence.map(e=>({id:e.id,weight:e.weight}))});
  }
  await native.screenshot('c100-context-only-neutral.png');return {observations};
 });
 await test('C100-02','Native product Judge.me reviews reach duplication analysis without unrelated or hidden copies',async()=>{
  const data=await scan(reviewsUrl);assert.equal(data.reviewIntegrity.total,7);assert.ok(data.reviewIntegrity.flagged>=3);assert.ok(data.evidence.some(e=>e.id==='REVIEW_TEXT_DUPLICATION'));assert.equal(data.verdict.severeWarningAllowed,false);
  await native.screenshot('c100-review-analysis.png');return {reviewIntegrity:data.reviewIntegrity,evidence:data.evidence.map(e=>({id:e.id,weight:e.weight})),scope:'Seven owned visible current-product reviews; not independent customer observations'};
 });
 await test('C100-03','Native shipping abstains on dates and prose and retains real origin extraction',async()=>{
  const rows=[];
  for(const [id,body,expectOrigin] of [['prose','Complimentary Shipping From Oct 6-19. We change from time to time as part of our commitment. From Kitchen to Skincare.',false],['route','Carrier: 4PX. Shipped from Shenzhen, China to Chicago, USA.',true]]){
   const url='https://fixture.example.com/products/c100-shipping-'+id;
   await context.route(url,route=>route.fulfill({contentType:'text/html',body:html(url,'<p>'+body+'</p>')}));
   await scan(url);await native.click('#fulfillment-check');await until(()=>native.evaluate("!document.querySelector('#status').textContent.startsWith('Checking where')"),'C100 shipping settled',12000);
   const data=JSON.parse(await native.evaluate("document.querySelector('#raw').textContent"));assert.equal(data.evidence.some(e=>e.id==='FULFILLMENT_ORIGIN_CONFLICT'),false);assert.equal(data.evidence.some(e=>e.id==='FULFILLMENT_ORIGIN_OBSERVATION'),expectOrigin);
   rows.push({id,status:await native.evaluate("document.querySelector('#status').textContent"),evidence:data.evidence.map(e=>({id:e.id,weight:e.weight}))});
  }
  return {rows};
 });
}
