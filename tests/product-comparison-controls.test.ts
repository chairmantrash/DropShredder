import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {mountProductComparison} from '../src/ui/product-comparison-controls';
import {calculateVerdict} from '../src/analysis/evidence-engine';
import type {DropShredderReport} from '../src/types/report';

const source='https://maker.example/products/lamp';
const body='<script type="application/ld+json">'+JSON.stringify({'@type':'Product',url:source,name:'Lamp','gtin':'012345678905'})+'</script>';
const tick=async()=>{for(let i=0;i<15;i++)await new Promise(r=>setTimeout(r,0));};
function setup(){
 const {document,window}=parseHTML('<html><body><input id="compare-product-url"><button id="compare-product"></button><button id="compare-product-cancel"></button><p id="compare-product-status"></p><button id="revoke-optional-access"></button></body></html>');
 let report:DropShredderReport|undefined={version:1,product:{url:'https://shop.example/p',domain:'shop.example',gtin:'012345678905',capturedAt:new Date().toISOString(),imageUrls:[],jsonLdProductCount:1,claims:[],pageSignals:[]},merchant:{domain:'shop.example'},evidence:[],contradictions:[],verdict:calculateVerdict([])};
 let permissionResolve:(v:boolean)=>void=()=>{},grant=true,guard=true,fetches=0;const requested:string[]=[];
 let responseResolve:((v:Response)=>void)|undefined,delayed=false;
 const removed:((value:{origins:string[]})=>void)[]=[];
 Object.assign(globalThis,{chrome:{permissions:{request:({origins}:{origins:string[]})=>{requested.push(...origins);return new Promise<boolean>(resolve=>{permissionResolve=resolve;});},contains:async()=>grant,onRemoved:{addListener:(fn:any)=>removed.push(fn)}}}});
 const oldFetch=globalThis.fetch;globalThis.fetch=(async()=>{fetches++;return delayed?new Promise<Response>(r=>{responseResolve=r;}):new Response(body,{headers:{'content-type':'text/html'}});}) as typeof fetch;
 const controls=mountProductComparison(()=>report,r=>{report=r;},async()=>guard,document as unknown as Document);
 const click=(id:string)=>document.getElementById(id)!.dispatchEvent(new window.Event('click'));
 const start=()=>{(document.getElementById('compare-product-url') as any).value=source;click('compare-product');};
 return {document,start,click,controls,requested,get fetches(){return fetches;},get report(){return report;},set report(v){report=v;},allow:(v=true)=>permissionResolve(v),setGrant:(v:boolean)=>{grant=v;},setGuard:(v:boolean)=>{guard=v;},delay:()=>{delayed=true;},resolve:()=>responseResolve?.(new Response(body,{headers:{'content-type':'text/html'}})),revoke:()=>removed.forEach(fn=>fn({origins:['https://maker.example/*']})),restore:()=>{globalThis.fetch=oldFetch;}};
}
test('explicit comparison requests one exact host, clears field, then adds zero-weight evidence',async()=>{
 const s=setup();try{s.start();assert.deepEqual(s.requested,['https://maker.example/*']);assert.equal(s.fetches,0);assert.equal((s.document.getElementById('compare-product-url') as any).value,'');s.allow();await tick();assert.equal(s.fetches,1);assert.equal(s.report?.evidence[0]?.weight,0);assert.match(s.report?.evidence[0]?.title??'',/Matching/);assert.equal(s.report?.verdict.severeWarningAllowed,false);}finally{s.restore();}
});
test('denial, cancel, stale report and failed page guard send no comparison request',async()=>{
 for(const mode of ['deny','cancel','stale','guard']){const s=setup();try{s.start();if(mode==='cancel')s.click('compare-product-cancel');if(mode==='stale')s.report=undefined;if(mode==='guard')s.setGuard(false);s.allow(mode!=='deny');await tick();assert.equal(s.fetches,0,mode);assert.equal(s.report?.evidence.length??0,0);}finally{s.restore();}}
});
test('cancellation, revocation and navigation during response discard all findings',async()=>{
 for(const mode of ['cancel','revoke','navigation','lostPermission']){const s=setup();try{s.delay();s.start();s.allow();await tick();assert.equal(s.fetches,1);if(mode==='cancel')s.click('compare-product-cancel');if(mode==='revoke')s.revoke();if(mode==='navigation')s.report=undefined;if(mode==='lostPermission')s.setGrant(false);s.resolve();await tick();assert.equal(s.report?.evidence.length??0,0,mode);}finally{s.restore();}}
});
test('private/variant URL and same-site URL are refused before Chrome permission',()=>{
 const s=setup();try{for(const url of ['https://maker.example/account','https://maker.example/products/lamp?variant=42','https://shop.example/another']){(s.document.getElementById('compare-product-url') as any).value=url;s.click('compare-product');}assert.equal(s.requested.length,0);assert.equal(s.fetches,0);}finally{s.restore();}
});
