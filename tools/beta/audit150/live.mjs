import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

const privatePath=/\/(?:cart|checkout|account|login|signin|sign-in|payment|admin|wp-admin)(?:\/|$)/i;
const blocked=/verify you are human|robot check|access denied|press & hold|domain (?:is )?for sale|buy this domain|sedo parking|website suspended|account suspended|checking your browser|just a moment/i;
const clean=value=>{const u=new URL(value);u.hash='';for(const k of [...u.searchParams.keys()])if(!['products_id','product_id','id','pid','item','main_page'].includes(k))u.searchParams.delete(k);return u.href;};

export async function runAudit150({context,page,native,worker,until,pause,report,output}){
  const shard=Number(process.env.AUDIT_SHARD),shards=8;
  const bytes=await fs.readFile(process.env.AUDIT_MANIFEST);
  const manifest=JSON.parse(bytes);
  const diagnosticIds=process.env.AUDIT_DIAGNOSTIC_IDS?.split(',');
  const selected=manifest.targets.filter(t=>diagnosticIds?diagnosticIds.includes(t.id):parseInt(createHash('sha256').update(t.host).digest('hex').slice(0,8),16)%shards===shard);
  report.audit150={shard,shards,manifestSha256:createHash('sha256').update(bytes).digest('hex'),manifestFrozenAt:manifest.frozenAt,sourcePoolSha256:manifest.poolSha256,planned:selected.length,rows:[],limits:manifest.limits??['Historical source labels; current fraud not independently accepted','Cumulative local history in this clean disposable shard; no source-list import','Languages and operator clusters not independently accepted']};
  const status=()=>native.evaluate("document.querySelector('#status').textContent");
  const snapshot=()=>native.evaluate("document.querySelector('#raw').textContent");
  const save=()=>fs.writeFile(path.join(output,'audit150.json'),JSON.stringify(report.audit150,null,2));
  const read=async()=>{const value=await snapshot();return value?JSON.parse(value):undefined;};
  const checkIdentity=data=>{
    if(!data?.product?.url||clean(data.product.url)!==clean(page.url()))throw Object.assign(Error('Wrong current-document attribution'),{safetyStop:true});
  };
  // All test browsing stays public. Close unrequested popup pages/downloads.
  let replacingPage=false;
  context.on('page',p=>{if(p!==page&&!replacingPage)void p.close().catch(()=>{});});
  page.on('download',d=>void d.cancel().catch(()=>{}));
  page.on('dialog',d=>void d.dismiss().catch(()=>{}));
  for(let index=0;index<selected.length;index++){
    const target=selected[index],row={...target,startedAt:new Date().toISOString(),status:'RUNNING',actions:[]};
    report.audit150.rows.push(row);
    try{
      const u=new URL(target.url);
      if(privatePath.test(u.pathname))throw Error('Private URL refused before navigation');
      const response=await page.goto(target.url,{waitUntil:'domcontentloaded',timeout:18000});
      await pause(2200);
      row.httpStatus=response?.status();row.finalUrl=clean(page.url());row.pageTitle=await page.title();
      const observed=await page.evaluate(()=>({language:document.documentElement.lang,title:document.title,h1:document.querySelector('h1')?.textContent?.trim(),text:(document.body?.innerText??'').slice(0,60000),privateForm:Boolean(document.querySelector('input[type=password],input[autocomplete="cc-number"],input[autocomplete="current-password"]')),products:[...document.querySelectorAll('script[type="application/ld+json"]')].map(e=>e.textContent).filter(s=>/"@type"\s*:\s*"Product"/i.test(s??'')).length,productLinks:[...document.querySelectorAll('a[href]')].filter(a=>/\/(products?|item|items|p)\//i.test(a.pathname)).length}));
      row.pageIdentity={title:observed.title,h1:observed.h1,language:observed.language,visibleTextSha256:createHash('sha256').update(observed.text).digest('hex'),visibleTextChars:observed.text.length,jsonProductBlocks:observed.products,productLinks:observed.productLinks,credentialFieldPresent:observed.privateForm};
      if(diagnosticIds)row.credentialFieldDiagnostics=await page.evaluate(()=>[...document.querySelectorAll('input[type=password],input[autocomplete="cc-number"],input[autocomplete="current-password"]')].map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {tag:e.tagName,type:e.getAttribute('type'),name:e.getAttribute('name'),autocomplete:e.getAttribute('autocomplete'),display:s.display,visibility:s.visibility,rect:{width:r.width,height:r.height},hiddenAncestor:Boolean(e.closest('[hidden],[aria-hidden="true"],dialog:not([open])')),scope:'Field structure/visibility only; no values read'};}));
      const current=new URL(row.finalUrl);
      if(current.hostname.replace(/^www\./,'')!==target.host||privatePath.test(current.pathname)||/^(?:log ?in|sign ?in|my account|checkout|payment|anmelden|connexion|iniciar sesi[oó]n)(?:\b|\s)/i.test(observed.h1??observed.title)){row.status='REDIRECT_OR_PRIVATE_SURFACE_REFUSED';continue;}
      if(row.httpStatus>=400||blocked.test(observed.text.slice(0,12000))||blocked.test(observed.title)||observed.text.length<150){row.status='UNAVAILABLE_CHALLENGE_PARKED_OR_EMPTY';continue;}
      row.commerceIdentityConfirmed=Boolean(observed.products||observed.productLinks||/add to (?:cart|bag)|warenkorb|acheter|comprar|winkelwagen|カート|購入|aggiungi|panier/i.test(observed.text))&&/[$€£¥]|\b(?:USD|EUR|GBP|JPY)\b/.test(observed.text);
      if(!row.commerceIdentityConfirmed){row.status='CURRENT_COMMERCE_UNCONFIRMED';continue;}
      await page.bringToFront();
      row.automatic=await page.evaluate(()=>({toastCount:document.querySelectorAll('#dropshredder-auto-verdict').length,toastText:document.querySelector('#dropshredder-auto-verdict')?.shadowRoot?.textContent?.slice(0,1800)??document.querySelector('#dropshredder-auto-verdict')?.textContent}));
      // Public product pages can include a dormant login modal. Do not alter
      // its DOM or bypass the extension guard: observe the real Scan refusal.
      // Genuine private/account/payment URLs were refused before this point.
      if(process.env.DS_MPN_VERIFY==='1'&&target.id==='AUDIT-0001'){
        const code=page.locator('#tab-description li').filter({hasText:'Código del fabricante:'}).first();
        const before=await code.isVisible();
        if(!before&&await page.locator('#tab-title-description a').isVisible()){
          await page.locator('#tab-title-description a').click({timeout:5000});await pause(200);
          row.actions.push({action:'open-public-product-description',status:'OBSERVED',reason:'Expose the merchant-authored manufacturer-code row; no account or checkout action'});
        }
        row.manufacturerCodeObservation={rowVisible:await code.isVisible(),wasVisibleBefore:before,text:await code.isVisible()?(await code.textContent()).trim().slice(0,200):undefined};
      }
      const scanStart=Date.now();row.nativeScanAttemptedAt=new Date().toISOString();
      await native.click('#scan');
      await until(()=>native.evaluate("!document.querySelector('#scan').disabled"),'actual native live scan',25000);
      row.scanStatus=await status();
      const data=await read();
      if(!data||!row.scanStatus.startsWith('Scan complete')){row.status='NATIVE_SCAN_REFUSED_OR_FAILED';row.actions.push({action:'scan',status:'REFUSED_OR_FAILED',message:row.scanStatus});if(diagnosticIds)await native.screenshot(target.id+'-actual-refusal.png');continue;}
      checkIdentity(data);row.scanReport=data;
      if(row.manufacturerCodeObservation){row.manufacturerCodeObservation.observedMpn=data.product.mpn;row.manufacturerCodeObservation.pass=row.manufacturerCodeObservation.rowVisible&&/GW3773/.test(row.manufacturerCodeObservation.text??'')&&data.product.mpn==='GW3773';}

      row.status='OBSERVED_SCAN';row.actions.push({action:'scan',status:'OBSERVED',elapsedMs:Date.now()-scanStart,message:row.scanStatus});
      row.stamp=await page.evaluate(()=>document.querySelector('#dropshredder-stamp-host')?.shadowRoot?.textContent?.slice(0,1800));
      for(const [action,selector,pending] of [['policy','#policy-check',/^Reading the return policy/i],['shipping','#fulfillment-check',/^Checking where/i]]){
        const start=Date.now(),before=await status();
        try{
          if(await native.evaluate(`document.querySelector('${selector}').disabled`))throw Error('Native action disabled');
          await native.click(selector);
          await until(async()=>{const message=await status();return message!==before&&!pending.test(message);},'new settled '+action+' status',16000);
          const next=await read();checkIdentity(next);
          row.actions.push({action,status:'OBSERVED',message:await status(),elapsedMs:Date.now()-start});
          row[action+'Report']=next;
        }catch(error){row.actions.push({action,status:'FAIL_OR_BLOCKED',error:String(error),elapsedMs:Date.now()-start,message:await status().catch(()=>undefined)});if(error.safetyStop)throw error;}
      }
      if(process.env.DS_OUTSIDE_LIVE==='1'&&target.id==='AUDIT-0001'){
        if(!await native.evaluate("document.querySelector('.outside-panel').open"))await native.click('.outside-panel summary');
        for(const [action,selector] of [['published-outside','#outside-scamferret'],['security-outside','#outside-security']]){
          const start=Date.now();
          try{await native.click(selector);await until(()=>native.evaluate(`!document.querySelector('${selector}').disabled`),'settled explicit outside request',18000);
            const next=await read();checkIdentity(next);row.actions.push({action,status:'OBSERVED_UI_OUTCOME',elapsedMs:Date.now()-start,message:await native.evaluate("document.querySelector('#outside-status').textContent"),results:next.outsideResults??[]});
          }catch(error){row.actions.push({action,status:'FAIL_OR_BLOCKED',error:String(error)});if(error.safetyStop)throw error;}
        }
      }
      row.finalReport=await read();checkIdentity(row.finalReport);
      if(row.finalReport.verdict.severeWarningAllowed){row.status='SEVERE_WARNING_QUARANTINED';await native.screenshot(target.id+'-severe.png');report.audit150.safetyStop={id:target.id,reason:'Severe warning requires independent evidence review; affected profile stopped'};break;}
      const zeroIds=['COMMERCE_PLATFORM_CONTEXT','SUPPLY_CHAIN_PROFILE','FULFILLMENT_ORIGIN_OBSERVATION','MERCHANT_JURISDICTIONS_DISCLOSED'];
      row.zeroContextWeightsPreserved=row.finalReport.evidence.filter(e=>zeroIds.includes(e.id)).every(e=>e.weight===0);
      if(!row.zeroContextWeightsPreserved){row.status='SAFETY_STOP';throw Object.assign(Error('Context-only adverse weight'),{safetyStop:true});}
      if(index%8===0||row.finalReport.evidence.some(e=>e.weight>0))await native.screenshot(target.id+'-observed.png');
    }catch(error){
      row.error=String(error);row.status=error.safetyStop?'SAFETY_STOP':'ENVIRONMENT_OR_ACTION_ERROR';
      if(error.safetyStop){report.audit150.safetyStop={id:target.id,reason:String(error)};await native.screenshot(target.id+'-failure.png').catch(()=>{});break;}
      // A timed-out old navigation can otherwise redirect the next declared case.
      // Stop it and replace its document before continuing; preserve the original failure.
      const failedPage=page;replacingPage=true;
      try{
        const replacement=await context.newPage();page=replacement;native.useProductPage(replacement);
        await replacement.bringToFront();await failedPage.close({runBeforeUnload:false});
        for(const extra of context.pages())if(extra!==replacement)await extra.close({runBeforeUnload:false});
        row.navigationReset='Replaced failed browser tab; old loader and error renderer closed';
        replacement.on('download',d=>void d.cancel().catch(()=>{}));replacement.on('dialog',d=>void d.dismiss().catch(()=>{}));
      }catch(resetError){row.navigationResetFailure=String(resetError);report.audit150.safetyStop={id:target.id,reason:'Could not replace failed browser tab: '+String(resetError)};break;}
      finally{replacingPage=false;}

    }finally{
      row.finishedAt=new Date().toISOString();console.log(JSON.stringify({id:row.id,status:row.status,url:row.finalUrl??row.url,risk:row.finalReport?.verdict?.riskLevel,evidence:row.finalReport?.evidence?.length}));await save();
    }
  }
  for(const target of selected)if(!report.audit150.rows.some(r=>r.id===target.id))report.audit150.rows.push({...target,status:'BLOCKED_AFTER_PROFILE_SAFETY_STOP',reason:report.audit150.safetyStop});
  report.audit150.finishedAt=new Date().toISOString();
  report.audit150.counts=Object.fromEntries([...new Set(report.audit150.rows.map(r=>r.status))].map(s=>[s,report.audit150.rows.filter(r=>r.status===s).length]));
  report.audit150.finalFeatures=await worker.evaluate(async()=>chrome.storage.local.get('dropshredder-feature-settings-v1'));
  await save();console.log(JSON.stringify({shard,planned:selected.length,counts:report.audit150.counts}));
}
