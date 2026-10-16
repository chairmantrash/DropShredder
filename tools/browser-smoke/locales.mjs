import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

// Real native Chrome locale resolution in fresh profiles. No chrome.* mocks,
// permission overrides, catalog rewrites, storage injection or remote translator.
// The panel document is rendered in an extension tab, not claimed as a native side panel.
const root=path.resolve(import.meta.dirname,'../..'),extension=path.join(root,'.output/chrome-mv3');
const output=path.join(root,'browser-smoke-results');await fs.mkdir(output,{recursive:true});
const report={sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),startedAt:new Date().toISOString(),os:`${os.platform()} ${os.release()}`,status:'RUNNING',tests:[],errors:[],requests:[],notTested:['Native-speaker translation review','Localized full manual scan/consent flow for every language','Non-English OCR models or detector calibration','Actual Chrome side-panel mounting in each locale; covered separately in English']};
let context;
const key=source=>{let hash=2166136261;for(let i=0;i<source.length;i++)hash=Math.imul(hash^source.charCodeAt(i),16777619);return 'm_'+(hash>>>0).toString(36);};
try{
  for(const locale of ['zh_CN','hi','es','ar','fr','bn','pt_BR']){
    const started=Date.now(),profile=await fs.mkdtemp(path.join(os.tmpdir(),'dropshredder-locale-'));
    try{
      const language=locale.replace('_','-');
      context=await chromium.launchPersistentContext(profile,{channel:'chromium',headless:false,viewport:{width:420,height:900},
        env:{...process.env,LANGUAGE:language,LANG:`${locale}.UTF-8`},
        args:[`--lang=${language}`,`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]});
      context.on('request',r=>{if(/^https?:/.test(r.url()))report.requests.push({locale,origin:new URL(r.url()).origin});});
      context.on('page',p=>p.on('pageerror',e=>report.errors.push({locale,error:String(e)})));
      const worker=context.serviceWorkers()[0]??await context.waitForEvent('serviceworker',{timeout:20000});
      const id=new URL(worker.url()).host;
      const native=await worker.evaluate(()=>({uiLanguage:chrome.i18n.getUILanguage(),resolved:chrome.i18n.getMessage('locale_code'),description:chrome.runtime.getManifest().description,title:chrome.runtime.getManifest().action.default_title}));
      assert.equal(native.resolved,language,`Chrome must actually resolve ${locale}; do not count an English fallback as a localized browser pass`);
      const catalog=JSON.parse(await fs.readFile(path.join(extension,`_locales/${locale}/messages.json`),'utf8'));
      assert.equal(native.description,catalog.extension_description.message);
      assert.equal(native.title,catalog.open_extension.message);
      assert.equal(await worker.evaluate(()=>chrome.permissions.contains({origins:['https://*/*']})),false);
      assert.deepEqual(await worker.evaluate(()=>chrome.scripting.getRegisteredContentScripts()),[]);
      const page=await context.newPage();await page.goto(`chrome-extension://${id}/sidepanel.html`);
      await page.waitForFunction(()=>document.querySelector('#build-meta')?.textContent.includes('0.2.0'));
      assert.equal(await page.locator('#scan').innerText(),catalog[key('CHECK THIS PRODUCT')].message);
      assert.equal(await page.locator('#tone-mode').getAttribute('aria-label'),catalog[key('Language tone')].message);
      assert.equal(await page.locator('html').getAttribute('lang'),language);
      assert.equal(await page.locator('html').getAttribute('dir'),locale==='ar'?'rtl':'ltr');
      assert.equal(await page.locator('#auto-protection').isChecked(),false);
      await page.locator('.label-reader-panel > summary').click();await page.locator('#label-read').click();
      assert.equal(await page.locator('#label-status').innerText(),catalog[key('Choose a product-label image first.')].message);
      const dimensions=[];
      for(const width of [320,420]){
        await page.setViewportSize({width,height:900});
        await page.evaluate(()=>{document.documentElement.dataset.textScale='130';document.querySelectorAll('details').forEach(el=>el.open=true);});
        const size=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
        assert.ok(size.document<=width+1&&size.body<=width+1,`${locale} overflows: ${JSON.stringify(size)}`);dimensions.push(size);
      }
      await page.screenshot({path:path.join(output,`locale-${locale}.png`),fullPage:true,animations:'disabled'});
      const search=await context.newPage();await search.goto(`chrome-extension://${id}/search.html#ds-search-00000000-0000-0000-0000-000000000000`);
      await search.waitForFunction(()=>!document.querySelector('#status').textContent.includes('…'));
      assert.equal(await search.locator('#status').innerText(),catalog[key('This search selection expired. Start another hunt.')].message);
      const session=await context.newCDPSession(page),browser=await session.send('Browser.getVersion');
      report.tests.push({id:`L-${locale}`,status:'PASS',elapsedMs:Date.now()-started,details:{native,extensionId:id,browser:browser.product,dimensions}});
      console.log(`PASS L-${locale}: native offline catalog, metadata, UI/ARIA, local refusal, reflow, search expiry, absent host consent`);
    }catch(error){report.tests.push({id:`L-${locale}`,status:'FAIL',error:String(error)});throw error;}
    finally{await context?.close();context=undefined;await fs.rm(profile,{recursive:true,force:true});}
  }
  assert.equal(report.errors.length,0,'No extension UI exceptions');
  assert.equal(report.requests.length,0,'Localization must not make network requests');
  report.status='PASS';
}catch(error){report.status='FAIL';report.failure=String(error);process.exitCode=1;}
finally{await context?.close();report.finishedAt=new Date().toISOString();await fs.writeFile(path.join(output,'locale-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));}
