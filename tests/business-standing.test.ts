import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {assessBusinessStanding,parseStandingDossier,validateStandingSources,STANDING_SOURCES,type StandingDossier,type StandingRecord,type StandingTarget} from '../src/reputation/business-standing';
import {mountStandingControls} from '../src/ui/business-standing-controls';
const now=new Date('2026-10-10T12:00:00Z');
const target:StandingTarget={legalName:'Synthetic Maker LLC',domain:'maker.example.com',role:'manufacturer',listingUrl:'https://shop.example.com/product/1'};
function record(patch:Partial<StandingRecord>={}):StandingRecord {return {sourceId:'bbb',sourceUrl:'https://www.bbb.org/profile/synthetic',recordId:'synthetic-profile',subjectName:target.legalName,subjectDomain:target.domain,dimension:'consumer',outcome:'rating',grade:'A+',accredited:false,observedAt:'2026-10-09',eventDate:'2026-10-08',scope:'Synthetic entity only',detail:'Fixture only, no real source record.',...patch};}
function dossier(records=[record(),record({sourceId:'gleif',sourceUrl:'https://www.gleif.org/synthetic',recordId:'synthetic-lei',dimension:'identity',outcome:'active-entity',grade:undefined})]):StandingDossier{return {version:1,target:{...target},records};}
const assess=(d=dossier(),reviewed=true,t=target)=>assessBusinessStanding(t,d,reviewed,now);
test('standing sources have exact categories, publisher families, freshness and link-only restrictions',()=>{
 assert.equal(validateStandingSources(),true);assert.equal(STANDING_SOURCES.length,32);assert.ok(STANDING_SOURCES.filter(s=>s.id.startsWith('profeco')).every(s=>s.linkOnly&&!s.outcomes.length));
});
test('a JSON verified/rating flag cannot bypass human review',()=>{
 const parsed=parseStandingDossier(JSON.stringify({...dossier(),verified:true,reviewed:true,rating:'FAVORABLE'}));assert.equal('verified' in parsed,false);assert.equal(assess(parsed,false).rating,'NOT_REVIEWED');assert.equal(assess(parsed).rating,'FAVORABLE');
});
test('no record, no accreditation and NR never become adverse findings',()=>{
 assert.equal(assess(dossier([])).rating,'INSUFFICIENT');assert.equal(assess().rating,'FAVORABLE');assert.equal(assess(dossier([record({grade:'NR'})])).rating,'INSUFFICIENT');assert.equal(assess(dossier([record({outcome:'no-record',grade:undefined})])).rating,'INSUFFICIENT');
});
test('a favorable grade needs separately published current legal identity',()=>{
 assert.equal(assess(dossier([record(),record({recordId:'copy-profile'})])).rating,'INSUFFICIENT');assert.equal(assess(dossier([record()])).publisherFamilies,1);
 assert.equal(assess(dossier([record(),record({sourceId:'gleif',sourceUrl:'https://www.gleif.org/synthetic',dimension:'identity',outcome:'inactive-entity'})])).rating,'INSUFFICIENT');
});
test('dissimilar subject, domain, role and exact listing cannot inherit standing',()=>{
 for(const t of [{...target,legalName:'Synthetic-Maker LLC'},{...target,domain:'other.example.com'},{...target,role:'merchant' as const},{...target,listingUrl:target.listingUrl+'/other'}])assert.equal(assess(dossier(),true,t).rating,'INSUFFICIENT');
 assert.equal(assess(dossier([record({subjectName:'Another LLC'})])).currentRecords,0);assert.equal(assess(dossier([record({subjectDomain:'other.example.com'})])).currentRecords,0);
});
test('future observations/events, stale sources and duplicate records cannot inflate coverage',()=>{
 for(const patch of [{observedAt:'2026-10-11'},{eventDate:'2026-10-10'},{observedAt:'2026-08-01',eventDate:'2026-07-01'}])assert.equal(assess(dossier([record(patch)])).currentRecords,0);
 const r=record();const a=assess(dossier([r,{...r}]));assert.equal(a.currentRecords,1);assert.equal(a.excludedRecords,1);assert.equal(a.publisherFamilies,1);
});
test('warnings and allegations stay unresolved rather than final adverse labels',()=>{
 for(const outcome of ['warning','allegation']){const a=assess(dossier([record({sourceId:'ftc',sourceUrl:'https://www.ftc.gov/synthetic',dimension:'enforcement',outcome})]));assert.equal(a.rating,'MIXED');}
});
test('a reviewed final order is adverse and a positive source cannot erase it',()=>{
 const r=record({sourceId:'ftc',sourceUrl:'https://www.ftc.gov/synthetic',dimension:'enforcement',outcome:'final-order'});assert.equal(assess(dossier([r])).rating,'ADVERSE_RECORD');assert.equal(assess(dossier([...dossier().records,r])).rating,'MIXED');
 assert.equal(assess(dossier([record({grade:'F'})])).rating,'ADVERSE_RECORD');
});
test('later resolved/modified snapshots supersede the same older case without erasing different cases',()=>{
 const r=record({sourceId:'ftc',sourceUrl:'https://www.ftc.gov/synthetic',dimension:'enforcement',outcome:'final-order',observedAt:'2026-10-08',eventDate:'2026-10-07'});
 const resolved={...r,outcome:'resolved',observedAt:'2026-10-09',eventDate:'2026-10-08'};
 assert.equal(assess(dossier([r,resolved])).rating,'INSUFFICIENT');assert.equal(assess(dossier([r,resolved])).currentRecords,1);
 assert.equal(assess(dossier([r,resolved,{...r,recordId:'different-case'}])).rating,'ADVERSE_RECORD');
});
test('equal-date contradictory grades or outcomes are unresolved',()=>{
 assert.equal(assess(dossier([record(),record({grade:'F'})])).rating,'MIXED');
});
test('trade, sustainability and product records cannot establish consumer trust or regional origin',()=>{
 for(const r of [record({sourceId:'usmca',sourceUrl:'https://www.cbp.gov/synthetic',dimension:'trade',outcome:'scoped-trade-record'}),record({sourceId:'amfori',sourceUrl:'https://www.amfori.org/synthetic',dimension:'sustainability',outcome:'scoped-assessment'}),record({sourceId:'cpsc',sourceUrl:'https://www.cpsc.gov/synthetic',dimension:'product',outcome:'scoped-recall'})])assert.equal(assess(dossier([r])).rating,'INSUFFICIENT');
});
test('imports refuse spoofed publisher hosts, source-scope laundering, restricted PROFECO data and secret-bearing URLs',()=>{
 for(const patch of [{sourceUrl:'https://www.bbb.org.attacker.example/profile'},{sourceUrl:'https://www.bbb.org/profile?key=secret'},{sourceId:'profeco-buro',sourceUrl:'https://burocomercial.profeco.gob.mx/'},{dimension:'enforcement' as const,outcome:'final-order'},{observedAt:'2026-02-31'},{sourceUrl:'https://127.0.0.1/'},{detail:'x'.repeat(1001)}])assert.throws(()=>parseStandingDossier(JSON.stringify(dossier([record(patch)]))));
 assert.throws(()=>parseStandingDossier(' '.repeat(40_001)));assert.throws(()=>parseStandingDossier(JSON.stringify(dossier(Array.from({length:33},()=>record())))));
});
function ui(){const {document,window}=parseHTML(fs.readFileSync('entrypoints/sidepanel/index.html','utf8'));const listing=target.listingUrl;const controls=mountStandingControls(()=>listing,async()=>true,document);return {document,window,controls};}
async function load(u:ReturnType<typeof ui>){const file=u.document.querySelector('#standing-file')!;Object.defineProperty(file,'files',{configurable:true,value:[{size:1000,text:async()=>JSON.stringify(dossier())}]});file.dispatchEvent(new u.window.Event('change'));await new Promise(r=>setTimeout(r,0));}
test('standing file preview requires explicit review and matching user-entered entity',async()=>{
 const u=ui();const name=u.document.querySelector<HTMLInputElement>('#standing-name')!,domain=u.document.querySelector<HTMLInputElement>('#standing-domain')!,role=u.document.querySelector<HTMLSelectElement>('#standing-role')!;name.value=target.legalName;domain.value=target.domain;Object.defineProperty(role,'value',{value:'manufacturer',configurable:true});await load(u);
 const apply=u.document.querySelector<HTMLButtonElement>('#standing-apply')!,review=u.document.querySelector<HTMLInputElement>('#standing-reviewed')!;assert.equal(apply.disabled,true);assert.equal(u.document.querySelectorAll('#standing-preview article').length,2);
 review.checked=true;review.dispatchEvent(new u.window.Event('change'));apply.click();await new Promise(r=>setTimeout(r,0));assert.match(u.document.querySelector('#standing-result')!.textContent!,/Favorable evidence/);assert.match(u.document.querySelector('#standing-status')!.textContent!,/scores are unchanged/);
 name.value='Wrong entity';name.dispatchEvent(new u.window.Event('input'));assert.equal(review.checked,false);assert.equal(apply.disabled,true);assert.equal(u.document.querySelector('#standing-result')!.textContent,'');
});
test('standing reset discards pending file/review/result and stale async file completions',async()=>{
 const u=ui();await load(u);u.controls.reset();assert.equal(u.document.querySelector('#standing-preview')!.textContent,'');assert.equal(u.document.querySelector<HTMLButtonElement>('#standing-apply')!.disabled,true);
 let finish!:(value:string)=>void;const file=u.document.querySelector('#standing-file')!;Object.defineProperty(file,'files',{configurable:true,value:[{size:1000,text:()=>new Promise<string>(r=>finish=r)}]});file.dispatchEvent(new u.window.Event('change'));u.controls.reset();finish(JSON.stringify(dossier()));await new Promise(r=>setTimeout(r,0));assert.equal(u.document.querySelector('#standing-preview')!.textContent,'');
});
test('source category filtering is local and displays reuse limits',()=>{
 const u=ui(),panel=u.document.querySelector<HTMLDetailsElement>('#standing-directory-panel')!;panel.open=true;panel.dispatchEvent(new u.window.Event('toggle'));assert.equal(u.document.querySelectorAll('#standing-directory article').length,32);
 const filter=u.document.querySelector<HTMLSelectElement>('#standing-filter')!;Object.defineProperty(filter,'value',{value:'consumer',configurable:true});filter.dispatchEvent(new u.window.Event('change'));assert.equal(u.document.querySelectorAll('#standing-directory article').length,4);assert.match(u.document.querySelector('#standing-directory')!.textContent!,/Link only/);
});
function litigation(outcome='pending',patch:Partial<StandingRecord>={}):StandingRecord {return record({sourceId:'us-courts',sourceUrl:'https://www.nysd.uscourts.gov/synthetic-case',recordId:'1:26-cv-00000',dimension:'litigation',outcome,grade:undefined,case:{court:'Synthetic District Court',jurisdiction:'US-NY federal',partyRole:'defendant',category:'consumer-sale'},...patch});}
test('pending and appealed litigation informs review but is not an adverse finding',()=>{
 for(const outcome of ['pending','appealed'])assert.equal(assess(dossier([litigation(outcome)])).rating,'MIXED');
 assert.equal(assess(dossier([litigation('final-adverse-judgment')])).rating,'ADVERSE_RECORD');
});
test('dismissed, settled, vacated and closed cases do not imply guilt or favorable standing',()=>{
 for(const outcome of ['dismissed','settled','vacated','closed-no-adverse-finding'])assert.equal(assess(dossier([litigation(outcome)])).rating,'INSUFFICIENT');
});
test('plaintiff roles and unrelated litigation cannot create adverse or pending standing',()=>{
 for(const outcome of ['pending','final-adverse-judgment'])for(const c of [{...litigation().case!,partyRole:'plaintiff' as const},{...litigation().case!,category:'other' as const}])assert.equal(assess(dossier([litigation(outcome,{case:c})])).rating,'INSUFFICIENT');
});
test('litigation requires court, jurisdiction, party role and relevant category, and refuses discovery-feed imports',()=>{
 for(const patch of [{case:undefined},{case:{...litigation().case!,court:''}},{case:{...litigation().case!,jurisdiction:''}},{sourceId:'courtlistener',sourceUrl:'https://www.courtlistener.com/docket/synthetic'},{sourceId:'canlii',sourceUrl:'https://www.canlii.org/synthetic'}])assert.throws(()=>parseStandingDossier(JSON.stringify(dossier([litigation('pending',patch)]))));
});
test('litigation observations expire after seven days and later appeal/vacatur supersedes judgment',()=>{
 assert.equal(assess(dossier([litigation('pending',{observedAt:'2026-10-02',eventDate:'2026-10-01'})])).currentRecords,0);
 const original=litigation('final-adverse-judgment',{observedAt:'2026-10-08',eventDate:'2026-10-07'});
 for(const outcome of ['appealed','vacated','dismissed'])assert.equal(assess(dossier([original,litigation(outcome)])).rating,outcome==='appealed'?'MIXED':'INSUFFICIENT');
});
test('shipper entity role remains exactly bound and litigation metadata is explicitly copied',()=>{
 const d={...dossier([litigation()]),target:{...target,role:'shipper' as const}};const parsed=parseStandingDossier(JSON.stringify(d));assert.equal(parsed.target.role,'shipper');assert.deepEqual(parsed.records[0]!.case,d.records[0]!.case);assert.equal(assessBusinessStanding(parsed.target,parsed,true,now).rating,'MIXED');assert.equal(assess(parsed).rating,'INSUFFICIENT');
});
test('original-court and GovInfo copies of the same docket cannot preserve a superseded adverse judgment',()=>{
 const old=litigation('final-adverse-judgment',{sourceId:'govinfo-opinions',sourceUrl:'https://www.govinfo.gov/synthetic',observedAt:'2026-10-08',eventDate:'2026-10-07'});
 assert.equal(assess(dossier([old,litigation('appealed')])).rating,'MIXED');
 assert.equal(assess(dossier([old,litigation('vacated')])).rating,'INSUFFICIENT');
 assert.equal(assess(dossier([old,litigation('vacated',{case:{...litigation().case!,court:'Different Court'}})])).rating,'ADVERSE_RECORD');
});
