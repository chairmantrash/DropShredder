import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import path from 'node:path';

// Actual browser operations against disposable profiles. These are engineering
// acceptance fixtures, not an independent accuracy corpus or human QA review.
export async function runWindowEdges({context,page,native,worker,browserCdp,id,attach,test,until,pause,report}){
 await test('N35','Two simultaneous native panels preserve independent settings patches and target their focused windows',async()=>{
  const before=(await browserCdp.send('Target.getTargets')).targetInfos;
  const existing=new Set(before.map(t=>t.targetId));
  const destination='https://fixture.example.net/products/window-two';
  await browserCdp.send('Target.createTarget',{url:destination,newWindow:true});
  let second;
  await until(()=>{second=context.pages().find(p=>p!==page&&p.url()===destination);return second;},'second browser window');
  const secondCdp=await context.newCDPSession(second);
  const {targetInfo}=await secondCdp.send('Target.getTargetInfo');
  const secondWindow=await browserCdp.send('Browser.getWindowForTarget',{targetId:targetInfo.targetId});
  const firstInfo=await (await context.newCDPSession(page)).send('Target.getTargetInfo');
  const firstWindow=await browserCdp.send('Browser.getWindowForTarget',{targetId:firstInfo.targetInfo.targetId});
  assert.notEqual(firstWindow.windowId,secondWindow.windowId,'Must be different native windows');
  await browserCdp.send('Browser.setWindowBounds',{windowId:secondWindow.windowId,bounds:{left:20,top:20,width:1288,height:851}});
  let tab;
  await until(async()=>{tab=(await browserCdp.send('Target.getTargets',{filter:[{type:'tab'}]})).targetInfos.find(t=>!existing.has(t.targetId)&&t.url===destination);return tab;},'second window tab target');
  await second.bringToFront();
  await browserCdp.send('Extensions.triggerAction',{id,targetId:tab.targetId});
  let panelTarget;
  await until(async()=>{panelTarget=(await browserCdp.send('Target.getTargets')).targetInfos.find(t=>!existing.has(t.targetId)&&t.url===`chrome-extension://${id}/sidepanel.html`);return panelTarget;},'second native panel target');
  const secondNative=await attach(panelTarget.targetId,second);
  await until(()=>secondNative.evaluate("Boolean(document.querySelector('#scan'))"),'second panel ready');
  assert.equal((await browserCdp.send('Target.getTargets')).targetInfos.filter(t=>t.url===`chrome-extension://${id}/sidepanel.html`).length,2);
  if(!await secondNative.evaluate("document.querySelector('.settings-panel').open"))await secondNative.click('.settings-panel > summary');
  await secondNative.click('#auto-source-hunt');
  await page.bringToFront();
  if(!await native.evaluate("document.querySelector('.settings-panel').open"))await native.click('.settings-panel > summary');
  await native.click('#prefer-made-in-usa');
  const saved=()=>worker.evaluate(async()=>(await chrome.storage.local.get('dropshredder-feature-settings-v1'))['dropshredder-feature-settings-v1']);
  await until(async()=>{const s=await saved();return s.autoSourceHunt===false&&s.preferMadeInUSA===false;},'both window patches persisted');
  const patches=await saved();assert.equal(patches.autoProtection,true);assert.equal(patches.toneMode,'nuclear');
  await page.goto('https://fixture.example.com/products/mug');await page.bringToFront();
  await native.click('#scan');await until(()=>native.evaluate("!document.querySelector('#scan').disabled"),'first window scan',20000);
  const first=JSON.parse(await native.evaluate("document.querySelector('#raw').textContent"));assert.equal(first.product.url,'https://fixture.example.com/products/mug');assert.equal(first.product.sku,'FIXTURE-MUG-001');
  await second.bringToFront();await secondNative.click('#scan');await until(()=>secondNative.evaluate("!document.querySelector('#scan').disabled"),'second window scan',20000);
  const other=JSON.parse(await secondNative.evaluate("document.querySelector('#raw').textContent"));assert.equal(other.product.url,destination);assert.equal(other.product.sku,'WINDOW-TWO-002');
  await secondNative.screenshot('native-two-window-panel.png');
  // Each panel retains its own checkbox state until reopened. Restore using the
  // actual control that issued each patch; no storage or synthetic UI writes.
  await secondNative.click('#auto-source-hunt');await page.bringToFront();await native.click('#prefer-made-in-usa');
  await until(async()=>{const s=await saved();return s.autoSourceHunt===true&&s.preferMadeInUSA===true;},'window preferences restored');
  await second.close();await page.bringToFront();
  await until(async()=>(await browserCdp.send('Target.getTargets')).targetInfos.filter(t=>t.url===`chrome-extension://${id}/sidepanel.html`).length===1,'second native panel disposed');
  report.notTested=report.notTested.map(s=>s.replace('Concurrent native panels; ',''));
  return {windowIds:[firstWindow.windowId,secondWindow.windowId],products:[first.product.url,other.product.url],preservedPatches:patches,scope:'Two actual native panels, user controls and focused-window scans; no independent tester'};
 });
}

export async function runContextMenus({context,page,native,worker,id,test,until,pause,report}){
 await context.route('https://fixture.example.com/menu-image.png',route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAIAAAC0Ujn1AAAAKUlEQVR4nGN0CEhgoA1gopG5o0aPGj1q9KjRo0aPGj1q9KjRo0aPCKMBSJsBLOf+6uIAAAAASUVORK5CYII=','base64')}));
 await context.route('https://fixture.example.com/products/context-menu',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Owned menu product</title><h1>Selection Model 076</h1><img id="menu-image" src="/menu-image.png" width="100" height="100" alt="Owned image"><p>$12.00</p><button>Add to cart</button>'}));
 await context.route(/https:\/\/(?:www\.)?google.com\/search/,route=>route.fulfill({contentType:'text/html',body:'<p>Owned intercepted context search; no Google query sent.</p>'}));
 await context.route(/^https:\/\/(?:lens\.google\.com|www\.bing\.com|yandex\.com|tineye\.com)\//,route=>route.fulfill({contentType:'text/html',body:'<p>Owned intercepted reverse-image destination; no test image URL sent.</p>'}));
 const choose=async({selector='h1',kind,index=0,rootSteps=2})=>{
  await page.bringToFront();await page.locator(selector).click({button:'right'});await pause(300);
  await native.screenshot(`native-context-${kind}-open.png`);
  // Page screenshot7ba932 establishes DropShredder two rows above End
  // (View source, Inspect). Selection/image menus omit View source. Actual
  // browser keyboard input selects the native menu; command outcomes below
  // must prove correct context, with no direct onClicked/event invocation.
  execFileSync('xdotool',['key','End']);
  for(let i=0;i<rootSteps;i++)execFileSync('xdotool',['key','Up']);
  execFileSync('xdotool',['key','Right']);await pause(300);
  await native.screenshot(`native-context-${kind}-submenu.png`);
  execFileSync('xdotool',['key','Home']);
  for(let i=0;i<index;i++)execFileSync('xdotool',['key','Down']);
  execFileSync('xdotool',['key','Return']);
 };
 const chooser=async()=>{let tab;await until(()=>{tab=context.pages().find(p=>p.url().startsWith(`chrome-extension://${id}/search.html#ds-search-`));return tab;},'native context-menu local chooser');await tab.locator('#ds-search-chooser').waitFor();return tab;};
 const targets=async(host)=>{
  const tabs=await worker.evaluate(()=>chrome.tabs.query({}));
  return tabs.map(t=>({id:t.id,url:t.pendingUrl||t.url||'',state:t.pendingUrl?'pending':'committed'})).filter(t=>{try{return new URL(t.url).hostname===host;}catch{return false;}});
 };
 const closeSearches=async()=>{for(const p of context.pages())if(p!==page)await p.close();await page.bringToFront();};
 await test('N38-page','Actual page/product context menu opens a local chooser, cancellation shares nothing and selected searches are bounded',async()=>{
  await page.goto('https://fixture.example.com/products/context-menu');const start=context.pages().length;
  await choose({kind:'page'});let tab=await chooser();assert.equal(context.pages().length,start+1);assert.ok(await tab.locator('#ds-search-chooser label').count()>8);
  await tab.keyboard.press('Escape');assert.equal(await tab.locator('#ds-search-chooser').count(),0);assert.equal(context.pages().length,start+1);await tab.close();
  await choose({kind:'page-selected'});tab=await chooser();await tab.locator('#ds-search-chooser button').first().click();
  await until(()=>context.pages().length===start+9,'context hunt opens local chooser plus8 searches');
  await until(async()=>(await targets('www.google.com')).length===8,'Chrome product destination records');
  const destinations=(await targets('www.google.com')).map(t=>t.url);assert.equal(destinations.length,8);
  for(const url of destinations){const u=new URL(url);assert.equal(u.hostname,'www.google.com');assert.ok(u.searchParams.get('q').includes('Owned menu product'));}
  await closeSearches();return {destinations,scope:'Real native menu/chooser and actual Chrome pending/committed target URLs; DNS-refused engineering destinations, no claim remote results loaded'};
 });
 await test('N38-selection','Actual selected-text context menu searches the selection rather than the tab title',async()=>{
  await page.locator('h1').click({clickCount:3});assert.equal((await page.evaluate(()=>getSelection().toString())).trim(),'Selection Model 076');
  await choose({kind:'selection',rootSteps:1});const tab=await chooser();await tab.locator('#ds-search-chooser button').first().click();
  await until(()=>context.pages().length===10,'selected context bounded batch');
  await until(async()=>(await targets('www.google.com')).length===8,'Chrome selection destination records');
  const queries=(await targets('www.google.com')).map(t=>new URL(t.url).searchParams.get('q'));
  assert.equal(queries.length,8);for(const q of queries){assert.ok(q.includes('Selection Model 076'));assert.ok(!q.includes('Owned menu product'));}
  await closeSearches();return {selection:'Selection Model 076',queries};
 });
 await test('N38-store','Actual store context menu offers domain-scoped destinations without opening them before selection',async()=>{
  await page.mouse.click(40,300);await choose({kind:'store',index:1});const tab=await chooser();assert.equal(await tab.locator('#ds-search-chooser label').count(),7);assert.equal(context.pages().length,2);
  for(const input of await tab.locator('#ds-search-chooser input').all())await input.uncheck();
  const selected=tab.locator('#ds-search-chooser label').filter({hasText:/^\s*bbb\s+—/});assert.equal(await selected.count(),1);assert.equal((await selected.innerText()).trim(),'bbb — www.google.com');await selected.locator('input').check();await tab.locator('#ds-search-chooser button').first().click();
  await until(async()=>context.pages().length===3&&(await targets('www.google.com')).length===1,'one explicitly selected store destination');
  const destination=(await targets('www.google.com'))[0].url;assert.equal(new URL(destination).searchParams.get('q'),'"fixture.example.com" site:bbb.org');
  await closeSearches();return {choices:7,openedBeforeSelection:0,openedAfterSelection:1,destination};
 });
 await test('N38-image','Actual image context menu preserves the chosen public image URL and sends nothing before destination selection',async()=>{
  assert.equal(await page.locator('#menu-image').evaluate(el=>el.complete&&el.naturalWidth>0),true,'Owned image must decode');
  await choose({selector:'#menu-image',kind:'image',rootSteps:1,index:0});const tab=await chooser();
  assert.ok(await tab.locator('#ds-search-chooser label').count()>=4);assert.equal(context.pages().length,2);
  const choices=await tab.locator('#ds-search-chooser').innerText();assert.match(choices,/lens\.google\.com/);assert.match(choices,/tineye\.com/);
  for(const input of await tab.locator('#ds-search-chooser input').all())await input.uncheck();
  const selected=tab.locator('#ds-search-chooser label').filter({hasText:'lens.google.com'});assert.equal(await selected.count(),1);await selected.locator('input').check();await tab.locator('#ds-search-chooser button').first().click();
  await until(async()=>context.pages().length===3&&(await targets('lens.google.com')).length===1,'one explicitly selected image destination');
  const destination=(await targets('lens.google.com'))[0].url;const parsed=new URL(destination);assert.equal(parsed.hostname,'lens.google.com');assert.equal(parsed.searchParams.get('url'),'https://fixture.example.com/menu-image.png');
  await closeSearches();
  report.contextMenuExploration={status:'ACTUAL PAGE/SELECTION/STORE/IMAGE COMMANDS VERIFIED',scope:'Native Chrome menus and real local choosers; owned public context and intercepted test queries, not independent live-site review'};
  await page.goto('https://fixture.example.com/products/mug');return {imageUrl:'https://fixture.example.com/menu-image.png',destination,openedBeforeSelection:0,openedAfterSelection:1,scope:'Actual selected destination URL, intercepted HTTP; no image URL sent externally'};
 });
}

export async function runOcrCancellation({page,native,test,until,pause,output,root}){
 await test('N39','Changing the selected OCR language cancels or invalidates pending results and the next native read recovers',async()=>{
  await page.bringToFront();await native.click('#label-language');await native.key('Home','Home',36);await native.key('Down','ArrowDown',40);await native.key('Down','ArrowDown',40);await native.key('Enter','Enter',13);
  assert.equal(await native.evaluate("document.querySelector('#label-language').value"),'hin');
  await native.setFiles('#label-image',[path.join(root,'tests/fixtures/ocr/hindi-model-original.png')]);await native.click('#label-read');
  const pending=await native.evaluate("({disabled:document.querySelector('#label-read').disabled,status:document.querySelector('#label-status').textContent})");assert.equal(pending.disabled,true);assert.match(pending.status,/Reading image locally/);
  await native.click('#label-language');await native.key('Home','Home',36);await native.key('Enter','Enter',13);
  await until(()=>native.evaluate("!document.querySelector('#label-read').disabled"),'native cancellation/selection ready');await pause(2500);
  assert.equal(await native.evaluate("document.querySelector('#label-results').textContent"),'');assert.match(await native.evaluate("document.querySelector('#label-status').textContent"),/No file processed until/);
  await native.setFiles('#label-image',[path.join(output,'owned-ocr-label.png')]);await native.click('#label-read');await until(()=>native.evaluate("document.querySelector('#label-status').textContent.startsWith('Local analysis complete.')"),'recovered English read',60000);
  const result=await native.evaluate("document.querySelector('#label-results').textContent");assert.match(result,/PRODUCT\s*12345/);await native.screenshot('native-ocr-cancellation-recovered.png');
  return {pending,recovered:result.slice(0,300),scope:'Real native model change, no stale result, successful next read; no independent photo/blur/rotation accuracy'};
 });
}

export async function runResourceEdges({context,page,native,worker,browserCdp,test,until,pause,report}){
 await test('N36','32 quiet background tabs cause no toast flood, registration growth or unsolicited investigation',async()=>{
  const tabs=[];const metricPage=await context.newCDPSession(page);await metricPage.send('Performance.enable');
  const metrics=async()=>Object.fromEntries((await metricPage.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
  const rss=()=>{
   const processes=execFileSync('ps',['-eo','pid,ppid,rss,args'],{encoding:'utf8'}).split('\n').map(s=>s.trim().match(/^(\d+)\s+(\d+)\s+(\d+)\s+(.+)$/)).filter(Boolean);
   // Aggregate Chromium process RSS is deliberately descriptive and double
   // counts shared pages. It is not extension-only memory or a PSS benchmark.
   const browserRows=processes.filter(r=>/\/chrome(?:\s|$)/.test(r[4])||/chrome --type=/.test(r[4]));
   return {processCount:browserRows.length,rssKiB:browserRows.reduce((n,r)=>n+Number(r[3]),0),scope:'All Chrome processes on this isolated hosted job; RSS includes shared-memory double counting'};
  };
  const beforeRss=rss();
  for(let i=0;i<32;i++){const tab=await context.newPage();tabs.push(tab);await tab.goto(`https://fixture.example.com/journal/background-${i}`);}
  await page.bringToFront();await pause(2500);
  const before=await metrics(),panelBefore=await native.metrics(),loadedRss=rss();
  const started=Date.now();await pause(5000);
  const after=await metrics(),panelAfter=await native.metrics();
  for(const tab of tabs)assert.equal(await tab.locator('#dropshredder-auto-verdict').count(),0);
  const scripts=await worker.evaluate(()=>chrome.scripting.getRegisteredContentScripts());assert.equal(scripts.length,1);
  const idle={elapsedMs:Date.now()-started,pageTaskSeconds:after.TaskDuration-before.TaskDuration,panelTaskSeconds:panelAfter.TaskDuration-panelBefore.TaskDuration,pageHeapBytes:after.JSHeapUsedSize,panelHeapBytes:panelAfter.JSHeapUsedSize};
  for(const tab of tabs)await tab.close();await page.bringToFront();
  const result={backgroundTabs:32,beforeRss,loadedRss,afterCloseRss:rss(),idle,scope:'Owned quiet pages,5-second observed idle interval, DevTools-attached page/panel; descriptive measurements, not real-page CPU or a population/performance budget pass'};
  report.resourceObservations=result;return result;
 });
}

export async function runStorageRecovery({native,worker,test,until,pause,report,restart}){
 await test('N37','Actual malformed Chrome storage fails closed across a browser restart and normal native writes recover canonical settings',async()=>{
  const faults={
   'dropshredder-feature-settings-v1':{autoProtection:'true',weeklyIntelligenceUpdates:'true',autoSourceHunt:1,preferMadeInUSA:[],toneMode:'unsupported'},
   'dropshredder-display-v1':{theme:'unsupported',density:[],textScale:9000},
   'dropshredder-user-lists-v1':{schemaVersion:1,lists:[{current:{list:{id:'untrusted-invalid',version:999999},authentication:'signed'}}],keys:[{trusted:true}]}
  };
  assert.equal(await worker.evaluate(()=>chrome.permissions.contains({origins:['https://*/*']})),false,'Must inject only after genuine revocation');
  // Deliberate fault injection in the disposable engineering profile only.
  // No grant, ground truth, valid subscription or installed user data is written.
  await worker.evaluate(value=>chrome.storage.local.set(value),faults);
  ({native,worker}=await restart());await pause(800);
  const controls=await native.evaluate("({source:document.querySelector('#auto-source-hunt').checked,auto:document.querySelector('#auto-protection').checked,weekly:document.querySelector('#list-auto-weekly').checked,origin:document.querySelector('#prefer-made-in-usa').checked,tone:document.querySelector('#tone-mode').value,theme:document.documentElement.dataset.theme,textScale:document.documentElement.dataset.textScale,savedLists:document.querySelector('#saved-lists').textContent})");
  assert.deepEqual({source:controls.source,auto:controls.auto,origin:controls.origin,tone:controls.tone},{source:false,auto:false,origin:false,tone:'professional'});
  assert.equal(controls.theme,'dark');assert.equal(controls.textScale,'100');
  assert.equal(controls.weekly,false);assert.equal(controls.savedLists,'No user-added lists.');
  assert.equal(await worker.evaluate(()=>chrome.permissions.contains({origins:['https://*/*']})),false);
  assert.deepEqual(await worker.evaluate(()=>chrome.scripting.getRegisteredContentScripts()),[]);
  await native.click('.settings-panel > summary');await native.click('#auto-source-hunt');
  await until(async()=>Boolean((await worker.evaluate(()=>chrome.storage.local.get('dropshredder-feature-settings-v1')))['dropshredder-feature-settings-v1']?.autoSourceHunt===true),'normal writer recovers malformed state');
  const canonical=(await worker.evaluate(()=>chrome.storage.local.get('dropshredder-feature-settings-v1')))['dropshredder-feature-settings-v1'];
  assert.deepEqual(canonical,{autoSourceHunt:true,autoProtection:false,weeklyIntelligenceUpdates:false,preferMadeInUSA:false,toneMode:'professional'});
  await native.screenshot('native-malformed-storage-recovered.png');
  report.storageFaultFixture={faults,controls,canonical,scope:'Explicit engineering-only Chrome storage fault and full profile restart, not unmodified independent QA'};
  return report.storageFaultFixture;
 });
}

export async function observeLiveResources({page,context,pause}){
 let cdp;
 try{
  cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');
  const snapshot=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
  const before=await snapshot(),started=Date.now();await pause(5000);const after=await snapshot();
  const intervalMs=Date.now()-started;
  const dom=await page.evaluate(()=>({elements:document.querySelectorAll('*').length,scrollHeight:document.documentElement.scrollHeight,viewport:innerHeight}));
  const inputStart=Date.now();await page.mouse.wheel(0,250);
  const frame=await page.evaluate(()=>new Promise(resolve=>{const timeout=setTimeout(()=>resolve(false),3000);requestAnimationFrame(()=>{clearTimeout(timeout);resolve(true);});}));
  return {status:frame?'OBSERVED':'FRAME_NOT_OBSERVED',intervalMs,taskSeconds:after.TaskDuration-before.TaskDuration,scriptSeconds:after.ScriptDuration-before.ScriptDuration,heapBytes:after.JSHeapUsedSize,dom,scrollFrameMs:frame?Date.now()-inputStart:null,scope:'Current public product page, read-only DevTools metrics and one real wheel input; all site/page CPU, not extension-only CPU or calibrated resource acceptance'};
 }catch(error){return {status:'MEASUREMENT_UNAVAILABLE',error:String(error),scope:'Provider/page limitations are not a performance pass'};}
 finally{await cdp?.detach().catch(()=>{});}
}
