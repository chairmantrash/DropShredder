import assert from 'node:assert/strict';
import test from 'node:test';
import { AUTO_CONTENT_ID, setAutoContentRegistration } from '../src/runtime/auto-registration';

const setChrome=(mock:unknown)=>{(globalThis as {chrome?:typeof chrome}).chrome=mock as typeof chrome;};
const original=(globalThis as {chrome?:typeof chrome}).chrome;
test.after(()=>{if(original) setChrome(original);else delete (globalThis as {chrome?:typeof chrome}).chrome;});

test('revocation is idempotent if the worker already removed the same registration',async()=>{
  let reads=0,unregisters=0;
  setChrome({scripting:{
    getRegisteredContentScripts:async()=>++reads===1?[{id:AUTO_CONTENT_ID}]:[],
    unregisterContentScripts:async()=>{unregisters++;throw new Error('Nonexistent script ID');},
  }});
  await setAutoContentRegistration(false);
  assert.equal(unregisters,1);
  assert.equal(reads,2);
});

test('concurrent registration treats a proven duplicate as already enabled',async()=>{
  let reads=0;
  setChrome({scripting:{
    getRegisteredContentScripts:async()=>++reads===1?[]:[{id:AUTO_CONTENT_ID}],
    registerContentScripts:async()=>{throw new Error('Duplicate script ID');},
  }});
  await setAutoContentRegistration(true);
  assert.equal(reads,2);
});

test('registration cleanup errors still propagate if the script remains installed',async()=>{
  setChrome({scripting:{
    getRegisteredContentScripts:async()=>[{id:AUTO_CONTENT_ID}],
    unregisterContentScripts:async()=>{throw new Error('Registration API unavailable');},
  }});
  await assert.rejects(setAutoContentRegistration(false),/Registration API unavailable/);
});

test('failed registration cannot be reported as enabled if no script exists',async()=>{
  setChrome({scripting:{
    getRegisteredContentScripts:async()=>[],
    registerContentScripts:async()=>{throw new Error('Registration denied');},
  }});
  await assert.rejects(setAutoContentRegistration(true),/Registration denied/);
});
