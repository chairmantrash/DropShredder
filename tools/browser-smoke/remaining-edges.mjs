import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

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

export async function captureContextMenu({page,native,pause,report}){
 await page.bringToFront();await page.locator('h1').click({button:'right'});await pause(500);
 await native.screenshot('native-context-menu-page.png');
 report.contextMenuExploration={status:'CAPTURED — COMMAND SELECTION UNVERIFIED',scope:'Actual Chrome context menu opened with a right-click; screenshot must establish menu position before choosing commands'};
 execFileSync('xdotool',['key','Escape']);
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
  const controls=await native.evaluate("({source:document.querySelector('#auto-source-hunt').checked,auto:document.querySelector('#auto-protection').checked,origin:document.querySelector('#prefer-made-in-usa').checked,tone:document.querySelector('#tone-mode').value,theme:document.documentElement.dataset.theme,textScale:document.documentElement.dataset.textScale})");
  assert.deepEqual({source:controls.source,auto:controls.auto,origin:controls.origin,tone:controls.tone},{source:false,auto:false,origin:false,tone:'professional'});
  assert.equal(controls.theme,'dark');assert.equal(controls.textScale,'100');
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
