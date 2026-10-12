import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {observeLiveResources} from '../browser-smoke/remaining-edges.mjs';

const cases=JSON.parse(await fs.readFile(new URL('./live-cases.json',import.meta.url),'utf8'));
const bootstrap=JSON.parse(await fs.readFile(new URL('../../intelligence/rdap-bootstrap.json',import.meta.url),'utf8'));
export const liveTestIds=cases.flatMap(c=>c.kind==='quiet'?[c.id+'-quiet']:['scan','export','policy','shipping','evidence','domain','sources','image','store','reputation','resources'].map(s=>c.id+'-'+s));

export async function runLiveTests({context,page:fixture,native,worker,until,pause,report,output,downloads,downloadDir}){
  const tests=report.betaLiveTests=[];
  const observe=async(id,fn)=>{
    const started=Date.now();
    try{const details=await fn();tests.push({id,status:details?.unavailable?'UNAVAILABLE':'PASS',elapsedMs:Date.now()-started,details});return details;}
    catch(error){tests.push({id,status:'FAIL',elapsedMs:Date.now()-started,error:String(error)});await native.screenshot(id+'-failure.png').catch(()=>{});if(error.betaStop)throw error;return undefined;}
  };
  const state=async()=>({message:await native.evaluate("document.querySelector('#status').textContent"),raw:await native.evaluate("document.querySelector('#raw').textContent")});
  const guard=async(page)=>{
    const s=await state();assert.ok(s.raw,'Current report missing');const data=JSON.parse(s.raw);
    const actual=new URL(data.product.url),intended=new URL(page.url());
    if(actual.origin+actual.pathname!==intended.origin+intended.pathname)throw Object.assign(Error('Wrong live document/product attribution'),{betaStop:true});
    if(data.verdict.severeWarningAllowed)throw Object.assign(Error('Severe live warning requires independent receipt review; affected public sequence quarantined'),{betaStop:true});
    return data;
  };
  for(const candidate of cases){
    let page;const base=candidate.id;
    const snapshot={...candidate,startedAt:new Date().toISOString(),status:'RUNNING',limits:'Public convenience sample; manufacturer/listing claims are not independently authenticated truth'};
    (report.betaLiveSurfaces??=[]).push(snapshot);
    try{
      page=await context.newPage();const response=await page.goto(candidate.url,{waitUntil:'domcontentloaded',timeout:20000});await pause(3000);
      snapshot.httpStatus=response?.status();const url=new URL(page.url());url.search='';url.hash='';snapshot.finalUrl=url.href;
      const body=(await page.locator('body').innerText({timeout:4000})).slice(0,24000);
      if(snapshot.httpStatus>=400||/captcha|robot check|verify you are human|press & hold|access denied/i.test(body)||!body.toLowerCase().includes(candidate.expected.toLowerCase())){
        snapshot.status='UNAVAILABLE_OR_IDENTITY_UNCONFIRMED';for(const id of liveTestIds.filter(id=>id.startsWith(base+'-')))tests.push({id,status:'UNAVAILABLE',reason:snapshot.status,httpStatus:snapshot.httpStatus});continue;
      }
      await page.bringToFront();
      if(candidate.kind==='quiet'){
        await observe(base+'-quiet',async()=>{assert.equal(await page.locator('#dropshredder-auto-verdict').count(),0);return {url:snapshot.finalUrl,passiveToasts:0,language:await page.locator('html').getAttribute('lang')};});snapshot.status='OBSERVED_QUIET_PAGE';continue;
      }
      const scan=await observe(base+'-scan',async()=>{
        const toastCount=await page.locator('#dropshredder-auto-verdict').count();assert.ok(toastCount<=1,'Duplicate live product alerts');
        await native.click('#scan');await until(()=>native.evaluate("!document.querySelector('#scan').disabled"),'actual live beta scan',25000);
        const data=await guard(page);assert.ok(data.product.title);await native.screenshot(base+'-scan.png');
        const approved=report.betaApprovedRequestOrigins??=[];
        approved.push(actualOrigin(data.product.url));
        if(data.product.imageUrls?.[0])approved.push(actualOrigin(data.product.imageUrls[0]));
        const tld=new URL(data.product.url).hostname.split('.').at(-1);
        const registry=bootstrap.services.find(([suffixes])=>suffixes.includes(tld))?.[1]?.find(url=>url.startsWith('https://'));
        if(registry)approved.push(actualOrigin(registry));
        snapshot.product={url:data.product.url,title:data.product.title,price:data.product.price,currency:data.product.currency,sku:data.product.sku,gtin:data.product.gtin,asin:data.product.asin,extraction:data.product.extraction};snapshot.verdict=data.verdict;snapshot.evidence=data.evidence.map(e=>({id:e.id,weight:e.weight,severity:e.severity}));
        return {product:snapshot.product,verdict:data.verdict,toastCount,language:await page.locator('html').getAttribute('lang')};
      });
      if(!scan){snapshot.status='SCAN_FAILED';for(const suffix of ['export','policy','shipping','evidence','domain','sources','image','store','reputation','resources'])tests.push({id:base+'-'+suffix,status:'BLOCKED',reason:'This surface did not produce a usable current report'});continue;}
      snapshot.status='OBSERVED_SCAN';
      await observe(base+'-export',async()=>{
        const before=downloads.length;await native.click('#export-report');await until(()=>downloads.slice(before).some(d=>d.state==='completed'),'actual live export',15000);
        const item=downloads.slice(before).find(d=>d.state==='completed'),bytes=await fs.readFile(path.join(downloadDir,item.guid),'utf8'),data=JSON.parse(bytes);
        const url=new URL(data.product.url);assert.equal(url.search,'');assert.equal(url.hash,'');assert.equal(url.origin+url.pathname,new URL(page.url()).origin+new URL(page.url()).pathname);
        for(const key of ['imageUrls','description','reviews','specifications','merchant','pageText'])assert.equal(key in data.product||key in data,false);
        return {filename:item.suggestedFilename,bytes:Buffer.byteLength(bytes),productUrl:data.product.url};
      });
      for(const [suffix,button,pending] of [['policy','#policy-check','Reading the return policy'],['shipping','#fulfillment-check','Checking where']])await observe(base+'-'+suffix,async()=>{
        await native.click(button);await until(async()=>!(await state()).message.startsWith(pending),'actual '+suffix+' action',15000);
        const message=(await state()).message;assert.doesNotMatch(message,/not defined|ReferenceError|Cannot read/i);await guard(page);
        return {message,scope:'Actual public-page action; missing source/origin is an explicit abstention, not independent policy/shipment verification'};
      });
      await observe(base+'-evidence',async()=>{
        await native.type('#evidence-query','NO-MATCH-BETA-SENTINEL-89231');await pause(150);
        assert.equal(await native.evaluate("document.querySelectorAll('#evidence article.evidence-row:not([hidden])').length"),0);
        await native.type('#evidence-query','');return {count:await native.evaluate("document.querySelector('#evidence-count').textContent")};
      });
      await observe(base+'-domain',async()=>{
        await native.click('#check-domain');await until(()=>native.evaluate("!document.querySelector('#check-domain').disabled"),'actual public-domain lookup',15000);
        const data=await guard(page),entry=data.evidence.find(e=>e.id==='RDAP_DOMAIN_OBSERVATION');
        if(entry){assert.equal(entry.weight,0);return {observation:entry.observedValue,source:entry.provenance?.sourceUrl};}
        return {unavailable:true,message:(await state()).message,scope:'Provider failure/unsupported registry is not a domain-age observation'};
      });
      for(const [suffix,button] of [['sources','#hunt-sources'],['image','#hunt-image'],['store','#hunt-store'],['reputation','#reputation-sweep']])await observe(base+'-'+suffix,async()=>{
        const before=context.pages().length;await native.click(button);
        await until(()=>native.evaluate("Boolean(document.querySelector('#ds-search-chooser')?.open)"),'actual '+suffix+' chooser',20000);
        assert.equal(context.pages().length,before,'Search must not open a destination before selection');
        const destinations=await native.evaluate("Array.from(document.querySelectorAll('#ds-search-chooser label')).map(e=>e.textContent.trim())");assert.ok(destinations.length>0);
        await native.key('Escape','Escape',27);assert.equal(await native.evaluate("Boolean(document.querySelector('#ds-search-chooser'))"),false);
        await guard(page);return {destinations,scope:'Actual live-product source/image/store/reputation chooser and cancel; external search result quality not certified'};
      });
      await observe(base+'-resources',async()=>observeLiveResources({page,context,pause}));
    }catch(error){
      snapshot.error=String(error);snapshot.status=error.betaStop?'SAFETY_STOP':'ENVIRONMENT_OR_SURFACE_UNAVAILABLE';
      for(const id of liveTestIds.filter(id=>id.startsWith(base+'-')&&!tests.some(t=>t.id===id)))tests.push({id,status:error.betaStop?'BLOCKED':'UNAVAILABLE',reason:snapshot.status});
      if(error.betaStop){report.betaSafetyStop={id:base,error:String(error)};for(const id of liveTestIds.filter(id=>!tests.some(t=>t.id===id)))tests.push({id,status:'BLOCKED',reason:'Affected public sequence quarantined after serious failure'});throw error;}
    }finally{snapshot.finishedAt=new Date().toISOString();await page?.close().catch(()=>{});await fixture.bringToFront();}
  }
}

function actualOrigin(url){return new URL(url).origin;}
