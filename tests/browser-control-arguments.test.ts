import assert from 'node:assert/strict';
import test from 'node:test';
import {nativeControl} from '../tools/browser-smoke/native-control.mjs';

test('native selector payload crosses CDP only as a value and cannot change executable source',async()=>{
 const payload="');globalThis.__injected=true;//";
 const calls:Array<{method:string;params:Record<string,any>}>=[];
 const call=async(method:string,params:Record<string,any>)=>{
  calls.push({method,params});
  return method==='Runtime.evaluate'?{result:{objectId:'document-1'}}:{result:{value:true}};
 };
 assert.equal(await nativeControl(call,payload,'visible'),true);
 assert.equal(calls[0]!.params.expression,'document');
 const operation=calls.find(x=>x.method==='Runtime.callFunctionOn')!;
 assert.deepEqual(operation.params.arguments,[{value:payload}]);
 assert.equal(operation.params.functionDeclaration.includes(payload),false);
 assert.equal(calls.at(-1)!.method,'Runtime.releaseObject');
});

test('native browser exceptions fail the operation and release the document handle',async()=>{
 const released:string[]=[];
 const call=async(method:string,params:Record<string,any>)=>{
  if(method==='Runtime.evaluate')return {result:{objectId:'document-1'}};
  if(method==='Runtime.releaseObject'){released.push(params.objectId);return {};}
  return {exceptionDetails:{text:'Control is obscured'}};
 };
 await assert.rejects(nativeControl(call,'#scan','point'),/Control is obscured/);
 assert.deepEqual(released,['document-1']);
 await assert.rejects(nativeControl(call,'#scan','constructor'),/Unknown native control operation/);
});
