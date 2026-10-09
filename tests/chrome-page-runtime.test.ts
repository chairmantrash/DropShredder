import assert from 'node:assert/strict';
import test from 'node:test';
import { activeWebTab, authorizeChromePage, documentTarget, isCurrentChromePage, chromeProductSelectionStamp } from '../src/runtime/chrome-page';
import { lookupDomainRdap } from '../src/osint/rdap';
import { captureImageFingerprint } from '../src/forensics/image-acquisition';

type ChromeMock=typeof chrome;
const original=(globalThis as {chrome?:ChromeMock}).chrome;
test.after(()=>{
  if(original) (globalThis as {chrome?:ChromeMock}).chrome=original;
  else delete (globalThis as {chrome?:ChromeMock}).chrome;
});
const install=(mock:unknown):void=>{
  (globalThis as {chrome?:ChromeMock}).chrome=mock as ChromeMock;
};

test('uses the last focused browser window and does not require tab.url to identify a tab',async()=>{
  let query:unknown;
  install({tabs:{query:async(value:unknown)=>{query=value;return [{id:43}];}}});
  const tab=await activeWebTab();
  assert.equal(tab?.id,43);
  assert.deepEqual(query,{active:true,lastFocusedWindow:true});
});

test('only authorized script execution yields a page/document; denied injection adds Chrome native host request',async()=>{
  const requests:number[]=[];
  install({
    scripting:{executeScript:async()=>{throw new Error('Access denied');}},
    permissions:{addHostAccessRequest:async({tabId}:{tabId:number})=>{requests.push(tabId);}},
  });
  const result=await authorizeChromePage({id:43} as chrome.tabs.Tab);
  assert.equal(result,undefined);
  assert.deepEqual(requests,[43]);
});

test('successful probe pins the real document without relying on tab URL metadata',async()=>{
  install({
    scripting:{executeScript:async()=>[{documentId:'doc-1',frameId:0,result:'https://shop.example/item'}]},
  });
  const page=await authorizeChromePage({id:43} as chrome.tabs.Tab);
  assert.equal(page?.url,'https://shop.example/item');
  assert.deepEqual(page && documentTarget(page),{tabId:43,documentIds:['doc-1']});
});

test('current-page check rejects tab switches, SPA navigation, document changes and sensitive forms',async()=>{
  const page={tab:{id:43} as chrome.tabs.Tab,tabId:43,documentId:'doc-1',url:'https://shop.example/item',selectionStamp:'initial'};
  let tabId=43;
  let documentId='doc-1';
  let url=page.url;
  let sensitive=false;
  let selectionStamp='initial';
  install({
    tabs:{query:async()=>[{id:tabId}]},
    scripting:{executeScript:async({func}:{func:unknown})=>[{documentId,result:func===chromeProductSelectionStamp?selectionStamp:{url,sensitive}}]},
  });
  assert.equal(await isCurrentChromePage(page),true);
  selectionStamp='changed variant';assert.equal(await isCurrentChromePage(page),false);selectionStamp='initial';
  tabId=99;
  assert.equal(await isCurrentChromePage(page),false);
  tabId=43;
  url='https://shop.example/other';
  assert.equal(await isCurrentChromePage(page),false);
  url=page.url;
  documentId='doc-2';
  assert.equal(await isCurrentChromePage(page),false);
  documentId='doc-1';
  sensitive=true;
  assert.equal(await isCurrentChromePage(page),false);
});

test('RDAP asks permission before any async cache lookup and does not fetch after denial',async()=>{
  const calls:string[]=[];
  install({
    permissions:{request:({origins}:{origins:string[]})=>{
      assert.deepEqual(origins,['https://rdap.verisign.com/*']);
      calls.push('request');
      return Promise.resolve(false);
    }},
    storage:{session:{get:async()=>{calls.push('cache');return {};}}},
  });
  assert.equal(await lookupDomainRdap('example.com'),undefined);
  assert.deepEqual(calls,['request']);
});

test('image acquisition starts exact-host access request without async preflight',async()=>{
  const calls:string[]=[];
  install({
    permissions:{request:({origins}:{origins:string[]})=>{
      assert.deepEqual(origins,['https://img.example/*']);
      calls.push('request');
      return Promise.resolve(false);
    }},
  });
  assert.equal(await captureImageFingerprint('https://img.example/a.png'),undefined);
  assert.deepEqual(calls,['request']);
});
