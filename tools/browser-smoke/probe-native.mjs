import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// Public CDP toolbar hook and trusted native-panel input in a disposable profile.
// No storage writes, permission overrides, manifest changes or private methods.
const root = path.resolve(import.meta.dirname, '../..');
const ext = path.join(root, '.output/chrome-mv3');
const output = path.join(root, 'browser-smoke-results');
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'dropshredder-native-'));
const headed = process.env.DS_NATIVE_HEADED === '1';
await fs.mkdir(output, { recursive: true });
const errors = [], externalRequests = [], providerRequests = [];
let feedVersion=1, providerMode="normal", feedMode="unsigned";
const fixtureSigningPair=generateKeyPairSync('ed25519');
const fixturePublicKey=fixtureSigningPair.publicKey.export({format:'der',type:'spki'}).subarray(-32).toString('base64url');
const signedFixtureList=()=>{
  const payload=JSON.stringify(fixtureList());
  return {payload,signature:{keyId:'browser-fixture-key',value:sign(null,Buffer.from(payload,'utf8'),fixtureSigningPair.privateKey).toString('base64url')}};
};
const fixtureList=()=>({schemaVersion:1,id:"browser-fixture",title:"Owned browser reference",sourceUrl:"https://publisher.example.com/products.json",license:"CC0-1.0",publishedAt:new Date(Date.now()-1000).toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString(),version:feedVersion,records:[{id:"mug",title:"Fixture reference mug",url:"https://manufacturer.example.com/products/mug",gtin:"012345678905",attributes:{},entities:[{role:"manufacturer",name:"Fixture Maker",sourceUrl:"https://manufacturer.example.com/about",observedAt:new Date(Date.now()-1000).toISOString()}]}]});
const report = { sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  startedAt: new Date().toISOString(), mode: headed ? 'headed Chromium / Xvfb' : 'headless Chromium', status: 'RUNNING', tests: [], errors, externalRequests, providerRequests,
  notTested: ['Independent A01-D06 desktop QA', 'Explicit operator accept/deny of native Chrome permission UI',
    'Live merchant/category accuracy', 'Concurrent native panels; malformed storage tested in core, not browser; native context-menu UI; live-store accuracy; RDAP/CPSC live endpoints'] };
let context, worker, browserCdp, native, id, page;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn, label, timeout = 10000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { if (await fn()) return; await pause(100); }
  throw new Error(`Timed out: ${label}`);
}
async function test(id, description, fn) {
  const start = Date.now();
  try {
    const details = await fn();
    report.tests.push({ id, description, status: 'PASS', elapsedMs: Date.now() - start, details });
    console.log(`PASS ${id}: ${description}`);
  } catch (error) {
    report.tests.push({ id, description, status: 'FAIL', elapsedMs: Date.now() - start, error: String(error) }); throw error;
  }
}
async function attach(targetId) {
  const { sessionId } = await browserCdp.send('Target.attachToTarget', { targetId, flatten: false });
  let sequence = 0;
  const pending = new Map();
  browserCdp.on('Target.receivedMessageFromTarget', event => {
    if (event.sessionId !== sessionId) return;
    const response = JSON.parse(event.message);
    if (response.method === 'Runtime.exceptionThrown') errors.push(response.params.exceptionDetails.text);
    if(response.method==='Network.requestWillBeSent' && /^https?:/.test(response.params.request.url)) externalRequests.push(new URL(response.params.request.url).origin);
    if(response.method==='Fetch.requestPaused'){
      const {requestId,request}=response.params;const url=request.url;providerRequests.push({url,mode:providerMode,at:new Date().toISOString()});
      void(async()=>{
        const mode=providerMode;if(mode==='delay') await pause(2000);
        const body=url.includes('publisher.example.com')?(feedMode==='signed'?signedFixtureList():fixtureList()):url.includes('rdap.verisign.com')?{ldhName:'example.com',events:[{eventAction:'registration',eventDate:'2000-01-01T00:00:00Z'}]}:[{RecallID:123,RecallNumber:'FIXTURE-123',Title:'Fixture mug notice',URL:'https://www.cpsc.gov/Recalls/2026/fixture',RecallDate:'2026-01-01',Products:[{Model:'FIXTURE-MUG-001'}]}];
        await call('Fetch.fulfillRequest',{requestId,responseCode:mode==='error'?503:200,responseHeaders:[{name:'content-type',value:'application/json'}],body:Buffer.from(JSON.stringify(body)).toString('base64')});
      })().catch(()=>{});return;
    }
    const task = pending.get(response.id);
    if (!task) return;
    pending.delete(response.id); clearTimeout(task.timer);
    if (response.error) task.reject(new Error(JSON.stringify(response.error))); else task.resolve(response.result);
  });
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++sequence;
    const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`Native CDP timeout: ${method}`)); }, 10000);
    pending.set(requestId, { resolve, reject, timer });
    browserCdp.send('Target.sendMessageToTarget', { sessionId, message: JSON.stringify({ id: requestId, method, params }) })
      .catch(error => { clearTimeout(timer); pending.delete(requestId); reject(error); });
  });
  await call('Runtime.enable');await call('Network.enable');
  if(headed) await call('Fetch.enable',{patterns:[{urlPattern:'https://publisher.example.com/*'},{urlPattern:'https://rdap.verisign.com/*'},{urlPattern:'https://www.saferproducts.gov/RestWebServices/*'}]});
  const evaluate = async expression => {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value;
  };
  const click = async selector => {
    await until(() => evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)})?.getBoundingClientRect().width)`), `visible control ${selector}`);
    await evaluate(`(() => { const el=document.querySelector(${JSON.stringify(selector)}); if(!el || el.disabled) throw new Error('Missing/disabled control'); el.scrollIntoView({block:'center'}); })()`);
    // Chrome Views forwards native-panel input through compositor hit testing.
    // Let the scroll settle before computing/clicking a visible, unobscured hit.
    await pause(200);
    const point = await evaluate(`(() => { const el=document.querySelector(${JSON.stringify(selector)}); const r=el.getBoundingClientRect(); if(!r.width || !r.height) throw new Error('Control is hidden'); const x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y); if(!hit || !(hit===el || el.contains(hit))) throw new Error('Control is obscured'); return {x,y}; })()`);
    if (headed) {
      const { targetInfo } = await (await context.newCDPSession(page)).send('Target.getTargetInfo');
      const { bounds } = await browserCdp.send('Browser.getWindowForTarget', { targetId: targetInfo.targetId });
      const viewport = await evaluate('({width:innerWidth,height:innerHeight})');
      // The controlled Chrome 156/Xvfb screenshots show the panel WebContents
      // inset 9px from the window right edge and 8px from its bottom edge.
      // Require the observed window size; changed geometry fails explicitly.
      assert.equal(bounds.width, 1288); assert.ok([850, 851].includes(bounds.height), `Unexpected window height ${bounds.height}`);
      assert.ok(viewport.width > 0 && viewport.height > 0);
      const desktop = { x: bounds.left + bounds.width - viewport.width - 9 + point.x,
        y: bounds.top + bounds.height - viewport.height - 8 + point.y };
      report.nativeDesktopGeometry = { bounds, viewport, insetRight: 9, insetBottom: 8 };
      execFileSync('xdotool', ['mousemove', String(Math.round(desktop.x)), String(Math.round(desktop.y)), 'click', '1']);
      await pause(150);
      return;
    }
    await call('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
    await call('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
    await call('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
  };
  const key = async (key, code, windowsVirtualKeyCode) => {
    if (headed) { execFileSync('xdotool', ['key', key === 'Enter' ? 'Return' : key]); await pause(100); return; }
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode });
  };
  const screenshot = async name => {
    if (headed) {
      // Actual X11 desktop capture includes browser chrome/native dialogs.
      // No WebContents screenshot fallback is labelled as browser-chrome evidence.
      execFileSync('scrot', ['--overwrite', path.join(output, name)]);
      return;
    }
    const capture = await call('Page.captureScreenshot', { format: 'png' });
    await fs.writeFile(path.join(output, name), Buffer.from(capture.data, 'base64'));
  };
  const type=async(selector,value)=>{await click(selector);
    if(headed){execFileSync('xdotool',['key','ctrl+a']);execFileSync('xdotool',['type','--clearmodifiers','--delay','1',String(value)]);}
    else {await call('Input.dispatchKeyEvent',{type:'keyDown',key:'a',code:'KeyA',modifiers:2,windowsVirtualKeyCode:65});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'a',code:'KeyA',windowsVirtualKeyCode:65});await call('Input.insertText',{text:String(value)});}
  };
  const setFiles=async(selector,files)=>{
    const {root}=await call('DOM.getDocument',{depth:1});
    const {nodeId}=await call('DOM.querySelector',{nodeId:root.nodeId,selector});
    if(!nodeId) throw new Error('File input missing: '+selector);
    // Public CDP chooser plumbing against the real native-panel WebContents,
    // not a test of the operating system's graphical file-picker dialog.
    await call('DOM.setFileInputFiles',{files,nodeId});
  };
  return { evaluate, click, key, screenshot, type, setFiles };
}
async function openNative() {
  context = await chromium.launchPersistentContext(profile, { channel: 'chromium', headless: !headed,
    args: ['--enable-unsafe-extension-debugging', `--disable-extensions-except=${ext}`, `--load-extension=${ext}`] });
  context.on('request', request => {
    let fromExtension = request.serviceWorker()?.url().startsWith('chrome-extension://');
    try { fromExtension ||= request.frame().url().startsWith('chrome-extension://'); } catch {}
    if (fromExtension && /^https?:/.test(request.url())) externalRequests.push(new URL(request.url()).origin);
  });
  worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
  id = new URL(worker.url()).host; page = context.pages()[0];
  // Reserved example.com origin with wholly owned, routed HTML; no live store.
  // Unlike .test, this URL passes the public-evidence export/link guard.
  await context.route('https://fixture.example.com/**', route => {
    const url=route.request().url();
    if(url.includes('/slow-policy')) return void(async()=>{await pause(2000);await route.fulfill({contentType:'text/html',body:'<p>Return policy: returns accepted within 30 days.</p>'});})().catch(()=>{});
    const product={"@context":"https://schema.org","@type":"Product",name:"Fixture mug",sku:"FIXTURE-MUG-001",gtin:"012345678905",offers:{"@type":"Offer",price:"12.00",priceCurrency:"USD",availability:"https://schema.org/InStock"}};
    const variant=url.includes('/variants');
    const structured=variant?{"@type":"ProductGroup",name:"Fixture mug",url:"https://fixture.example.com/products/variants",hasVariant:[{...product,sku:'RED-MUG',color:'red',offers:{price:10,priceCurrency:'USD'}},{...product,sku:'BLUE-MUG',color:'blue',offers:{price:20,priceCurrency:'USD'}}]}:product;
    return route.fulfill({contentType:'text/html',body:url.includes('/journal/')?'<title>Owned article</title><article><h1>How mugs are made</h1><p>No item for sale.</p></article>':
      '<!doctype html><title>Fixture mug</title><main><h1>Fixture mug</h1><p class="product-price">$12.00</p><button>Add to cart</button>'+ (variant?'<input type="radio" name="color" value="red"><input type="radio" name="color" value="blue" checked>':'')+'</main>'+
      (url.includes('sign-in')||url.includes('/field-only')?'<input type="password" autocomplete="current-password">':'')+
      (url.includes('/delayed')?'<a href="/slow-policy">Return policy</a>':'')+
      '<script type="application/ld+json">'+JSON.stringify(structured)+'</script>'});
  });
  browserCdp = await context.browser().newBrowserCDPSession(); report.browser = await browserCdp.send('Browser.getVersion');
  // Match the already-proven blank-tab action method first. Navigation comes
  // after native mounting, so a routed fixture cannot alter the action context.
  await until(async () => (await worker.evaluate(() => chrome.sidePanel.getPanelBehavior())).openPanelOnActionClick === true, 'native action behavior ready');
  report.actionOptions = await worker.evaluate(() => chrome.sidePanel.getOptions({}));
  const targets = await browserCdp.send('Target.getTargets', { filter: [{ type: 'tab' }] });
  assert.equal(targets.targetInfos.length, 1, 'Clean profile must expose one product tab');
  await browserCdp.send('Extensions.triggerAction', { id, targetId: targets.targetInfos[0].targetId });
  let target;
  await until(async () => {
    const list = await browserCdp.send('Target.getTargets');
    report.actionTargets = list.targetInfos.map(t => ({ type: t.type, url: t.url }));
    target = list.targetInfos.find(t => t.url === `chrome-extension://${id}/sidepanel.html`); return target;
  }, 'native panel target');
  native = await attach(target.targetId);
  await until(() => native.evaluate("Boolean(document.querySelector('#build-meta')?.textContent.includes('0.2.0'))"), 'panel ready');
}
const features = () => worker.evaluate(async () => (await chrome.storage.local.get('dropshredder-feature-settings-v1'))['dropshredder-feature-settings-v1']);
try {
  await test('N01', 'Reviewed package mounts in the native side panel without host grants', async () => {
    const candidate = JSON.parse(await fs.readFile(path.join(import.meta.dirname, 'candidate-build-info.json'), 'utf8'));
    const actual=await fs.readdir(ext,{recursive:true,withFileTypes:true});
    assert.deepEqual(actual.filter(e=>e.isFile()).map(e=>path.relative(ext,path.join(e.parentPath,e.name))).sort(),candidate.buildFiles.map(e=>e.path).sort(),'Unexpected or missing package files');
    for (const file of candidate.buildFiles) {
      const bytes = await fs.readFile(path.join(ext, file.path)); assert.equal(bytes.length, file.bytes, file.path);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.path);
    }
    report.packagedSourceCommit = candidate.sourceCommit; await openNative();
    assert.equal(await native.evaluate("Boolean(document.querySelector('#scan'))"), true);
    assert.equal(await worker.evaluate(() => chrome.permissions.contains({ origins: ['https://*/*'] })), false);
    await native.screenshot('native-initial.png'); return { extensionId: id, files: candidate.buildFiles.length };
  });
  await test('N02', 'Trusted native source-hunt toggle saves through the background writer', async () => {
    await native.click('.settings-panel > summary'); await native.click('#auto-source-hunt');
    await until(async () => (await features())?.autoSourceHunt === true, 'source-hunt saved');
    assert.equal(await native.evaluate("document.querySelector('#auto-source-hunt').checked"), true);
  });
  await test('N03', 'Native origin and tone changes preserve the previous feature patch', async () => {
    await native.click('#prefer-made-in-usa'); await until(async () => (await features())?.preferMadeInUSA === true, 'origin saved');
    await native.click('#tone-mode'); await native.key('End', 'End', 35); await native.key('Enter', 'Enter', 13);
    await until(async () => (await features())?.toneMode === 'nuclear', 'tone saved');
    assert.deepEqual(await features(), { autoSourceHunt: true, autoProtection: false, weeklyIntelligenceUpdates: false, preferMadeInUSA: true, toneMode: 'nuclear' });
    await native.screenshot('native-settings.png');
  });
  await test('N04', 'Nondefault preferences survive a full native-profile restart', async () => {
    await context.close(); await openNative();
    await until(() => native.evaluate("document.querySelector('#tone-mode').value === 'nuclear'"), 'restored tone');
    assert.deepEqual(await native.evaluate("({source:document.querySelector('#auto-source-hunt').checked,origin:document.querySelector('#prefer-made-in-usa').checked,auto:document.querySelector('#auto-protection').checked})"), { source: true, origin: true, auto: false });
    await native.screenshot('native-after-restart.png');
  });
  await test('N05', 'Native product scan fails closed without host access', async () => {
    await page.goto('https://fixture.example.com/products/mug');
    await page.bringToFront();
    await native.click('#scan'); await until(() => native.evaluate("!document.querySelector('#scan').disabled"), 'scan settled');
    const state = await native.evaluate("({status:document.querySelector('#status').textContent,raw:document.querySelector('#raw').textContent,exportDisabled:document.querySelector('#export-report').disabled})");
    assert.match(state.status, /permission|access/i); assert.equal(state.raw, ''); assert.equal(state.exportDisabled, true);
    assert.deepEqual(await worker.evaluate(() => chrome.scripting.getRegisteredContentScripts()), []); return state;
  });
  await test('N06', 'Native remove-access control is safe without grants and preserves other preferences', async () => {
    await native.click('.local-data > summary'); await native.click('#revoke-optional-access');
    await until(() => native.evaluate("!document.querySelector('#revoke-optional-access').disabled"), 'remove access settled');
    assert.equal(await worker.evaluate(() => chrome.permissions.contains({ origins: ['https://*/*'] })), false);
    assert.deepEqual(await features(), { autoSourceHunt: true, autoProtection: false, weeklyIntelligenceUpdates: false, preferMadeInUSA: true, toneMode: 'nuclear' });
    const status = await native.evaluate("document.querySelector('#status').textContent"); assert.match(status, /didn.t have any extra site access/);
    return { status, scope: 'No-grant removal, not revocation of an accepted grant' };
  });
  await test('N07', 'Native checks produce no uncaught errors or external investigations', async () => {
    assert.deepEqual(errors, []); assert.deepEqual(externalRequests, []);
  });
  report.status = 'PASS — NATIVE RUNTIME SUBSET';
  // Permission exploration has separate accounting; never bypass Chrome consent.
  await native.click('#auto-protection');
  let settled = false;
  for (let n = 0; n < 100; n++) {
    settled = await native.evaluate("!document.querySelector('#auto-protection').disabled"); if (settled) break; await pause(100);
  }
  let granted = await worker.evaluate(() => chrome.permissions.contains({ origins: ['https://*/*'] }));
  report.permissionExploration = {
    status: settled ? 'REQUEST SETTLED — NATIVE PROMPT ACCEPT/DENY UNVERIFIED' : 'NATIVE PROMPT PENDING — AUTOMATION LIMITATION', settled, granted,
    ui: await native.evaluate("({checked:document.querySelector('#auto-protection').checked,disabled:document.querySelector('#auto-protection').disabled,status:document.querySelector('#auto-protection-status').textContent})"),
    scripts: await worker.evaluate(() => chrome.scripting.getRegisteredContentScripts()),
    targets: (await browserCdp.send('Target.getTargets')).targetInfos.map(t => ({ type: t.type, url: t.url })),
  };
  await native.screenshot('native-permission-request.png');
  if (headed) {
    // Desktop screenshot b9eef2e9 established the real dialog and its focused
    // Deny / following Allow buttons. X11 keyboard input acts on Chrome Views,
    // not an injected JS event or a permission override. Assertions fail if
    // focus/keyboard behavior differs; preserve every before/after screenshot.
    await test('N08', 'Genuine Chrome Deny leaves monitoring and host access off', async () => {
      assert.equal(settled, false, 'Expected pending native dialog'); assert.equal(granted, false);
      execFileSync('xdotool', ['key', 'Return']);
      await until(() => native.evaluate("!document.querySelector('#auto-protection').disabled"), 'native denial');
      assert.equal(await worker.evaluate(() => chrome.permissions.contains({ origins: ['https://*/*'] })), false);
      assert.equal(await native.evaluate("document.querySelector('#auto-protection').checked"), false);
      assert.equal((await features()).autoProtection, false);
      assert.match(await native.evaluate("document.querySelector('#auto-protection-status').textContent"), /permission was not granted/);
      assert.deepEqual(await worker.evaluate(() => chrome.scripting.getRegisteredContentScripts()), []);
      assert.equal(await page.locator('#dropshredder-auto-verdict').count(), 0);
      await native.screenshot('native-permission-denied.png');
    });
    await test('N09', 'Genuine Chrome Allow enables host access and the isolated automatic script', async () => {
      await native.click('#auto-protection');
      assert.equal(await native.evaluate("document.querySelector('#auto-protection').disabled"), true);
      // The first 300ms capture on 08dc76a4 showed Allow disabled. Wait for
      // Chrome's anti-accidental-acceptance delay, then preserve enabled UI.
      await pause(2500); await native.screenshot('native-permission-second-prompt.png');
      execFileSync('xdotool', ['key', 'Tab', 'Return']);
      await until(() => native.evaluate("!document.querySelector('#auto-protection').disabled"), 'native allowance');
      granted = await worker.evaluate(() => chrome.permissions.contains({ origins: ['https://*/*'] }));
      assert.equal(granted, true); assert.equal((await features()).autoProtection, true);
      assert.equal(await native.evaluate("document.querySelector('#auto-protection').checked"), true);
      const scripts = await worker.evaluate(() => chrome.scripting.getRegisteredContentScripts());
      assert.equal(scripts.length, 1); assert.equal(scripts[0].id, 'dropshredder-auto-shopping-v1'); assert.equal(scripts[0].world, 'ISOLATED');
      settled = true; report.permissionExploration.status = 'EXPLICIT NATIVE DENY THEN ALLOW OBSERVED';
      report.notTested = report.notTested.filter(item => !item.startsWith('Explicit operator accept/deny'));
      report.permissionExploration.afterDecision = { granted, scripts };
      await native.screenshot('native-permission-allowed.png');
    });
    await test('N10', 'Owned product fixture gets exactly one automatic alert after consent', async () => {
      await page.locator('#dropshredder-auto-verdict').waitFor({ state: 'attached', timeout: 8000 });
      assert.equal(await page.locator('#dropshredder-auto-verdict').count(), 1);
      await native.screenshot('native-product-toast.png');
    });
  }
  if (granted && settled) {
    await test('N11', 'Full native product scan after an observed grant on an owned HTTPS fixture', async () => {
      await native.click('#scan'); await until(() => native.evaluate("!document.querySelector('#scan').disabled"), 'full scan', 20000);
      const state = await native.evaluate("({status:document.querySelector('#status').textContent,raw:document.querySelector('#raw').textContent,exportDisabled:document.querySelector('#export-report').disabled})");
      assert.equal(state.status, 'Scan complete for fixture.example.com.');
      const scan = JSON.parse(state.raw); assert.equal(scan.product.title, 'Fixture mug');
      assert.equal(scan.product.sku, 'FIXTURE-MUG-001'); assert.equal(scan.product.price, 12);
      assert.equal(state.exportDisabled, false);
      await native.screenshot('native-fixture-scan.png'); return { status: state.status, product: scan.product, scope: 'Owned fixture, no merchant accuracy/explicit prompt acceptance claim' };
    });
    if (headed) {
      const scanFixture=async url=>{if(url) await page.goto(url);await page.bringToFront();await native.click('#scan');await until(()=>native.evaluate("!document.querySelector('#scan').disabled"),'fixture scan',20000);return native.evaluate("({status:document.querySelector('#status').textContent,raw:document.querySelector('#raw').textContent})");};
      const downloads=[];const downloadDir=path.join(output,'downloads');await fs.mkdir(downloadDir,{recursive:true});
      await browserCdp.send('Browser.setDownloadBehavior',{behavior:'allowAndName',downloadPath:downloadDir,eventsEnabled:true});
      browserCdp.on('Browser.downloadWillBegin',event=>downloads.push({...event,state:'started'}));
      browserCdp.on('Browser.downloadProgress',event=>{const item=downloads.find(x=>x.guid===event.guid);if(item) item.state=event.state;});
      await test('N15','Actual native JSON download redacts URL query/fragment and excludes raw fields',async()=>{
        const state=await scanFixture('https://fixture.example.com/products/mug?token=EXPORT_SECRET#private-fragment');assert.match(state.status,/Scan complete/);
        await native.click('#export-report');await until(()=>downloads.some(x=>x.state==='completed'),'actual JSON download');
        const item=downloads.find(x=>x.state==='completed'),bytes=await fs.readFile(path.join(downloadDir,item.guid),'utf8'),data=JSON.parse(bytes);
        assert.equal(item.suggestedFilename,'DropShredder-current-scan.json');assert.equal(data.product.url,'https://fixture.example.com/products/mug');assert.doesNotMatch(bytes,/EXPORT_SECRET|private-fragment/);
        for(const key of ['imageUrls','description','reviews','specifications','merchant','pageText']) assert.equal(key in data.product||key in data,false);
        await native.screenshot('native-export-download.png');return {filename:item.suggestedFilename,bytes:Buffer.byteLength(bytes),product:data.product};
      });
      await test('N16','Sensitive field on an ordinary product URL refuses manual scans and stale exports',async()=>{
        await scanFixture('https://fixture.example.com/products/mug');const before=downloads.length;
        await page.evaluate(()=>{const input=document.createElement('input');input.type='password';document.body.append(input);});
        await native.click('#export-report');await pause(600);assert.equal(downloads.length,before);assert.equal(await native.evaluate("document.querySelector('#raw').textContent"),'');
        const state=await scanFixture('https://fixture.example.com/products/field-only');assert.match(state.status,/sign-in|payment/);assert.equal(state.raw,'');await pause(4500);assert.equal(await page.locator('#dropshredder-auto-verdict').count(),0);return state;
      });
      await test('N17','SPA URL change invalidates the old report; an in-flight older scan cannot replace it',async()=>{
        await scanFixture('https://fixture.example.com/products/mug');await page.evaluate(()=>history.pushState({},'', '/products/second'));
        await until(()=>native.evaluate("document.querySelector('#raw').textContent === ''"),'SPA report invalidation');
        await page.goto('https://fixture.example.com/products/delayed');await native.click('#scan');await until(()=>native.evaluate("document.querySelector('#scan').disabled"),'scan started');
        await page.evaluate(()=>history.pushState({},'', '/products/after-delayed'));await pause(2600);
        assert.equal(await native.evaluate("document.querySelector('#raw').textContent"),'');assert.equal(await native.evaluate("document.querySelector('#export-report').disabled"),true);
      });
      await test('N18','Rapid tab switching invalidates reports and scans the actual active product tab',async()=>{
        await scanFixture('https://fixture.example.com/products/mug');const second=await context.newPage();await second.goto('https://fixture.example.com/products/second');await second.bringToFront();
        await until(()=>native.evaluate("document.querySelector('#raw').textContent === ''"),'second tab invalidation');await page.bringToFront();await second.bringToFront();
        await native.click('#scan');await until(()=>native.evaluate("!document.querySelector('#scan').disabled"),'second tab scan');const data=JSON.parse(await native.evaluate("document.querySelector('#raw').textContent"));assert.equal(data.product.url,'https://fixture.example.com/products/second');
        await second.close();await page.bringToFront();await until(()=>native.evaluate("document.querySelector('#raw').textContent === ''"),'closed tab invalidation');
      });
      await test('N19','Search chooser exposes destinations, traps focus, closes on Escape and opens at most eight background tabs',async()=>{
        await scanFixture('https://fixture.example.com/products/mug');const count=context.pages().length;await native.click('#hunt-sources');
        assert.equal(await native.evaluate("document.querySelector('#ds-search-chooser').open"),true);
        assert.ok(await native.evaluate("document.querySelectorAll('#ds-search-chooser label').length")>8);assert.equal(context.pages().length,count);
        await native.key('Tab','Tab',9);assert.equal(await native.evaluate("document.querySelector('#ds-search-chooser').contains(document.activeElement)"),true);
        await native.key('Escape','Escape',27);assert.equal(await native.evaluate("Boolean(document.querySelector('#ds-search-chooser'))"),false);assert.equal(await native.evaluate("document.activeElement.id"),'hunt-sources');
        await context.route(/https:\/\/(?:www\.)?google.com\/search/,route=>route.fulfill({contentType:'text/html',body:'<p>Owned search destination interception — no query sent to Google.</p>'}));
        await native.click('#hunt-sources');await native.click('#ds-search-chooser button');await until(()=>context.pages().length===count+8,'first bounded search batch');
        await native.click('#ds-search-chooser button');await until(()=>context.pages().length===count+10,'remaining search batch');
        assert.match(await native.evaluate("document.querySelector('#ds-search-chooser [role=status]').textContent"),/0 remaining/);
        await native.click('#ds-search-chooser button:last-child');for(const other of context.pages()) if(other!==page) await other.close();await page.bringToFront();
      });
      await test('N20','Same-URL selected variants extract the chosen SKU/price and reject export after changing selection',async()=>{
        const state=await scanFixture('https://fixture.example.com/products/variants'),data=JSON.parse(state.raw);assert.equal(data.product.sku,'BLUE-MUG');assert.equal(data.product.price,20);assert.equal(data.product.specifications.color,'blue');
        await page.locator('input[value=red]').check();const before=downloads.length;await native.click('#export-report');await pause(500);assert.equal(downloads.length,before);assert.equal(await native.evaluate("document.querySelector('#raw').textContent"),'');
        const red=await scanFixture(),next=JSON.parse(red.raw);assert.equal(next.product.sku,'RED-MUG');assert.equal(next.product.price,10);
      });
      await test('N25','Amazon extraction ignores an earlier accessibility heading in favor of the product title',async()=>{
        const url='https://www.amazon.com/dp/B000000001';await context.route(url,route=>route.fulfill({contentType:'text/html',body:'<h1>Product summary presents key product information Keyboard shortcut shift alt D</h1><span id="productTitle">Noctua fixture cooling fan</span><p>$20.00</p><button>Add to cart</button>'}));
        const state=await scanFixture(url),data=JSON.parse(state.raw);assert.equal(data.product.title,'Noctua fixture cooling fan');assert.equal(data.product.asin,'B000000001');
        await scanFixture('https://fixture.example.com/products/mug');return {scope:'Owned intercepted Amazon page; live store remains separately observed'};
      });
      await test('N21','RDAP cancellation and HTTP failure do not publish; explicit successful lookup stays informational',async()=>{
        await scanFixture('https://fixture.example.com/products/mug');providerMode='delay';const start=providerRequests.length;await native.click('#check-domain');await until(()=>providerRequests.length>start,'RDAP explicit request');await native.click('#cancel-domain');await pause(2100);
        assert.equal(JSON.parse(await native.evaluate("document.querySelector('#raw').textContent")).evidence.some(x=>x.id==='RDAP_DOMAIN_OBSERVATION'),false);
        providerMode='error';await native.click('#check-domain');await until(()=>native.evaluate("!document.querySelector('#check-domain').disabled"),'RDAP error');assert.match(await native.evaluate("document.querySelector('#status').textContent"),/503/);
        providerMode='normal';await native.click('#check-domain');await until(()=>native.evaluate("!document.querySelector('#check-domain').disabled"),'RDAP success');const data=JSON.parse(await native.evaluate("document.querySelector('#raw').textContent"));const item=data.evidence.find(x=>x.id==='RDAP_DOMAIN_OBSERVATION');assert.equal(item.weight,0);assert.equal(item.severity,'info');
        return {scope:'Owned intercepted RDAP response, not live provider accuracy'};
      });
      await test('N22','CPSC cancel/error/candidate notices leave verdict unchanged and use only the chosen public query',async()=>{
        await native.click('.recall-panel > summary');await native.type('#recall-query','Fixture');const before=JSON.parse(await native.evaluate("document.querySelector('#raw').textContent")).verdict;
        providerMode='delay';const start=providerRequests.length;await native.click('#recall-lookup');await until(()=>providerRequests.length>start,'CPSC explicit request');await native.click('#recall-cancel');await pause(2100);assert.equal(await native.evaluate("document.querySelector('#recall-results').children.length"),0);
        providerMode='error';await native.click('#recall-lookup');await until(()=>native.evaluate("!document.querySelector('#recall-lookup').disabled"),'CPSC error');assert.match(await native.evaluate("document.querySelector('#recall-status').textContent"),/503/);
        providerMode='normal';await native.click('#recall-lookup');await until(()=>native.evaluate("!document.querySelector('#recall-lookup').disabled"),'CPSC success');assert.equal(await native.evaluate("document.querySelector('#recall-results').children.length"),1);
        assert.deepEqual(JSON.parse(await native.evaluate("document.querySelector('#raw').textContent")).verdict,before);assert.match(await native.evaluate("document.querySelector('#recall-status').textContent"),/candidate/);
        const request=providerRequests.filter(x=>x.url.includes('saferproducts.gov')).at(-1);assert.equal(new URL(request.url).searchParams.get('RecallTitle'),'Fixture');return {scope:'Owned intercepted CPSC notice, exact unit still unverified'};
      });
      await test('N23','Feed preview needs explicit save; update, rollback, exact product leads and deletion use real native controls',async()=>{
        await native.click('.intelligence-panel > summary');await native.type('#list-url','https://publisher.example.com/products.json');await native.click('#list-subscribe');feedVersion=1;providerMode='normal';await native.click('#list-fetch');
        await until(()=>native.evaluate("!document.querySelector('#list-save').disabled"),'feed preview');assert.equal(await worker.evaluate(async()=>Boolean((await chrome.storage.local.get('dropshredder-user-lists-v1'))['dropshredder-user-lists-v1']?.lists?.length)),false);
        await native.click('#list-save');await until(()=>native.evaluate("document.querySelector('#saved-lists').textContent.includes('Owned browser reference')"),'saved list');
        const state=await scanFixture(),data=JSON.parse(state.raw),lead=data.evidence.find(x=>x.id==='IMPORTED_PRODUCT_LEAD');assert.ok(lead);assert.equal(lead.weight,0);assert.match(lead.observedValue,/manufacturer: Fixture Maker/);
        feedVersion=2;await native.click('#list-fetch');await until(()=>native.evaluate("!document.querySelector('#list-save').disabled"),'updated preview');await native.click('#list-save');await until(()=>native.evaluate("document.querySelector('#saved-lists').textContent.includes('v2')"),'updated list');
        await native.click('#saved-lists button:nth-of-type(2)');await until(()=>native.evaluate("document.querySelector('#saved-lists').textContent.includes('v1')"),'rolled back list');
        await native.click('#list-fetch');await until(()=>native.evaluate("!document.querySelector('#list-save').disabled"),'repeated version preview');await native.click('#list-save');await until(()=>native.evaluate("document.querySelector('#list-status').textContent.includes('version did not increase')"),'rollback protection');
        await native.screenshot('native-user-lists.png');await native.click('#list-clear');await until(()=>native.evaluate("document.querySelector('#saved-lists').textContent === 'No user-added lists.'"),'list reset');
      });

      await test('N26','Native publisher-key review, explicit pin and exact-byte signed feed preview require separate user actions',async()=>{
        await native.click('.intelligence-panel details > summary');
        const keyInput=JSON.stringify({sourceUrl:'https://publisher.example.com/products.json',keyId:'browser-fixture-key',issuer:'Owned browser fixture',publicKey:fixturePublicKey});
        await native.type('#publisher-key',keyInput);
        assert.equal(await native.evaluate("document.querySelector('#publisher-pin').disabled"),true);
        await native.click('#publisher-preview');
        await until(()=>native.evaluate("!document.querySelector('#publisher-pin').disabled"),'key review completes');
        const note=await native.evaluate("document.querySelector('#publisher-key-status').textContent");
        assert.match(note,/SHA-256 of base64url key/);
        await native.click('#publisher-pin');
        await until(()=>native.evaluate("document.querySelector('#publisher-key-status').textContent.includes('pinned')"),'trusted fixture key saved');
        const keys=await worker.evaluate(async()=>(await chrome.storage.local.get('dropshredder-user-lists-v1'))['dropshredder-user-lists-v1']?.keys??[]);
        assert.equal(keys.length,1);assert.equal(keys[0].keyId,'browser-fixture-key');
        feedMode='signed';feedVersion=4;
        await native.click('#list-fetch');
        await until(()=>native.evaluate("!document.querySelector('#list-save').disabled"),'signed feed preview');
        const disclosure=await native.evaluate("document.querySelector('#list-preview').textContent");
        assert.match(disclosure,/Signature checked against your pinned key browser-fixture-key/);
        assert.match(disclosure,/facts remain unverified/);
        const before=await worker.evaluate(async()=>(await chrome.storage.local.get('dropshredder-user-lists-v1'))['dropshredder-user-lists-v1']?.lists?.length??0);
        assert.equal(before,0,'Preview may not activate a list');
        await native.click('#list-save');
        await until(()=>native.evaluate("document.querySelector('#saved-lists').textContent.includes('v4')"),'signed feed saved');
        await native.screenshot('native-signed-feed-onboarding.png');
        await native.click('#list-clear');
        await until(()=>native.evaluate("document.querySelector('#saved-lists').textContent === 'No user-added lists.'"),'signed feed removed');
        feedMode='unsigned';return {scope:'Ephemeral owned Ed25519 test key; genuine native panel controls; no real issuer authenticated',signedVersion:4};
      });
      await test('N27','Chrome file-input dispatch previews JSON without saving and rejects malformed local files',async()=>{
        feedMode='unsigned';feedVersion=5;
        const valid=path.join(output,'owned-local-reference.json');
        const broken=path.join(output,'owned-invalid-reference.json');
        await fs.writeFile(valid,JSON.stringify(fixtureList()));
        await fs.writeFile(broken,'{ invalid JSON, no executable content }');
        await native.setFiles('#list-file',[valid]);
        await until(()=>native.evaluate("!document.querySelector('#list-save').disabled"),'native local-file preview');
        assert.match(await native.evaluate("document.querySelector('#list-preview').textContent"),/Owned browser reference/);
        const before=await worker.evaluate(async()=>(await chrome.storage.local.get('dropshredder-user-lists-v1'))['dropshredder-user-lists-v1']?.lists?.length??0);
        assert.equal(before,0,'Selecting a local file cannot activate it');
        await native.setFiles('#list-file',[broken]);
        await until(()=>native.evaluate("document.querySelector('#list-status').textContent.includes('JSON')"),'malformed file refusal');
        assert.equal(await native.evaluate("document.querySelector('#list-save').disabled"),true);
        const after=await worker.evaluate(async()=>(await chrome.storage.local.get('dropshredder-user-lists-v1'))['dropshredder-user-lists-v1']?.lists?.length??0);
        assert.equal(after,0);
        await native.screenshot('native-local-file-preview-refusal.png');
        return {scope:'Real native panel and Chrome CDP DOM.setFileInputFiles; operating system file-picker dialog NOT tested'};
      });
      await test('N28','Packaged local OCR engine and language data exist without making a remote request at panel startup',async()=>{
        const paths=['ocr/tesseract.min.js','ocr/worker.min.js','ocr/eng.traineddata.gz'];
        const inspected=await worker.evaluate(async paths=>{
          const results=[];
          for(const path of paths){
            const response=await fetch(chrome.runtime.getURL(path),{credentials:'omit',cache:'no-store'});
            if(!response.ok)throw new Error('Local packaged OCR asset missing: '+path);
            const data=await response.arrayBuffer();
            results.push({path,bytes:data.byteLength});
          }
          return results;
        },paths);
        assert.equal(inspected.length,3);
        assert.ok(inspected.every(v=>v.bytes>1000));
        assert.match(await native.evaluate("document.querySelector('label[for=label-image]').textContent"),/product label/i);
        assert.ok(!externalRequests.some(x=>/tessdata|jsdelivr|unpkg/i.test(x)),'No OCR download from external providers');
        return {files:inspected,scope:'Packaged local assets, not accuracy or photographed-label recognition'};
      });
      await test('N29','Actual native panel invokes bundled offline OCR on a synthetic local image',async()=>{
        const imageData=await native.evaluate(()=>{
          const canvas=document.createElement('canvas');canvas.width=850;canvas.height=170;
          const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,850,170);
          ctx.fillStyle='#000';ctx.font='bold 68px Arial';ctx.fillText('PRODUCT 12345',25,105);
          return canvas.toDataURL('image/png');
        });
        const filename=path.join(output,'owned-ocr-label.png');
        await fs.writeFile(filename,Buffer.from(imageData.split(',')[1],'base64'));
        await native.evaluate("document.querySelector('#label-image').closest('details').open=true");
        await native.setFiles('#label-image',[filename]);
        await native.click('#label-read');
        await until(()=>native.evaluate("document.querySelector('#label-status').textContent.includes('Local analysis complete')"),'offline OCR loaded and finished',60000);
        const outputText=await native.evaluate("document.querySelector('#label-results').textContent");
        assert.match(outputText,/OCR support: available/);
        assert.match(outputText,/PRODUCT|12345/i);
        assert.ok(!externalRequests.some(origin=>/tessdata|jsdelivr|unpkg|cdn\./i.test(origin)),JSON.stringify(externalRequests));
        await native.screenshot('native-packaged-ocr.png');
        return {scope:'Actual packaged OCR invocation on synthetic panel-local image; OCR accuracy on independent real photos remains untested',output:outputText.slice(0,250)};
      });
      await test('N24','Live no-key GLEIF request through native controls resolves an exact LEI without changing the product verdict',async()=>{
        const before=JSON.parse(await native.evaluate("document.querySelector('#raw').textContent")).verdict;await native.click('.entity-panel > summary');await native.type('#entity-lei','5493001KJTIIGC8Y1R12');await native.click('#entity-lookup');
        await until(()=>native.evaluate("!document.querySelector('#entity-lookup').disabled"),'live GLEIF',15000);assert.match(await native.evaluate("document.querySelector('#entity-results').textContent"),/Bloomberg Finance L.P./);
        assert.match(await native.evaluate("document.querySelector('#entity-status').textContent"),/does not establish safety or quality/);assert.deepEqual(JSON.parse(await native.evaluate("document.querySelector('#raw').textContent")).verdict,before);
        await native.screenshot('native-gleif-live.png');return {endpoint:'https://api.gleif.org/api/v1/lei-records/5493001KJTIIGC8Y1R12',scope:'Live public CC0 identity record only; not merchant/product attribution'};
      });
      if(process.env.DS_LIVE_SURFACES==='1'){
        report.liveSurfaces=[];
        const fixturePage=page;
        for(const surface of [
          {kind:'direct manufacturer / cooling fan',url:'https://www.noctua.at/en/products/nf-a12x25-g2-pwm',expected:'NF-A12x25'},
          {kind:'Amazon / cooling fan',url:'https://www.amazon.com/dp/B0FC636JBS',expected:'Noctua'},
          {kind:'Etsy / ceramic mug',url:'https://www.etsy.com/listing/93243192/unique-handmade-pottery-mug-ceramic-mug',expected:'Mug'},
          {kind:'Walmart / construction toy',url:'https://www.walmart.com/ip/41004055',expected:'LEGO'},
        ]){
          const entry={...surface,startedAt:new Date().toISOString(),status:'NOT_EVALUATED',limits:'Convenience sample; listing claims are not authenticated manufacturing truth; no calibrated accuracy estimate'};
          try{
            // Isolate each live site's late redirects/errors from the next
            // observation and from the deterministic fixture assertions.
            page=await context.newPage();
            const response=await page.goto(surface.url,{waitUntil:'domcontentloaded',timeout:20000});await pause(2000);
            entry.httpStatus=response?.status();entry.finalUrl=page.url();
            const body=(await page.locator('body').innerText({timeout:3000})).slice(0,15000);
            if(entry.httpStatus>=400||/captcha|robot check|verify you are human|press & hold|access denied/i.test(body)||!body.toLowerCase().includes(surface.expected.toLowerCase())){entry.status='UNAVAILABLE_OR_IDENTITY_UNCONFIRMED';}
            else{
              await page.bringToFront();await native.click('#scan');await until(()=>native.evaluate("!document.querySelector('#scan').disabled"),'live public surface scan',20000);
              entry.panelStatus=await native.evaluate("document.querySelector('#status').textContent");const raw=await native.evaluate("document.querySelector('#raw').textContent");
              if(raw){const data=JSON.parse(raw);entry.status='OBSERVED_SCAN';entry.product={url:data.product.url,title:data.product.title,sku:data.product.sku,mpn:data.product.mpn,asin:data.product.asin,price:data.product.price,currency:data.product.currency,extraction:data.product.extraction};entry.verdict=data.verdict;entry.evidence=data.evidence.slice(0,20).map(e=>({id:e.id,severity:e.severity,weight:e.weight}));}
              else entry.status='ABSTAINED_OR_REFUSED';
            }
          }catch(error){entry.status='ENVIRONMENT_OR_SURFACE_UNAVAILABLE';entry.error=String(error);}
          finally{if(page!==fixturePage) await page.close();page=fixturePage;await page.bringToFront();}
          entry.finishedAt=new Date().toISOString();report.liveSurfaces.push(entry);
        }
      }
      await test('N12', 'Granted-access article and sign-in fixtures stay quiet; manual sign-in scan refuses', async () => {
        await page.goto('https://fixture.example.com/journal/mugs'); await pause(4500);
        assert.equal(await page.locator('#dropshredder-auto-verdict').count(), 0);
        await page.goto('https://fixture.example.com/products/sign-in'); await pause(4500);
        assert.equal(await page.locator('#dropshredder-auto-verdict').count(), 0);
        await native.click('#scan'); await until(() => native.evaluate("!document.querySelector('#scan').disabled"), 'sensitive refusal');
        const state = await native.evaluate("({status:document.querySelector('#status').textContent,raw:document.querySelector('#raw').textContent})");
        assert.ok(!state.status.startsWith('Scan complete'), state.status); assert.equal(state.raw, '');
        await native.screenshot('native-sensitive-refusal.png'); return state;
      });
      await test('N13', 'Revoking an accepted host grant disables scripts and alerts without losing preferences', async () => {
        await native.click('#revoke-optional-access');
        await until(() => native.evaluate("!document.querySelector('#revoke-optional-access').disabled"), 'accepted grant revoked');
        assert.equal(await worker.evaluate(() => chrome.permissions.contains({ origins: ['https://*/*'] })), false);
        assert.deepEqual(await worker.evaluate(() => chrome.scripting.getRegisteredContentScripts()), []);
        assert.deepEqual(await features(), { autoSourceHunt: true, autoProtection: false, weeklyIntelligenceUpdates: false, preferMadeInUSA: true, toneMode: 'nuclear' });
        await page.goto('https://fixture.example.com/products/mug'); await pause(4500);
        assert.equal(await page.locator('#dropshredder-auto-verdict').count(), 0);
        await native.screenshot('native-after-revoke.png');
      });
      await test('N14', 'Granted fixture scans cause no uncaught errors or external investigations', async () => {
        assert.deepEqual(errors, []); assert.ok(externalRequests.every(origin=>['https://publisher.example.com','https://rdap.verisign.com','https://www.saferproducts.gov','https://api.gleif.org'].includes(origin)), JSON.stringify(externalRequests));
        report.finalPermissionState = { granted: await worker.evaluate(() => chrome.permissions.contains({ origins: ['https://*/*'] })),
          scripts: await worker.evaluate(() => chrome.scripting.getRegisteredContentScripts()), features: await features() };
      });
    }
  } else report.productScanBlocked = 'Full scan/toast testing requires genuine Chrome host access; no test override was used.';
} catch (error) {
  report.status = 'FAIL OR ENVIRONMENT BLOCKED'; report.failure = String(error);
  report.failureState = await native?.evaluate("({status:document.querySelector('#status')?.textContent,settingsOpen:document.querySelector('.settings-panel')?.open,sourceChecked:document.querySelector('#auto-source-hunt')?.checked,autoStatus:document.querySelector('#auto-protection-status')?.textContent,focused:document.activeElement?.outerHTML?.slice(0,300),chooserOpen:document.querySelector('#ds-search-chooser')?.open,documentFocused:document.hasFocus()})").catch(() => undefined);
  report.savedFeaturesAtFailure = worker ? await features().catch(() => undefined) : undefined;
  await native?.screenshot('native-failure.png').catch(() => {}); console.error(error); process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString(); report.testsPassed = report.tests.filter(t => t.status === 'PASS').length;
  await fs.writeFile(path.join(output, 'native-probe.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2));
  await context?.close().catch(() => {}); await fs.rm(profile, { recursive: true, force: true });
}
