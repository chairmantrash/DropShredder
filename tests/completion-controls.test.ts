import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {mountOptionalWebSearch} from '../src/ui/optional-web-search';

const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
function setup(){
 const {document}=parseHTML('<body><input id="brave-key"><input id="brave-query"><button id="brave-search"></button><button id="brave-cancel"></button><button id="revoke-optional-access"></button><p id="brave-status"></p><div id="brave-results"></div></body>');
 const doc=document as unknown as Document;
 const g=globalThis as unknown as {chrome:unknown};const saved=g.chrome,fetchSaved=globalThis.fetch;
 const prompts:Array<(value:boolean)=>void>=[];let removed:(value:{origins?:string[]})=>void=()=>{};
 g.chrome={permissions:{request:()=>new Promise<boolean>(resolve=>prompts.push(resolve)),contains:async()=>true,onRemoved:{addListener:(fn:typeof removed)=>{removed=fn;}}}};
 mountOptionalWebSearch(doc);
 const input=(id:string,value:string)=>{(doc.getElementById(id) as HTMLInputElement).value=value;};
 const click=(id:string)=>doc.getElementById(id)!.click();
 const status=()=>doc.getElementById('brave-status')!.textContent!;
 return {doc,input,click,status,prompts,removed:(origins:string[])=>removed({origins}),restore:()=>{g.chrome=saved;globalThis.fetch=fetchSaved;}};
}
test('old canceled permission prompt cannot overwrite a newer supplier search',async()=>{
 const s=setup();let requests=0;
 try{
  globalThis.fetch=async()=>{requests++;return new Response(JSON.stringify({web:{results:[{title:'Supplier candidate',url:'https://supplier.example/product',description:'Unverified'}]}}),{headers:{'content-type':'application/json'}});};
  s.input('brave-key','owned-fake-key-one');s.input('brave-query','Product model one');s.click('brave-search');
  assert.equal((s.doc.getElementById('brave-key') as HTMLInputElement).value,'');
  s.click('brave-cancel');s.input('brave-key','owned-fake-key-two');s.input('brave-query','Product model two');s.click('brave-search');
  s.prompts[0]!(false);await tick();assert.match(s.status(),/Requesting one explicit/);assert.equal(requests,0);
  s.prompts[1]!(true);await tick();await tick();assert.equal(requests,1);assert.match(s.status(),/Source candidates: 1/);
 }finally{s.restore();}
});
test('broad site revocation aborts supplier fetch and clears key/results',async()=>{
 const s=setup();let signal:AbortSignal|undefined;
 try{
  globalThis.fetch=async(_url,options)=>{
   signal=options?.signal as AbortSignal;
   return new Promise<Response>((_resolve,reject)=>signal!.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true}));
  };
  s.input('brave-key','owned-fake-key');s.input('brave-query','Public product');s.click('brave-search');s.prompts[0]!(true);await tick();
  s.input('brave-key','unsubmitted-local-key');s.removed(['https://*/*']);await tick();
  assert.equal(signal!.aborted,true);assert.equal((s.doc.getElementById('brave-key') as HTMLInputElement).value,'');
  assert.equal(s.doc.getElementById('brave-results')!.children.length,0);assert.match(s.status(),/site access is removed/);
  assert.equal((s.doc.getElementById('brave-search') as HTMLButtonElement).disabled,false);
 }finally{s.restore();}
});
test('remove-access control cancels pending supplier consent before any fetch',async()=>{
 const s=setup();let requests=0;
 try{
  globalThis.fetch=async()=>{requests++;return new Response('{}');};
  s.input('brave-key','owned-fake-key');s.input('brave-query','Public product');s.click('brave-search');
  s.click('revoke-optional-access');s.prompts[0]!(true);await tick();assert.equal(requests,0);assert.match(s.status(),/site access is removed/);
 }finally{s.restore();}
});
