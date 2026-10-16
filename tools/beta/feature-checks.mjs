import assert from 'node:assert/strict';

export async function weeklyCheck({native,worker,test,until,providerRequests}){
  await test('N50','Native weekly ON/OFF creates and removes a real Chrome alarm without an immediate feed request',async()=>{
    const alarm='dropshredder-signed-feed-weekly-check-v1',start=providerRequests.length;
    assert.equal(await native.evaluate("document.querySelector('#list-auto-weekly').checked"),false);
    await native.click('#list-auto-weekly');
    await until(()=>worker.evaluate(async name=>Boolean(await chrome.alarms.get(name)),alarm),'actual weekly alarm registered');
    const registered=await worker.evaluate(name=>chrome.alarms.get(name),alarm);
    assert.equal(registered.periodInMinutes,1440);
    assert.equal(providerRequests.length,start,'Opt-in alone must not send a publisher request');
    await native.click('#list-auto-weekly');
    await until(async()=>!await worker.evaluate(name=>chrome.alarms.get(name),alarm),'actual weekly alarm removed');
    return {registered,scope:'Actual opt-in/alarm lifecycle in an owned signed-feed profile; no simulated alarm, elapsed week or real publisher claim'};
  });
}

export async function additionalFeatureChecks({context,page,native,test,until,pause,externalRequests}){
  const scan=async()=>{await page.bringToFront();await native.click('#scan');await until(()=>native.evaluate("!document.querySelector('#scan').disabled"),'additional native scan',20000);return JSON.parse(await native.evaluate("document.querySelector('#raw').textContent"));};
  let policyStatus=200;
  await context.route('https://fixture.example.com/beta-refund-policy',route=>route.fulfill({status:policyStatus,contentType:'text/html',body:'<p>Returns accepted within 3 days. A 30% restocking fee applies. Customer pays international return shipping.</p>'}));
  const target='https://fixture.example.com/products/beta-controls';
  await context.route(target,route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Owned beta control mug</title><h1>Owned beta control mug</h1><p>$12.00</p><button>Add to cart</button><p>Carrier: UPS. Shipped from Toronto, Canada to Chicago, USA.</p><a href="/beta-refund-policy">Return policy</a><script type="application/ld+json">'+JSON.stringify({'@type':'Product',name:'Owned beta control mug',sku:'BETA-MUG-001',offers:{price:'12.00',priceCurrency:'USD'}})+'</script>'}));
  await page.goto(target);
  await test('N51','Native optional Brave empty-key request refuses without sending an API request',async()=>{
    await scan();const start=externalRequests.length;
    if(!await native.evaluate("document.querySelector('#brave-key').closest('details').open"))await native.click('details:has(#brave-key) > summary');
    await native.type('#brave-query','public product');await native.click('#brave-search');
    await until(()=>native.evaluate("!document.querySelector('#brave-search').disabled"),'empty optional key refusal');
    const status=await native.evaluate("document.querySelector('#brave-status').textContent");
    assert.match(status,/key|required|invalid/i);assert.equal(await native.evaluate("document.querySelector('#brave-key').value"),'');
    assert.equal(externalRequests.slice(start).some(origin=>origin==='https://api.search.brave.com'),false);
    return {status,scope:'Real native refusal with absent key; no authorized successful provider key supplied'};
  });
  await test('N53','Native return-policy button reads a bounded same-origin policy and displays its actual findings',async()=>{
    policyStatus=200;await scan();await native.click('#policy-check');
    await until(()=>native.evaluate("!document.querySelector('#status').textContent.startsWith('Reading the return policy')"),'return-policy action settled',12000);
    const status=await native.evaluate("document.querySelector('#status').textContent");
    assert.match(status,/Return-policy findings/);const result=JSON.parse(await native.evaluate("document.querySelector('#raw').textContent"));
    assert.ok(result.evidence.some(e=>e.id==='RESTOCKING_FEE'));assert.ok(result.evidence.some(e=>e.id==='VERY_SHORT_RETURN_WINDOW'));
    return {status,evidence:result.evidence.map(e=>e.id),scope:'Owned policy text served to the unchanged installed beta'};
  });
  await test('N54','Native non200 return-policy action reports the HTTP status rather than a script-scope error',async()=>{
    policyStatus=503;await scan();await native.click('#policy-check');
    await until(()=>native.evaluate("!document.querySelector('#status').textContent.startsWith('Reading the return policy')"),'non200 policy action settled',12000);
    const status=await native.evaluate("document.querySelector('#status').textContent");
    await native.screenshot('beta-policy-http-failure.png');
    assert.doesNotMatch(status,/not defined|ReferenceError|Cannot read/i);assert.match(status,/503/);
    policyStatus=200;return {status};
  });
  policyStatus=200;
  await test('N57','Native visible current-product SKU survives unresolved structured variants without choosing their prices',async()=>{
    const target='https://fixture.example.com/products/visible-sku';
    await context.route(target,route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><title>Owned visible SKU control</title><script type="application/ld+json">'+JSON.stringify({'@type':'ProductGroup',hasVariant:[{'@type':'Product',name:'Small',url:target+'?variant=1',sku:'SMALL',offers:{price:10,priceCurrency:'USD'}},{'@type':'Product',name:'Large',url:target+'?variant=2',sku:'LARGE',offers:{price:20,priceCurrency:'USD'}}]})+'</script></head><body><main><h1>Owned visible SKU control</h1><p>SKU: <span>OWNED-SKU-57</span></p><button>Add to cart</button><div class="related-products"><p>SKU: UNRELATED-99</p></div></main></body></html>'}));
    await page.goto(target);const data=await scan();assert.equal(data.product.sku,'OWNED-SKU-57');assert.equal(data.product.price,undefined);assert.equal(data.product.variantId,undefined);assert.equal(data.product.extraction.structuredIdentityResolved,false);assert.equal(data.verdict.severeWarningAllowed,false);
    await page.goto('https://fixture.example.com/products/beta-controls');return {sku:data.product.sku,extraction:data.product.extraction,scope:'Actual native extraction of an explicit store-local label; structured price/variant and independent supplier/ownership remain unresolved'};
  });
  await test('N55','Native shipping action keeps an explicit origin informational without accusing a country',async()=>{
    await scan();await native.click('#fulfillment-check');
    await until(()=>native.evaluate("!document.querySelector('#status').textContent.startsWith('Checking where')"),'shipping action settled',12000);
    const result=JSON.parse(await native.evaluate("document.querySelector('#raw').textContent"));
    const origin=result.evidence.find(e=>e.id==='FULFILLMENT_ORIGIN_OBSERVATION');assert.ok(origin);assert.equal(origin.weight,0);assert.match(origin.observedValue,/Toronto|Canada/);
    assert.equal(result.verdict.severeWarningAllowed,false);return {status:await native.evaluate("document.querySelector('#status').textContent"),origin};
  });
  await test('N56','Native evidence search and informational filter change visible rows and restore the full list',async()=>{
    await scan();const total=await native.evaluate("document.querySelectorAll('#evidence article.evidence-row:not([hidden])').length");assert.ok(total>0);
    await native.type('#evidence-query','NO-MATCH-BETA-SENTINEL-89231');await pause(200);
    assert.equal(await native.evaluate("document.querySelectorAll('#evidence article.evidence-row:not([hidden])').length"),0);
    await native.type('#evidence-query','');assert.equal(await native.evaluate("document.querySelector('#evidence-query').value"),'');await native.click('#evidence-filter');await native.key('End','End',35);await native.key('Enter','Enter',13);
    assert.equal(await native.evaluate("document.querySelector('#evidence-filter').value"),'context');
    await native.click('#evidence-filter');await native.key('Home','Home',36);await native.key('Enter','Enter',13);
    assert.equal(await native.evaluate("document.querySelectorAll('#evidence article.evidence-row:not([hidden])').length"),total);
    return {total,count:await native.evaluate("document.querySelector('#evidence-count').textContent")};
  });
}
