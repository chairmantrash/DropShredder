import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {ORIGIN_STAGES,assessNorthAmerica,parseOriginDossier,originDossierMatches,listingOriginClaims,validOriginAssessment,type OriginDossier} from '../src/analysis/north-america-origin';
import {validateRegionalDirectory,NORTH_AMERICA_DIRECTORY,NORTH_AMERICA_RELATIONSHIPS,regionalRecordFresh} from '../src/intelligence/north-america-directory';
import {mountNorthAmericaControls} from '../src/ui/north-america-controls';
import {renderShopperReport} from '../src/ui/report-renderer';
import {exportCurrentReport,readPanelReport} from '../src/reporting/export-report';
import {calculateVerdict} from '../src/analysis/evidence-engine';
import type {ProductSnapshot} from '../src/types/product';
import type {DropShredderReport} from '../src/types/report';
const now=new Date('2026-10-10T12:00:00Z');
const product:ProductSnapshot={url:'https://shop.example.com/product/123',domain:'shop.example.com',title:'Exact kettle',seller:'Seller LLC',brand:'Acme',mpn:'K-123',variantId:'red',specifications:{color:'red'},imageUrls:[],jsonLdProductCount:1,capturedAt:now.toISOString(),claims:[],pageSignals:[]};
const kind={materials:'bill-of-materials',components:'bill-of-materials',processing:'manufacturing-record',assembly:'manufacturing-record',packaging:'bill-of-materials',seller:'entity-record',dispatch:'carrier-pickup',destination:'delivery-record'} as const;
function dossier():OriginDossier {return {schemaVersion:1,listingUrl:product.url,seller:'Seller LLC',identity:{brand:'Acme',mpn:'K-123',variantId:'red',specifications:{color:'red'}},documents:ORIGIN_STAGES.map(stage=>({stage,kind:kind[stage],countries:stage==='assembly'?['MX']:stage==='materials'?['CA']:['US'],coverage:'complete',sourceUrl:'https://records.example.com/'+stage,observedAt:'2026-10-09T00:00:00Z',expiresAt:'2026-12-09T00:00:00Z',detail:'Synthetic scope-complete test record; not real evidence.'}))};}
const assess=(d:OriginDossier=dossier(),reviewed=true)=>assessNorthAmerica(product,[],d,reviewed,now);
const report=():DropShredderReport=>({version:1,product,merchant:{domain:product.domain},evidence:[],contradictions:[],verdict:calculateVerdict([]),northAmerica:assessNorthAmerica(product,[],undefined,false,now)});

test('empty evidence, country domain and a domestic barcode cannot establish regional origin',()=>{
 assert.equal(assessNorthAmerica({...product,url:'https://shop.ca/product',gtin:'012345678905'},[],undefined,false,now).status,'UNKNOWN');
});
test('EN/ES/FR origin claims retain qualifiers and exact original wording without verification',()=>{
 const claims=listingOriginClaims(product,'Hecho en México con componentes importados. Fabriqué au Canada avec pièces importées. Made in USA. Ships from Canada.',[]);
 assert.ok(claims.some(c=>c.quote==='Hecho en México con componentes importados'));assert.ok(claims.some(c=>c.quote.startsWith('Fabriqué au')));
 assert.equal(assessNorthAmerica(product,claims,undefined,false,now).status,'CLAIMED');
 assert.equal(claims[0]?.scope,'listing');
});
test('generic store claims are separately attributed and cannot grant product origin',()=>{
 const claims=listingOriginClaims(product,'',[{kind:'about',url:'https://shop.example.com/about',text:'Made in Canada.'}]);
 assert.equal(claims[0]?.scope,'store');assert.equal(assessNorthAmerica(product,claims,undefined,false,now).stages[0]?.status,'UNKNOWN');
});
test('complete cross-border regional documentation requires deliberate user review',()=>{
 assert.equal(assess(dossier(),false).status,'PARTIAL');assert.equal(assess().status,'DOCUMENTED');assert.equal(assess().scope,'US-CA-MX');
 assert.ok(validOriginAssessment(assess()));
 const parsed=parseOriginDossier(JSON.stringify({...dossier(),reviewedByUser:true,verified:true}));
 assert.equal('verified' in parsed,false);assert.equal(assess(parsed,false).status,'PARTIAL');
});
for(const stage of ORIGIN_STAGES)test(`omitting ${stage} defeats the all-regional announcement`,()=>{
 const d=dossier();d.documents=d.documents.filter(doc=>doc.stage!==stage);assert.equal(assess(d).status,'PARTIAL');
});
test('country-of-origin labels, trade certificates and marketing cannot fill upstream proof',()=>{
 for(const k of ['claim','label','trade-certificate'] as const){const d=dossier();d.documents=d.documents.map(doc=>({...doc,kind:k}));assert.equal(assess(d).status,'PARTIAL');}
});
test('invalid dates, future evidence, stale records and excessive validity never qualify',()=>{
 for(const change of [{observedAt:'2026-10-11T00:00:00Z'},{observedAt:'2026-01-01T00:00:00Z'},{expiresAt:'2026-10-10T11:00:00Z'},{expiresAt:'2027-12-01T00:00:00Z'}]){
 const d=dossier();Object.assign(d.documents[0]!,change);assert.equal(assess(d).status,'PARTIAL');
 }
});
test('foreign material even in a partial document prevents an all-regional finding',()=>{
 const d=dossier();d.documents[0]!.countries=['CN'];d.documents[0]!.coverage='partial';const a=assess(d);assert.equal(a.status,'OUTSIDE_REGION');assert.ok(a.stages[0]!.countries.includes('CN'));
});
test('mixed country sourcing is distinct from contradictory complete records',()=>{
 const d=dossier();d.documents[0]!.countries=['US','CN'];assert.equal(assess(d).status,'OUTSIDE_REGION');
 d.documents.push({...d.documents[0]!,countries:['CA'],sourceUrl:'https://audit.example.com/materials'});assert.equal(assess(d).status,'CONFLICTING');
});
test('exact listing, seller, variant and all known specifications must match',()=>{
 for(const patch of ([{url:'https://shop.example.com/product/456'},{seller:'Other seller'},{seller:undefined},{variantId:'blue'},{specifications:{color:'blue'}},{specifications:{}},{mpn:'K-124'},{brand:'Other'}] as Partial<ProductSnapshot>[]))assert.equal(originDossierMatches({...product,...patch},dossier()),false);
 assert.equal(originDossierMatches(product,dossier()),true);
});
test('valid GTINs identify products but contradictory brand/model/variant evidence defeats matching',()=>{
 const d=dossier();d.identity.gtin='012345678905';const p={...product,gtin:'012345678905'};
 assert.equal(originDossierMatches(p,d),true);assert.equal(originDossierMatches({...p,gtin:'4006381333931'},d),false);
});
test('malformed, oversized and secret-bearing dossier input is refused',()=>{
 for(const mutate of [(d:OriginDossier)=>{d.documents[0]!.sourceUrl+='?token=secret';},(d:OriginDossier)=>{d.identity.gtin='123';},(d:OriginDossier)=>{d.documents[0]!.countries=['Canada'];},(d:OriginDossier)=>{d.documents[0]!.sourceUrl='http://localhost';}]){const d=dossier();mutate(d);assert.throws(()=>parseOriginDossier(JSON.stringify(d)));}
 assert.throws(()=>parseOriginDossier(' '.repeat(50_001)));assert.throws(()=>parseOriginDossier('null'));
 const invalidDay=dossier();invalidDay.documents[0]!.observedAt='2026-02-31T00:00:00Z';assert.throws(()=>parseOriginDossier(JSON.stringify(invalidDay)));
});
test('punctuation-distinct model and seller names cannot inherit an origin dossier',()=>{
 assert.equal(originDossierMatches({...product,mpn:'K123'},dossier()),false);
 assert.equal(originDossierMatches({...product,seller:'Seller-LLC'},dossier()),false);
 const a=assess();assert.equal(validOriginAssessment({...a,reviewedByUser:false}),false);assert.equal(validOriginAssessment({...a,stages:a.stages.map(s=>({...s,status:'UNKNOWN'}))}),false);
});
test('region references have bounded freshness, supported edges and zero risk weights',()=>{
 assert.equal(validateRegionalDirectory(),true);assert.ok(NORTH_AMERICA_DIRECTORY.length>=30);
 assert.ok(NORTH_AMERICA_DIRECTORY.some(r=>r.id==='profeco'&&/restrictions/.test(r.limit)));
 assert.ok(NORTH_AMERICA_RELATIONSHIPS.every(e=>e.riskWeight===0));
 assert.equal(regionalRecordFresh(NORTH_AMERICA_DIRECTORY[0]!,new Date('2026-10-09')),false);assert.equal(regionalRecordFresh(NORTH_AMERICA_DIRECTORY[0]!,new Date('2027-10-10')),false);
});
test('assessment export cannot change seller verdict and rejects malformed raw origin profiles',()=>{
 const r=report(),before=JSON.stringify(r.verdict);r.northAmerica=assess();const output=exportCurrentReport(r);
 assert.equal(output.northAmerica?.status,'DOCUMENTED');assert.equal(output.northAmerica?.reviewedByUser,true);assert.equal(JSON.stringify(r.verdict),before);
 assert.equal(readPanelReport(JSON.stringify({...r,northAmerica:{status:'DOCUMENTED'}})),undefined);
});
test('documented report displays scope/review limitation and source URLs as text-safe links',()=>{
 const {document}=parseHTML('<html><body><div id="summary"></div><div id="evidence"></div><pre id="raw"></pre></body></html>');
 const g=globalThis as unknown as {document:Document};const previous=g.document;g.document=document;
 try{const r=report();r.northAmerica=assess();renderShopperReport(r,{summary:document.querySelector('#summary')!,evidenceList:document.querySelector('#evidence')!,raw:document.querySelector('#raw')!},'professional');
 assert.match(document.querySelector('#summary')!.textContent!,/North American chain documented/);assert.match(document.querySelector('#summary')!.textContent!,/not independent certification/);assert.equal(document.querySelectorAll('a').length,8);assert.equal(r.verdict.severeWarningAllowed,false);
 }finally{g.document=previous;}
});
test('origin controls preview files without network, require review, and clear on reset',async()=>{
 const {document,window}=parseHTML(fs.readFileSync('entrypoints/sidepanel/index.html','utf8'));let r=report();let calls=0;
 const controls=mountNorthAmericaControls(()=>r,a=>{calls++;r={...r,northAmerica:a};},async()=>true,document);
 const file=document.querySelector<HTMLInputElement>('#origin-file')!;
 Object.defineProperty(file,'files',{value:[{size:1000,text:async()=>JSON.stringify(dossier())}],configurable:true});file.dispatchEvent(new window.Event('change'));
 await new Promise(resolve=>setTimeout(resolve,0));assert.equal(document.querySelectorAll('#origin-preview a').length,8);
 const button=document.querySelector<HTMLButtonElement>('#origin-apply')!;assert.equal(button.disabled,true);const reviewed=document.querySelector<HTMLInputElement>('#origin-reviewed')!;reviewed.checked=true;reviewed.dispatchEvent(new window.Event('change'));assert.equal(button.disabled,false);
 button.click();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(calls,1);
 controls.reset();assert.equal(button.disabled,true);assert.equal(document.querySelector('#origin-preview')!.children.length,0);
});
test('navigation during asynchronous origin apply prevents stale results',async()=>{
 const {document,window}=parseHTML(fs.readFileSync('entrypoints/sidepanel/index.html','utf8'));let resolve!:(allowed:boolean)=>void,calls=0;
 const controls=mountNorthAmericaControls(report,()=>{calls++;},()=>new Promise(r=>{resolve=r;}),document);
 const file=document.querySelector<HTMLInputElement>('#origin-file')!;Object.defineProperty(file,'files',{value:[{size:1000,text:async()=>JSON.stringify(dossier())}]});file.dispatchEvent(new window.Event('change'));await new Promise(r=>setTimeout(r,0));
 const review=document.querySelector<HTMLInputElement>('#origin-reviewed')!;review.checked=true;review.dispatchEvent(new window.Event('change'));document.querySelector<HTMLButtonElement>('#origin-apply')!.click();controls.reset();resolve(true);await new Promise(r=>setTimeout(r,0));assert.equal(calls,0);
});
