import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const cases=JSON.parse(await fs.readFile(new URL('./known-sites.json',import.meta.url),'utf8'));
const suffixes=['scan','detection','shipping','safety'];

export async function runKnownSiteTests({context,page:fixture,native,until,pause,report}){
  const tests=report.betaKnownTests=[],surfaces=report.betaKnownSurfaces=[];
  const raw=async()=>JSON.parse(await native.evaluate("document.querySelector('#raw').textContent"));
  const status=()=>native.evaluate("document.querySelector('#status').textContent");
  const observe=async(id,fn)=>{
    const start=Date.now();
    try{const details=await fn();tests.push({id,status:'PASS',elapsedMs:Date.now()-start,details});return details;}
    catch(error){tests.push({id,status:'FAIL',elapsedMs:Date.now()-start,error:String(error)});await native.screenshot(id+'-failure.png').catch(()=>{});if(error.betaStop)throw error;return undefined;}
  };
  const guard=async(page)=>{
    const data=await raw(),actual=new URL(data.product.url),intended=new URL(page.url());
    if(actual.origin+actual.pathname!==intended.origin+intended.pathname)throw Object.assign(Error('Wrong public-page attribution'),{betaStop:true});
    if(data.verdict.severeWarningAllowed)throw Object.assign(Error('Severe live warning quarantined for independent review'),{betaStop:true});
    return data;
  };
  for(const candidate of cases){
    let page;const entry={...candidate,startedAt:new Date().toISOString(),status:'RUNNING'};surfaces.push(entry);
    try{
      page=await context.newPage();const response=await page.goto(candidate.url,{waitUntil:'domcontentloaded',timeout:20000});await pause(3000);
      entry.httpStatus=response?.status();const url=new URL(page.url());url.search='';url.hash='';entry.finalUrl=url.href;
      const body=(await page.locator('body').innerText({timeout:4000})).slice(0,60000);
      entry.pageIdentityConfirmed=body.toLowerCase().includes(candidate.expectedTitle.toLowerCase());
      if(entry.httpStatus>=400||!entry.pageIdentityConfirmed||/captcha|robot check|verify you are human|press & hold|access denied/i.test(body)){
        entry.status='UNAVAILABLE_OR_IDENTITY_UNCONFIRMED';continue;
      }
      entry.visibleDisclosureConfirmed=candidate.expectation.visibleDisclosure?body.toLowerCase().includes(candidate.expectation.visibleDisclosure):undefined;
      (report.betaApprovedRequestOrigins??=[]).push(url.origin);
      await page.bringToFront();
      const scanned=await observe(candidate.id+'-scan',async()=>{
        await native.click('#scan');await until(()=>native.evaluate("!document.querySelector('#scan').disabled"),'known-site native scan',25000);
        const data=await guard(page);assert.ok(data.product.title);
        assert.ok(data.product.title.toLowerCase().includes(candidate.expectedTitle.toLowerCase()),'Extracted identity differs from intended product');
        entry.product={url:data.product.url,title:data.product.title,sku:data.product.sku,brand:data.product.brand,price:data.product.price,currency:data.product.currency,claims:data.product.claims,extraction:data.product.extraction};
        entry.verdict=data.verdict;entry.supplyChain=data.supplyChain;
        entry.evidence=data.evidence.map(({id,family,severity,weight,title,observedValue,independentKey})=>({id,family,severity,weight,title,observedValue,independentKey}));
        await native.screenshot(candidate.id+'-scan.png');return {product:entry.product,verdict:data.verdict};
      });
      if(!scanned){entry.status='SCAN_FAILED';continue;}
      entry.status='OBSERVED_SCAN';
      await observe(candidate.id+'-detection',async()=>{
        const data=await guard(page),expect=candidate.expectation;
        if(expect.kind==='network'){
          const network=data.evidence.find(e=>e.id==='KNOWN_AFFILIATED_MERCHANT_NETWORK');
          assert.ok(network,'Expected documented affiliate network was missed');assert.ok(network.independentKey?.includes(expect.detail));
          assert.equal(data.product.sku,expect.sku,'Expected exposed shared-catalog identifier was missed');
          return {signal:network,sku:data.product.sku,scope:'Existing development control, not independent dropshipping truth'};
        }
        if(expect.visibleDisclosure)assert.equal(entry.visibleDisclosureConfirmed,true,'Current page no longer carries the predeclared factory-direct disclosure');
        const node=data.supplyChain?.nodes.find(n=>n.role==='fulfillment'&&n.detail?.toLowerCase().includes(expect.detail));
        assert.ok(node,'Expected factory-direct fulfillment disclosure was missed');
        const signal=data.evidence.find(e=>e.id==='SUPPLY_CHAIN_PROFILE');assert.ok(signal);assert.equal(signal.weight,0);
        return {node,signal,scope:'Actual merchant-authored direct-fulfillment claim, not supplier identity, fraud or calibrated probability'};
      });
      await observe(candidate.id+'-shipping',async()=>{
        const before=await status();await native.click('#fulfillment-check');
        await until(async()=>{const message=await status();return message!==before&&!message.startsWith('Checking where');},'actual native shipping action',15000);
        const data=await guard(page);entry.shipping={message:await status(),evidence:data.evidence.filter(e=>e.id==='FULFILLMENT_ORIGIN_OBSERVATION')};
        assert.doesNotMatch(entry.shipping.message,/ReferenceError|not defined|Cannot read/i);return entry.shipping;
      });
      await observe(candidate.id+'-safety',async()=>{
        const data=await guard(page);assert.equal(data.verdict.severeWarningAllowed,false);
        for(const e of data.evidence.filter(e=>['COMMERCE_PLATFORM_CONTEXT','SUPPLY_CHAIN_PROFILE','FULFILLMENT_ORIGIN_OBSERVATION','MERCHANT_JURISDICTIONS_DISCLOSED'].includes(e.id)))assert.equal(e.weight,0);
        return {severeWarningAllowed:false,dropshipLikelihood:data.verdict.dropshipLikelihood,massResellLikelihood:data.verdict.massResellLikelihood,scope:'Resale/fulfillment/platform/geography alone does not establish deception. Null scores are abstentions, not clean or accurate detections.'};
      });
    }catch(error){entry.error=String(error);entry.status=error.betaStop?'SAFETY_STOP':'ENVIRONMENT_OR_SURFACE_UNAVAILABLE';if(error.betaStop){report.betaSafetyStop={id:candidate.id,error:String(error)};throw error;}}
    finally{
      for(const suffix of suffixes)if(!tests.some(t=>t.id===candidate.id+'-'+suffix))tests.push({id:candidate.id+'-'+suffix,status:entry.status==='SCAN_FAILED'?'BLOCKED':'UNAVAILABLE',reason:entry.status,httpStatus:entry.httpStatus});
      entry.finishedAt=new Date().toISOString();await page?.close().catch(()=>{});await fixture.bringToFront();
    }
  }
}
