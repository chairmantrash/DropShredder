import assert from 'node:assert/strict';
import test from 'node:test';
import { validateUserList, previewList, normalizeListStore, applyListMutation, fetchListPreview, feedUrl, LIST_KEY, type UserList } from '../src/intelligence/user-lists';
import { importedProductLeads } from '../src/analysis/product-leads';
import { validLei, parseGleif, lookupLegalEntity } from '../src/osint/gleif';
import { fetchBoundedJson } from '../src/osint/bounded-json';
import { calculateVerdict } from '../src/analysis/evidence-engine';
import { lookupRecallCandidates } from '../src/osint/cpsc';
import { compareProductIdentity } from '../src/analysis/product-identity';

const now=Date.now();
const list=(patch:Partial<UserList>={}):UserList=>({schemaVersion:1,id:'owned-fixture',title:'Owned product reference',sourceUrl:'https://publisher.example.com/products.json',license:'CC0-1.0',publishedAt:new Date(now-1000).toISOString(),expiresAt:new Date(now+86400000).toISOString(),version:1,
  records:[{id:'mug',url:'https://manufacturer.example.com/products/mug',title:'Fixture mug',gtin:'012345678905',attributes:{color:'red'},entities:[{role:'manufacturer',name:'Fixture Maker',identifier:'fixture-company-1',sourceUrl:'https://manufacturer.example.com/about',observedAt:new Date(now-1000).toISOString()}]}],...patch});
const b64=(input:Uint8Array)=>Buffer.from(input).toString('base64url');

test('inert import rejects rule injection, duplicate records, oversized arrays and invalid identity',()=>{
  const original=list();assert.equal(validateUserList(original).records.length,1);
  for(const bad of [{...original,score:100},{...original,records:[{...original.records[0],execute:'alert(1)'}]}, {...original,records:[original.records[0],original.records[0]]},{...original,records:Array(501).fill(original.records[0])},{...original,records:[{...original.records[0],gtin:'012345678904'}]}]) assert.throws(()=>validateUserList(bad));
});
test('feed and record URLs reject credentials, fragments, queries and private origins',()=>{
  for(const url of ['http://example.com/x','https://token@example.com/x','https://127.0.0.1/x','https://localhost/x','https://publisher.example.com/x?api_key=secret','https://publisher.example.com/x#token','https://publisher.example.com:8443/x']) assert.throws(()=>feedUrl(url));
  assert.equal(feedUrl('https://publisher.example.com/products.json'),'https://publisher.example.com/products.json');
});
test('date windows expose stale lists and forbid future publication or indefinite expiry',async()=>{
  const expired=list({publishedAt:new Date(now-86400000).toISOString(),expiresAt:new Date(now-1000).toISOString()});
  assert.equal((await previewList(JSON.stringify(expired))).stale,true);
  assert.throws(()=>validateUserList(list({publishedAt:new Date(now+86400000).toISOString()})));
  assert.throws(()=>validateUserList(list({expiresAt:new Date(now+100*86400000).toISOString()})));
  await assert.rejects(previewList(' '.repeat(800001)),/800 KB/);
});
test('Ed25519 verifies exact pretty-printed payload bytes against a source-pinned key; tampering and unknown keys fail',async()=>{
  const pair=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']) as CryptoKeyPair;
  const publicKey=b64(new Uint8Array(await crypto.subtle.exportKey('raw',pair.publicKey))),payload=JSON.stringify(list(),null,2)+'\n';
  const value=b64(new Uint8Array(await crypto.subtle.sign('Ed25519',pair.privateKey,new TextEncoder().encode(payload))));
  const input=JSON.stringify({payload,signature:{keyId:'fixture-key',value}}),key={issuer:'Owned fixture publisher',keyId:'fixture-key',sourceUrl:list().sourceUrl,publicKey};
  assert.equal((await previewList(input,[key])).authentication,'user-pinned-key');
  await assert.rejects(previewList(input,[]),/Unknown publisher/);
  await assert.rejects(previewList(JSON.stringify({payload:payload.replace('Fixture mug','Different mug'),signature:{keyId:'fixture-key',value}}),[key]),/did not verify/);
  await assert.rejects(previewList(input,[{...key,sourceUrl:'https://other.example.com/data.json'}]),/Unknown publisher/);
  await assert.rejects(previewList(input,[key],'https://other.example.com/data.json'),/does not match/);
});
test('local storage corruption cannot grant trust or enable arbitrary imported rules',()=>{
  assert.deepEqual(normalizeListStore({schemaVersion:1,lists:'bad',keys:[]}),{schemaVersion:1,lists:[],keys:[]});
  const valid={current:{list:list(),authentication:'user-pinned-key'},checkedAt:new Date(now).toISOString(),highestVersion:1};
  const normalized=normalizeListStore({schemaVersion:1,lists:[valid,{...valid,current:{list:{...list(),malware:'code'}}}],keys:[]});
  assert.equal(normalized.lists.length,1);assert.equal(normalized.lists[0]?.current.authentication,'unsigned');
});
test('one writer serializes list imports, preserves rollback floor and resets all user list state',async()=>{
  const g=globalThis as unknown as {chrome:unknown},old=g.chrome;let stored:Record<string,unknown>={};
  g.chrome={storage:{local:{get:async()=>stored,set:async(v:Record<string,unknown>)=>{stored={...stored,...v};}}}};
  try{
    await Promise.all([applyListMutation({type:'save',input:JSON.stringify(list())}),applyListMutation({type:'save',input:JSON.stringify(list({id:'second',version:1}))})]);
    assert.equal(normalizeListStore(stored[LIST_KEY]).lists.length,2);
    await applyListMutation({type:'save',input:JSON.stringify(list({version:2})),subscriptionUrl:list().sourceUrl});
    await applyListMutation({type:'rollback',id:'owned-fixture'});
    assert.equal(normalizeListStore(stored[LIST_KEY]).lists.find(x=>x.current.list.id==='owned-fixture')?.current.list.version,1);
    await assert.rejects(applyListMutation({type:'save',input:JSON.stringify(list({version:2}))}),/version did not increase/);
    await assert.rejects(applyListMutation({type:'save',input:JSON.stringify(list({version:3,sourceUrl:'https://other.example.com/data.json'}))}),/Source changed/);
    await applyListMutation({type:'clear'});assert.equal(normalizeListStore(stored[LIST_KEY]).lists.length,0);
  }finally{g.chrome=old;}
});
test('exact imported leads keep entity roles and source dates separate, never raise a verdict',async()=>{
  const current={url:'https://shop.example.com/p',domain:'shop.example.com',gtin:'012345678905',imageUrls:[],jsonLdProductCount:1,capturedAt:new Date(now).toISOString(),claims:[],pageSignals:[],specifications:{colour:'red'}};
  const preview=await previewList(JSON.stringify(list())),rows=[{current:preview,checkedAt:new Date(now).toISOString(),highestVersion:1}];
  const leads=importedProductLeads(current,rows);assert.equal(leads.length,1);assert.match(leads[0]!.observedValue!,/manufacturer: Fixture Maker/);
  assert.equal(leads[0]!.provenance?.sourceUrl,list().records[0]!.url);assert.equal(calculateVerdict(leads).severeWarningAllowed,false);assert.equal(calculateVerdict(leads).dropshipLikelihood,null);
  assert.equal(importedProductLeads({...current,specifications:{colour:'blue'}},rows).length,0);
  assert.equal(importedProductLeads({...current,gtin:'4006381333931'},rows).length,0);
  assert.equal(importedProductLeads(current,rows,now+2*86400000).length,0);
});
test('variant colour aliases and material conflicts cannot silently merge products',()=>{
  assert.equal(compareProductIdentity({gtin:'012345678905',specifications:{colour:'red'}},{gtin:'012345678905',specifications:{color:'blue'}}).compatible,false);
  assert.equal(compareProductIdentity({specifications:{material:'cotton'}},{specifications:{material:'polyester'}}).compatible,false);
});
test('denied feed consent starts synchronously and performs no request',async()=>{
  const g=globalThis as unknown as {chrome:unknown},old=g.chrome,oldFetch=globalThis.fetch;let called=false,requests=0;
  g.chrome={permissions:{request:()=>{called=true;return Promise.resolve(false);}}};globalThis.fetch=async()=>{requests++;throw Error('unexpected');};
  try{const task=fetchListPreview(list().sourceUrl,[],new AbortController().signal);assert.equal(called,true);assert.equal(await task,undefined);assert.equal(requests,0);}finally{g.chrome=old;globalThis.fetch=oldFetch;}
});
test('bounded public JSON refuses chunked overflow, redirects, credentials and non-JSON',async()=>{
  const request:typeof fetch=async(_url,init)=>{assert.equal(init?.credentials,'omit');assert.equal(init?.redirect,'error');assert.equal(init?.referrerPolicy,'no-referrer');return new Response('{}',{headers:{'content-type':'application/vnd.api+json'}});};
  assert.deepEqual(await fetchBoundedJson('https://example.com/x',new AbortController().signal,100,request),{});
  const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(60));c.enqueue(new Uint8Array(60));c.close();}});
  await assert.rejects(fetchBoundedJson('https://example.com/x',new AbortController().signal,100,async()=>new Response(stream,{headers:{'content-type':'application/json'}})),/size limit/);
  await assert.rejects(fetchBoundedJson('https://example.com/x',new AbortController().signal,100,async()=>new Response('<html>')),/JSON/);
});
test('LEI checks digits, pins exact response identity and excludes addresses/relationships',()=>{
  assert.equal(validLei('5493001KJTIIGC8Y1R12'),true);assert.equal(validLei('5493001KJTIIGC8Y1R13'),false);
  const p={data:{id:'5493001KJTIIGC8Y1R12',attributes:{lei:'5493001KJTIIGC8Y1R12',entity:{legalName:{name:'Fixture Entity'},status:'ACTIVE'},registration:{status:'ISSUED'}}}};
  const result=parseGleif(p,'5493001KJTIIGC8Y1R12');assert.equal(result.name,'Fixture Entity');assert.equal('address' in result,false);assert.equal('relationships' in result,false);
  assert.throws(()=>parseGleif(p,'other'),/requested LEI/);
});
test('legal entity denial and invalid identifiers send no network request; revoked permission suppresses result',async()=>{
  const g=globalThis as unknown as {chrome:unknown},old=g.chrome,oldFetch=globalThis.fetch;let requests=0,granted=false;
  g.chrome={permissions:{request:()=>Promise.resolve(granted),contains:async()=>false}};
  globalThis.fetch=async()=>{requests++;return new Response('{}',{headers:{'content-type':'application/json'}});};
  try{await assert.rejects(lookupLegalEntity('invalid',new AbortController().signal));assert.equal(await lookupLegalEntity('5493001KJTIIGC8Y1R12',new AbortController().signal),undefined);assert.equal(requests,0);
    granted=true;assert.equal(await lookupLegalEntity('5493001KJTIIGC8Y1R12',new AbortController().signal),undefined);assert.equal(requests,1);
  }finally{g.chrome=old;globalThis.fetch=oldFetch;}
});
test('CPSC permission revoked during a response suppresses candidates',async()=>{
  const result=await lookupRecallCandidates('Fixture','RecallTitle',undefined,new AbortController().signal,{requestPermission:async()=>true,hasPermission:async()=>false,fetch:async()=>new Response('[]',{headers:{'content-type':'application/json'}})});assert.equal(result,undefined);
});
