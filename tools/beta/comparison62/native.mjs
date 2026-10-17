import assert from 'node:assert/strict';
/** Genuine native panel actions against owned routed HTML; not independent accuracy. */
export async function runComparison62({context,page,native,test,until,pause,providerRequests,setMode}){
 const url='https://fixture.example.com/products/c62-lamp',source='https://comparison.example.com/products/lamp';
 const html='<!doctype html><html><head><title>Owned C62 lamp</title><script type="application/ld+json">'+JSON.stringify({'@type':'Product',url,name:'Owned C62 lamp',gtin:'012345678905',offers:{'@type':'Offer',price:50,priceCurrency:'USD'}})+'</script></head><body><main><h1>Owned C62 lamp</h1><p>Product details.</p><button>Add to cart</button></main></body></html>';
 await context.route(url,r=>r.fulfill({contentType:'text/html',body:html}));
 const scan=async()=>{await page.goto(url);await page.bringToFront();await pause(500);await native.click('#scan');await until(()=>native.evaluate("!document.querySelector('#scan').disabled"),'C62 scan',20000);assert.ok(await native.evaluate("document.querySelector('#raw').textContent"));};
 const open=async()=>{if(!await native.evaluate("document.querySelector('#compare-product').closest('details').open"))await native.click('details:has(#compare-product) > summary');};
 const run=async(target=source)=>{await open();await native.type('#compare-product-url',target);await native.click('#compare-product');};
 const raw=async()=>JSON.parse(await native.evaluate("document.querySelector('#raw').textContent"));
 const settled=async()=>until(()=>native.evaluate("!document.querySelector('#compare-product').disabled"),'C62 comparison settled',20000);
 await test('C62-01','Native explicit public comparison fetches one chosen page and records a typed match at zero weight',async()=>{
  await scan();const before=providerRequests.filter(x=>x.url.startsWith('https://comparison.example.com/')).length;
  await run();await settled();const data=await raw(),e=data.evidence.find(e=>e.id==='PUBLIC_PRODUCT_COMPARISON');assert.ok(e);assert.equal(e.weight,0);assert.match(e.title,/Matching/);assert.equal(e.provenance.sourceUrl,source);assert.equal(data.verdict.severeWarningAllowed,false);
  assert.equal(providerRequests.filter(x=>x.url.startsWith('https://comparison.example.com/')).length,before+1);await native.screenshot('c62-comparison.png');return {evidence:e,verdict:data.verdict};
 });
 await test('C62-02','Native query-selected and private comparison URLs cannot start a request',async()=>{
  const before=providerRequests.length;await run(source+'?variant=42');await settled();await run('https://comparison.example.com/account');await settled();assert.equal(providerRequests.length,before);assert.match(await native.evaluate("document.querySelector('#compare-product-status').textContent"),/public HTTPS/);
 });
 await test('C62-03','Native cancellation discards a delayed public-product response',async()=>{
  await scan();setMode('delay');const before=providerRequests.length;await run();await until(()=>providerRequests.length>before,'C62 delayed request');await native.click('#compare-product-cancel');await pause(2300);assert.ok(!(await raw()).evidence.some(e=>e.id==='PUBLIC_PRODUCT_COMPARISON'));setMode('normal');
 });
 await test('C62-04','Native navigation discards a delayed comparison and clears the old report',async()=>{
  await scan();setMode('delay');const before=providerRequests.length;await run();await until(()=>providerRequests.length>before,'C62 request before navigation');await page.goto('https://fixture.example.com/products/mug');await pause(2300);assert.equal(await native.evaluate("document.querySelector('#raw').textContent"),'');setMode('normal');
 });
 await test('C62-05','Native HTTP failure is visible without an invented product match',async()=>{
  await scan();setMode('error');await run();await settled();assert.match(await native.evaluate("document.querySelector('#compare-product-status').textContent"),/503/);assert.ok(!(await raw()).evidence.some(e=>e.id==='PUBLIC_PRODUCT_COMPARISON'));setMode('normal');
 });
 await test('C62-06','Native revocation during comparison cancels and clears the report',async()=>{
  await scan();setMode('delay');const before=providerRequests.length;await run();await until(()=>providerRequests.length>before,'C62 request before revocation');if(!await native.evaluate("document.querySelector('#revoke-optional-access').closest('details').open"))await native.click('.local-data > summary');await native.click('#revoke-optional-access');await pause(2300);assert.equal(await native.evaluate("document.querySelector('#raw').textContent"),'');setMode('normal');
 });
}
