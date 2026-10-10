import assert from 'node:assert/strict';
import test from 'node:test';
import {AUTO_CONTENT_ID,AUTO_CONTENT_PATH,AUTO_PANEL_INTENT,AUTO_PATTERN,setAutoContentRegistration} from '../src/runtime/auto-registration';

test('automatic scanning registration has no manifest content-script or permanent host permission requirement',()=>{
  assert.equal(AUTO_CONTENT_PATH,'content-scripts/auto.js');
  assert.equal(AUTO_PATTERN,'https://*/*');
  assert.equal(AUTO_PANEL_INTENT,'dropshredder-auto-panel-intent-v1');
});

test('enabled registration is isolated, top-frame only, persistent, and idempotent',async()=>{
  let scripts:chrome.scripting.RegisteredContentScript[]=[];
  const history:Array<chrome.scripting.RegisteredContentScript[]>=[];
  const old=(globalThis as {chrome?:typeof chrome}).chrome;
  (globalThis as {chrome?:typeof chrome}).chrome={
    scripting:{
      getRegisteredContentScripts:async()=>scripts,
      registerContentScripts:async(items:chrome.scripting.RegisteredContentScript[])=>{scripts=items;history.push(items);},
      unregisterContentScripts:async()=>{scripts=[];},
    },
  } as unknown as typeof chrome;
  try{
    await setAutoContentRegistration(true);
    await setAutoContentRegistration(true);
    assert.equal(history.length,1);
    assert.deepEqual(scripts,[{
      id:AUTO_CONTENT_ID,matches:[AUTO_PATTERN],js:[AUTO_CONTENT_PATH],
      runAt:'document_idle',allFrames:false,persistAcrossSessions:true,world:'ISOLATED',
    }]);
    await setAutoContentRegistration(false);
    assert.deepEqual(scripts,[]);
  }finally{
    if(old)(globalThis as {chrome?:typeof chrome}).chrome=old;
    else delete (globalThis as {chrome?:typeof chrome}).chrome;
  }
});
