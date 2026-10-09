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
  const target = await cdp.send('Target.getTargetInfo');
  report.browser = await cdp.send('Browser.getVersion');
  report.options = await worker.evaluate(() => chrome.sidePanel.getOptions({}));
  await browserCdp.send('Extensions.triggerAction', { id, targetId: target.targetInfo.targetId });
  for (let n = 0; n < 30; n++) {
    report.targets = (await cdp.send('Target.getTargets')).targetInfos.map(t => ({ targetId: t.targetId, type: t.type, url: t.url }));
    if (report.targets.some(t => t.url === `chrome-extension://${id}/sidepanel.html`)) break;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  report.nativePanelTargetFound = report.targets.some(t => t.url === `chrome-extension://${id}/sidepanel.html`);
  report.exposedPanelPages = context.pages().filter(p => p.url() === `chrome-extension://${id}/sidepanel.html`).length;
  const native = context.pages().find(p => p.url() === `chrome-extension://${id}/sidepanel.html`);
  if (native) {
    await native.waitForSelector('#scan');
    report.scanButtonPresent = await native.locator('#scan').isVisible();
    await native.screenshot({ path: path.join(output, 'native-panel-probe.png'), timeout: 30000 });
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
