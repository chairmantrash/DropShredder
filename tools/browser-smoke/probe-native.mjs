import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// Separate engineering diagnostic, not a continuation of a failed QA run.
// Extensions.triggerAction is Chrome's documented toolbar-action test hook.
// The debugging flag applies only to this disposable automation profile.
const root = path.resolve(import.meta.dirname, '../..');
const ext = path.join(root, '.output/chrome-mv3');
const output = path.join(root, 'browser-smoke-results');
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'dropshredder-native-probe-'));
await fs.mkdir(output, { recursive: true });
let context;
const report = { status: 'RUNNING', purpose: 'Native action/side-panel diagnostic only', testsPassed: 0 };
try {
  context = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', headless: true,
    args: ['--enable-unsafe-extension-debugging', `--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
  });
  const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
  const id = new URL(worker.url()).host;
  const page = context.pages()[0];
  const cdp = await context.newCDPSession(page);
  const browserCdp = await context.browser().newBrowserCDPSession();
  // The native action requires Chrome's tab target, not its child page target.
  const tabs = await browserCdp.send('Target.getTargets', { filter: [{ type: 'tab' }] });
  const target = tabs.targetInfos[0];
  if (!target) throw new Error('No browser tab target exposed for the clean profile.');
  report.browser = await cdp.send('Browser.getVersion');
  report.options = await worker.evaluate(() => chrome.sidePanel.getOptions({}));
  await browserCdp.send('Extensions.triggerAction', { id, targetId: target.targetId });
  for (let n = 0; n < 30; n++) {
    report.targets = (await cdp.send('Target.getTargets')).targetInfos.map(t => ({ targetId: t.targetId, type: t.type, url: t.url }));
    if (report.targets.some(t => t.url === `chrome-extension://${id}/sidepanel.html`)) break;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  report.nativePanelTargetFound = report.targets.some(t => t.url === `chrome-extension://${id}/sidepanel.html`);
  report.exposedPanelPages = context.pages().filter(p => p.url() === `chrome-extension://${id}/sidepanel.html`).length;
  const nativeTarget = report.targets.find(t => t.url === `chrome-extension://${id}/sidepanel.html`);
  if (nativeTarget) {
    // Native panel WebContents are absent from Playwright's tab list. Attach
    // directly using the public Target protocol; send trusted browser input.
    const { sessionId } = await browserCdp.send('Target.attachToTarget', { targetId: nativeTarget.targetId, flatten: false });
    let sequence = 0;
    const pending = new Map();
    browserCdp.on('Target.receivedMessageFromTarget', event => {
      if (event.sessionId !== sessionId) return;
      const response = JSON.parse(event.message);
      const task = pending.get(response.id);
      if (!task) return;
      pending.delete(response.id);
      clearTimeout(task.timer);
      if (response.error) task.reject(new Error(JSON.stringify(response.error)));
      else task.resolve(response.result);
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
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };
    for (let n = 0; n < 30; n++) {
      if (await evaluate("Boolean(document.querySelector('#build-meta')?.textContent.includes('0.2.0'))")) break;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    report.scanButtonPresent = await evaluate("Boolean(document.querySelector('#scan'))");
    const click = async selector => {
      const point = await evaluate(`(() => { const el=document.querySelector(${JSON.stringify(selector)}); if(!el) throw new Error('Missing control'); el.scrollIntoView({block:'center'}); const r=el.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
      await call('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
      await call('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
      await call('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
    };
    await click('.settings-panel > summary');
    await click('#auto-source-hunt');
    for (let n = 0; n < 20; n++) {
      const saved = await worker.evaluate(async () => (await chrome.storage.local.get('dropshredder-feature-settings-v1'))['dropshredder-feature-settings-v1']);
      if (saved?.autoSourceHunt === true) { report.nativeFeatureSaved = true; break; }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    report.nativeFeatureControl = await evaluate("({checked:document.querySelector('#auto-source-hunt').checked,status:document.querySelector('#status').textContent})");
    report.nativeFeatureSaved ??= false;
    const capture = await call('Page.captureScreenshot', { format: 'png' });
    await fs.writeFile(path.join(output, 'native-panel-probe.png'), Buffer.from(capture.data, 'base64'));
  }
  report.status = report.nativePanelTargetFound ? 'NATIVE TARGET OBSERVED — DIAGNOSTIC' : 'NATIVE TARGET NOT EXPOSED';
} catch (error) {
  report.status = 'DIAGNOSTIC LIMITATION';
  report.error = String(error);
} finally {
  await fs.writeFile(path.join(output, 'native-probe.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await context?.close().catch(() => {});
  await fs.rm(profile, { recursive: true, force: true });
}
