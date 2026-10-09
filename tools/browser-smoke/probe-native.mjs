import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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
const errors = [], externalRequests = [];
const report = { sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  startedAt: new Date().toISOString(), mode: headed ? 'headed Chromium / Xvfb' : 'headless Chromium', status: 'RUNNING', tests: [], errors, externalRequests,
  notTested: ['Independent A01-D06 desktop QA', 'Explicit operator accept/deny of native Chrome permission UI',
    'Live merchant/category accuracy', 'Concurrent panels, malformed storage, SPA/search/context menus, RDAP/CPSC'] };
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
  await call('Runtime.enable');
  const evaluate = async expression => {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value;
  };
  const click = async selector => {
    const point = await evaluate(`(() => { const el=document.querySelector(${JSON.stringify(selector)}); if(!el || el.disabled) throw new Error('Missing/disabled control'); el.scrollIntoView({block:'center'}); const r=el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
    await call('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
    await call('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
    await call('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
  };
  const key = async (key, code, windowsVirtualKeyCode) => {
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
  return { evaluate, click, key, screenshot };
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
  await page.route('https://fixture.example.test/**', route => route.fulfill({ contentType: 'text/html', body:
    '<!doctype html><title>Fixture mug</title><h1>Fixture mug</h1><p>$12.00</p><button>Add to cart</button>' +
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Fixture mug","sku":"FIXTURE-MUG-001","offers":{"@type":"Offer","price":"12.00","priceCurrency":"USD","availability":"https://schema.org/InStock"}}</script>' }));
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
    assert.deepEqual(await features(), { autoSourceHunt: true, autoProtection: false, preferMadeInUSA: true, toneMode: 'nuclear' });
    await native.screenshot('native-settings.png');
  });
  await test('N04', 'Nondefault preferences survive a full native-profile restart', async () => {
    await context.close(); await openNative();
    await until(() => native.evaluate("document.querySelector('#tone-mode').value === 'nuclear'"), 'restored tone');
    assert.deepEqual(await native.evaluate("({source:document.querySelector('#auto-source-hunt').checked,origin:document.querySelector('#prefer-made-in-usa').checked,auto:document.querySelector('#auto-protection').checked})"), { source: true, origin: true, auto: false });
    await native.screenshot('native-after-restart.png');
  });
  await test('N05', 'Native product scan fails closed without host access', async () => {
    await page.goto('https://fixture.example.test/products/mug');
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
    assert.deepEqual(await features(), { autoSourceHunt: true, autoProtection: false, preferMadeInUSA: true, toneMode: 'nuclear' });
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
  const granted = await worker.evaluate(() => chrome.permissions.contains({ origins: ['https://*/*'] }));
  report.permissionExploration = {
    status: settled ? 'REQUEST SETTLED — NATIVE PROMPT ACCEPT/DENY UNVERIFIED' : 'NATIVE PROMPT PENDING — AUTOMATION LIMITATION', settled, granted,
    ui: await native.evaluate("({checked:document.querySelector('#auto-protection').checked,disabled:document.querySelector('#auto-protection').disabled,status:document.querySelector('#auto-protection-status').textContent})"),
    scripts: await worker.evaluate(() => chrome.scripting.getRegisteredContentScripts()),
    targets: (await browserCdp.send('Target.getTargets')).targetInfos.map(t => ({ type: t.type, url: t.url })),
  };
  await native.screenshot('native-permission-request.png');
  if (granted && settled) {
    await test('N08', 'Full native product scan after an observed grant on an owned HTTPS fixture', async () => {
      await native.click('#scan'); await until(() => native.evaluate("!document.querySelector('#scan').disabled"), 'full scan', 20000);
      const state = await native.evaluate("({status:document.querySelector('#status').textContent,raw:document.querySelector('#raw').textContent,exportDisabled:document.querySelector('#export-report').disabled})");
      assert.match(state.status, /^Scan complete for fixture.example.test/);
      const scan = JSON.parse(state.raw); assert.equal(scan.product.title, 'Fixture mug'); assert.equal(state.exportDisabled, false);
      await native.screenshot('native-fixture-scan.png'); return { status: state.status, product: scan.product, scope: 'Owned fixture, no merchant accuracy/explicit prompt acceptance claim' };
    });
  } else report.productScanBlocked = 'Full scan/toast testing requires genuine Chrome host access; no test override was used.';
} catch (error) {
  report.status = 'FAIL OR ENVIRONMENT BLOCKED'; report.failure = String(error);
  await native?.screenshot('native-failure.png').catch(() => {}); console.error(error); process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString(); report.testsPassed = report.tests.filter(t => t.status === 'PASS').length;
  await fs.writeFile(path.join(output, 'native-probe.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2));
  await context?.close().catch(() => {}); await fs.rm(profile, { recursive: true, force: true });
}
