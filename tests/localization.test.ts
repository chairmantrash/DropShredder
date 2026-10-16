import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {auditLocalization,LOCALES} from '../scripts/localization-audit';
import {tr,messageKey,uiLanguage,uiDirection,localizeDocument,errorText} from '../src/i18n/index';
import {renderShopperReport} from '../src/ui/report-renderer';
import {calculateVerdict} from '../src/analysis/evidence-engine';
import type {DropShredderReport} from '../src/types/report';

function withLocale(locale:string,fn:()=>void):void {
  const globals=globalThis as unknown as Record<string,unknown>,prior=globals.chrome;
  const catalog=JSON.parse(fs.readFileSync(`public/_locales/${locale}/messages.json`,'utf8'));
  globals.chrome={i18n:{getMessage:(key:string,values:string[]=[])=>{
    const row=catalog[key];if(!row)return '';
    return row.message.replace(/\$arg([1-9])\$/g,(_:string,n:string)=>values[Number(n)-1]??'');
  }}};
  try{fn();}finally{globals.chrome=prior;}
}
test('all eight catalogs cover static UI and explicit authored calls, preserving native substitutions',()=>{assert.equal(auditLocalization().locales,8);});
for(const locale of LOCALES.filter(code=>code!=='en')) test(`language pack ${locale} localizes text and ARIA without changing control values`,()=>withLocale(locale,()=>{
  const {document}=parseHTML(fs.readFileSync('entrypoints/sidepanel/index.html','utf8'));
  const values=[...document.querySelectorAll('option')].map(n=>n.getAttribute('value'));
  const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);
  localizeDocument(document);
  assert.equal(document.documentElement.lang,locale.replace('_','-'));
  assert.equal(document.documentElement.dir,locale==='ar'?'rtl':'ltr');
  assert.notEqual(document.querySelector('#scan')!.textContent,'CHECK THIS PRODUCT');
  assert.notEqual(document.querySelector('#tone-mode')!.getAttribute('aria-label'),'Language tone');
  assert.deepEqual([...document.querySelectorAll('option')].map(n=>n.getAttribute('value')),values);
  assert.deepEqual([...document.querySelectorAll('[id]')].map(n=>n.id),ids);
  assert.equal(document.querySelector('#publisher-key')!.getAttribute('maxlength'),'2000');
}));
test('Arabic placeholders isolate exact foreign-script values and keep text as text',()=>withLocale('ar',()=>{
  const value='<img src=x onerror=alert(1)> SKU-0123';
  assert.ok(tr('Listed price: $1',value).includes('\u2068'+value+'\u2069'));
  const {document}=parseHTML('<html><body><p></p></body></html>');
  document.querySelector('p')!.textContent=tr('Listed price: $1',value);
  assert.equal(document.querySelector('img'),null);
  assert.equal(uiDirection(),'rtl');
}));
test('unsupported/missing APIs and unknown technical failures remain readable',()=>{
  const globals=globalThis as unknown as Record<string,unknown>,prior=globals.chrome;delete globals.chrome;
  try{assert.equal(tr('Listed price: $1','USD 12.00'),'Listed price: USD 12.00');assert.equal(uiLanguage(),'en');assert.equal(uiDirection(),'ltr');assert.equal(tr('Unknown $1 literal'),'Unknown $1 literal');}finally{globals.chrome=prior;}
  withLocale('es',()=>{assert.notEqual(errorText(new Error('No active web page is available.')),'No active web page is available.');assert.ok(errorText(new Error('HTTP 503')).endsWith('HTTP 503'));});
});
test('localized report preserves source evidence, exact score and raw report bytes',()=>withLocale('fr',()=>{
  const g=globalThis as unknown as Record<string,unknown>,prior=g.document;
  const {document}=parseHTML('<html><body><div id="summary"></div><div id="evidence"></div><pre id="raw"></pre></body></html>');g.document=document;
  try{
    const report={version:1,product:{title:'Original 日本語 title',domain:'shop.example',url:'https://shop.example/product',capturedAt:'2026-10-10T00:00:00Z',imageUrls:[],jsonLdProductCount:0,claims:[],pageSignals:[]},merchant:{domain:'shop.example'},evidence:[{id:'fixture',family:'provenance',severity:'weak',confidence:1,weight:1,independentKey:'fixture',title:'Original detector title',explanation:'Quoted original explanation',observedValue:'GTIN 012345678905'}],contradictions:[],verdict:calculateVerdict([])} satisfies DropShredderReport;
    const before=JSON.stringify(report);
    renderShopperReport(report,{summary:document.getElementById('summary')!,evidenceList:document.getElementById('evidence')!,raw:document.getElementById('raw')!},'professional');
    assert.equal(document.getElementById('raw')!.textContent,JSON.stringify(report,null,2));assert.equal(JSON.stringify(report),before);
    assert.ok(document.getElementById('evidence')!.textContent!.includes('Original detector title'));
    assert.ok(document.getElementById('evidence')!.textContent!.includes('GTIN 012345678905'));
    assert.ok(document.getElementById('summary')!.textContent!.includes('INCONNU'));
    assert.equal(document.querySelector('.report-subject')!.getAttribute('dir'),'auto');
    assert.equal(report.verdict.severeWarningAllowed,false);
  }finally{g.document=prior;}
}));
