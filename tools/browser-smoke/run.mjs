import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// This exercises the unchanged production package in a real headed Chromium.
// It never mocks chrome.*, writes extension storage, or grants host permission.
const root = path.resolve(import.meta.dirname, '../..');
const extension = path.join(root, '.output/chrome-mv3');
const output = path.join(root, 'browser-smoke-results');
await fs.mkdir(output, { recursive: true });
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'dropshredder-smoke-'));
const errors = [], extensionRequests = [];
const headless = process.env.DS_BROWSER_HEADLESS === '1';
const report = {
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  startedAt: new Date().toISOString(), mode: `${headless ? 'headless Chromium' : 'headed Chromium / Xvfb'} / automated packaged runtime`,
  status: 'RUNNING', tests: [], errors, extensionRequests,
  notTested: [
    'Full independent A01-D06 desktop QA protocol',
    'Native toolbar opening and native side-panel mounting (panel document is opened in a tab)',
    'Native host permission accept/deny prompts and post-grant scan/toast flows',
    'Live marketplace accuracy, privacy under granted access, RDAP/CPSC live endpoints',
    'Context menus, SPA target changes, search batches and model/category accuracy',
  ],
};
let context, currentPage;
async function test(id, description, fn) {
  const start = Date.now();
  try {
    const details = await fn();
    report.tests.push({ id, description, status: 'PASS', elapsedMs: Date.now() - start, details });
    console.log(`PASS ${id}: ${description}`);
  } catch (error) {
    report.tests.push({ id, description, status: 'FAIL', elapsedMs: Date.now() - start, error: String(error) });
    throw error; // stop at the first failure, no automatic retries
  }
}
async function openContext() {
  const ctx = await chromium.launchPersistentContext(profile, {
    channel: 'chromium', headless, viewport: { width: 420, height: 900 },
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  ctx.setDefaultTimeout(10000);
  ctx.on('page', page => page.on('pageerror', error => errors.push({ context: 'page', error: String(error) })));
  ctx.on('request', request => {
    const fromWorker = request.serviceWorker()?.url().startsWith('chrome-extension://');
    let fromPanel = false;
    try { fromPanel = request.frame().url().startsWith('chrome-extension://'); } catch {}
    if ((fromWorker || fromPanel) && /^https?:/.test(request.url())) {
      const url = new URL(request.url());
      extensionRequests.push({ origin: url.origin, path: url.pathname });
    }
  });
  return ctx;
}
async function panel(ctx, id) {
  const page = await ctx.newPage();
  await page.goto(`chrome-extension://${id}/sidepanel.html`);
  await page.bringToFront();
  await page.waitForFunction(() => document.querySelector('#build-meta')?.textContent.includes('0.2.0'));
  return page;
}
async function savedFeatures(page, expected) {
  await page.waitForFunction(async expected => {
    const saved = (await chrome.storage.local.get('dropshredder-feature-settings-v1'))['dropshredder-feature-settings-v1'];
    return Object.entries(expected).every(([key, value]) => saved?.[key] === value);
  }, expected);
}

try {
  await test('R01', 'Packaged bytes match the reviewed candidate', async () => {
    const candidate = JSON.parse(await fs.readFile(path.join(import.meta.dirname, 'candidate-build-info.json'), 'utf8'));
    for (const file of candidate.buildFiles) {
      const bytes = await fs.readFile(path.join(extension, file.path));
      assert.equal(bytes.length, file.bytes, file.path);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.path);
    }
    report.packagedSourceCommit = candidate.sourceCommit;
    return { files: candidate.buildFiles.length, packagedSourceCommit: candidate.sourceCommit };
  });
  let worker, extensionId;
  await test('R02', 'Unmodified MV3 extension and service worker load in Chromium', async () => {
    context = await openContext();
    worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker', { timeout: 20000 });
    extensionId = new URL(worker.url()).host;
    const cdp = await context.newCDPSession(context.pages()[0]);
    report.browser = await cdp.send('Browser.getVersion');
    report.os = `${os.platform()} ${os.release()}`;
    report.extensionId = extensionId;
    const manifest = await worker.evaluate(() => chrome.runtime.getManifest());
    assert.equal(manifest.version, '0.2.0');
    assert.equal(manifest.manifest_version, 3);
    assert.equal(manifest.name, 'DropShredder');
    return { extensionId, version: manifest.version, browser: report.browser.product };
  });
  await test('R03', 'Panel document renders and optional host access starts absent', async () => {
    currentPage = await panel(context, extensionId);
    assert.equal(await currentPage.locator('#scan').isEnabled(), true);
    assert.equal(await currentPage.locator('#auto-protection').isChecked(), false);
    assert.equal(await currentPage.locator('#export-report').isEnabled(), false);
    assert.equal(await worker.evaluate(() => chrome.permissions.contains({ origins: ['https://*/*'] })), false);
    assert.deepEqual(await worker.evaluate(() => chrome.scripting.getRegisteredContentScripts()), []);
    await currentPage.screenshot({ path: path.join(output, 'panel-initial.png'), fullPage: true, timeout: 30000, animations: 'disabled' });
  });
  await test('R04', 'Unsupported extension-page scan returns without a report', async () => {
    await currentPage.bringToFront();
    await currentPage.locator('#scan').click();
    await currentPage.waitForFunction(() => !document.querySelector('#scan').disabled);
    const status = await currentPage.locator('#status').innerText();
    assert.ok(status.length > 0 && !status.startsWith('Scan complete'), status);
    assert.equal(await currentPage.locator('#raw').textContent(), '');
    return { visibleStatus: status };
  });
  await test('R05', 'Two panel documents preserve independent feature changes', async () => {
    const second = await panel(context, extensionId);
    await currentPage.bringToFront();
    await currentPage.locator('.settings-panel > summary').click();
    await second.bringToFront();
    await second.locator('.settings-panel > summary').click();
    // Chromium has one native pointer/focus per window: simultaneous input in
    // different tabs can misdirect clicks. Use rapid real UI actions in order,
    // without waiting for settings writes between the independent patches.
    await currentPage.bringToFront();
    await currentPage.locator('#auto-source-hunt').check();
    await second.bringToFront();
    await second.locator('#prefer-made-in-usa').check();
    await second.locator('#tone-mode').selectOption('nuclear');
    await savedFeatures(second, { autoSourceHunt: true, preferMadeInUSA: true, toneMode: 'nuclear', autoProtection: false });
    await currentPage.reload();
    await currentPage.waitForFunction(() => document.querySelector('#tone-mode').value === 'nuclear');
    assert.equal(await currentPage.locator('#auto-source-hunt').isChecked(), true);
    assert.equal(await currentPage.locator('#prefer-made-in-usa').isChecked(), true);
    await second.close();
  });
  await test('R06', 'Display controls apply, persist, and reset without erasing features', async () => {
    await currentPage.locator('.appearance-panel > summary').click();
    await currentPage.locator('#display-theme').selectOption('light');
    await currentPage.locator('#display-density').selectOption('compact');
    await currentPage.locator('#display-scale').selectOption('130');
    await currentPage.waitForFunction(() => document.documentElement.dataset.textScale === '130');
    await currentPage.screenshot({ path: path.join(output, 'panel-light-large.png'), fullPage: true, timeout: 30000, animations: 'disabled' });
    await currentPage.reload();
    await currentPage.waitForFunction(() => document.documentElement.dataset.theme === 'light');
    assert.equal(await currentPage.locator('html').getAttribute('data-text-scale'), '130');
    assert.equal(await currentPage.locator('html').getAttribute('data-density'), 'compact');
    await currentPage.locator('.appearance-panel > summary').click();
    await currentPage.locator('#reset-display').click();
    assert.equal(await currentPage.locator('html').getAttribute('data-theme'), 'dark');
    await savedFeatures(currentPage, { autoSourceHunt: true, preferMadeInUSA: true, toneMode: 'nuclear' });
  });
  await test('R07', 'No optional content script or network investigation before consent', async () => {
    const owned = await context.newPage();
    await owned.route('https://fixture.example.test/**', route => route.fulfill({
      contentType: 'text/html', body: '<!doctype html><title>Owned product fixture</title><h1>Fixture mug</h1><p>$12.00</p><button>Add to cart</button>',
    }));
    await owned.goto('https://fixture.example.test/products/mug');
    await owned.waitForTimeout(1500);
    assert.deepEqual(await worker.evaluate(() => chrome.scripting.getRegisteredContentScripts()), []);
    assert.equal(await worker.evaluate(() => chrome.permissions.contains({ origins: ['https://*/*'] })), false);
    assert.equal(await owned.locator('[id*="dropshredder"]').count(), 0);
    assert.deepEqual(extensionRequests, []);
    await owned.close();
    return { scope: 'Owned fulfilled HTTPS fixture; no post-grant detection or live merchant claim' };
  });
  await test('R08', 'Feature preferences survive a full browser/profile restart', async () => {
    await context.close();
    context = await openContext();
    currentPage = await panel(context, extensionId);
    await currentPage.waitForFunction(() => document.querySelector('#tone-mode').value === 'nuclear');
    assert.equal(await currentPage.locator('#auto-source-hunt').isChecked(), true);
    assert.equal(await currentPage.locator('#prefer-made-in-usa').isChecked(), true);
    assert.equal(await currentPage.locator('#auto-protection').isChecked(), false);
    await currentPage.screenshot({ path: path.join(output, 'panel-after-restart.png'), fullPage: true, timeout: 30000, animations: 'disabled' });
  });
  await test('R09', 'No uncaught panel errors or unsolicited extension network requests', async () => {
    assert.deepEqual(errors, []);
    assert.deepEqual(extensionRequests, []);
  });
  report.status = 'PASS — AUTOMATED RUNTIME SUBSET';
} catch (error) {
  report.status = 'FAIL OR ENVIRONMENT BLOCKED';
  report.failure = String(error);
  if (currentPage) {
    await currentPage.bringToFront().catch(() => {});
    await currentPage.screenshot({ path: path.join(output, 'failure.png'), fullPage: true, timeout: 30000 }).catch(() => {});
  }
  console.error(error);
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await context?.close().catch(() => {});
  await fs.rm(profile, { recursive: true, force: true });
}
