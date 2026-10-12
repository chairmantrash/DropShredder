import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// Raw browser CDP deliberately never attaches a debugger to the service worker.
// Chrome stops it naturally; normal native-panel messages wake it. Application
// scans are the only history writers; assertions use readonly IndexedDB/API reads.
const root=path.resolve(import.meta.dirname,'../..'),ext=path.join(root,'.output/chrome-mv3'),out=path.join(root,'browser-smoke-results');
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'dropshredder-lifecycle-'));
await fs.mkdir(out,{recursive:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const report={sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),startedAt:new Date().toISOString(),status:'RUNNING',tests:[],errors:[],requests:[],workerDebuggerAttached:false,scope:'Owned engineering fixture; genuine native user controls; natural idle with panel closed, not independent QA or elapsed-week acceptance'};
let child,socket,sequence=0,pending=new Map(),panelSession,pageSession,pageTarget,id,panelTarget;
let stderr='',starts=0;
async function until(fn,label,timeout=10000,interval=100){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await pause(interval);}throw Error('Timed out: '+label);}
async function test(id,description,fn){const start=Date.now();try{const details=await fn();report.tests.push({id,description,status:'PASS',elapsedMs:Date.now()-start,details});console.log(`PASS ${id}: ${description}`);}catch(e){report.tests.push({id,description,status:'FAIL',elapsedMs:Date.now()-start,error:String(e)});throw e;}}
function call(method,params={},sessionId){return new Promise((resolve,reject)=>{const n=++sequence,timer=setTimeout(()=>{pending.delete(n);reject(Error('CDP timeout: '+method));},15000);pending.set(n,{resolve,reject,timer});socket.send(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})}));});}
async function evaluate(expression,sessionId=panelSession){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},sessionId);if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function screenshot(name){execFileSync('scrot',['--overwrite',path.join(out,name)]);}
async function click(selector){
 await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)throw Error('Missing/disabled control');e.scrollIntoView({block:'center'});})()`);await pause(200);
 const p=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,h=document.elementFromPoint(x,y);if(!r.width||!r.height||!(h===e||e.contains(h)))throw Error('Hidden/obscured control');return {x,y,width:innerWidth,height:innerHeight};})()`);
 const {bounds}=await call('Browser.getWindowForTarget',{targetId:pageTarget});assert.equal(bounds.width,1288);assert.ok([850,851].includes(bounds.height));
 report.geometry={bounds,panelViewport:{width:p.width,height:p.height},insetRight:9,insetBottom:8};
 execFileSync('xdotool',['mousemove',String(Math.round(bounds.left+bounds.width-p.width-9+p.x)),String(Math.round(bounds.top+bounds.height-p.height-8+p.y)),'click','1']);await pause(150);
}
async function workers(){const r=await call('Target.getTargets');const w=r.targetInfos.filter(t=>t.type==='service_worker'&&t.url===`chrome-extension://${id}/background.js`);for(const t of w)assert.equal(t.attached,false,'Service worker must never have a debugger attached');return w;}
async function pinToolbar(){
 await call('Page.navigate',{url:'chrome://extensions/'},pageSession);
 // The management page can normalize a deep link before its extension list
 // has loaded. Use its actual rendered Details control instead of assuming
 // the URL query opened the detail view.
 let detail;
 await until(async()=>{const tree=await call('Accessibility.getFullAXTree',{},pageSession);const matches=tree.nodes.filter(n=>n.role?.value==='button'&&n.name?.value==='Details');assert.ok(matches.length<=1,'Only the owned extension may expose Details');detail=matches[0];return detail;},'actual extension Details control');
 await call('DOM.scrollIntoViewIfNeeded',{backendNodeId:detail.backendDOMNodeId},pageSession);
 const d=(await call('DOM.getBoxModel',{backendNodeId:detail.backendDOMNodeId},pageSession)).model.content;
 const dp={x:(d[0]+d[2]+d[4]+d[6])/4,y:(d[1]+d[3]+d[5]+d[7])/4};
 await call('Input.dispatchMouseEvent',{type:'mousePressed',...dp,button:'left',clickCount:1},pageSession);await call('Input.dispatchMouseEvent',{type:'mouseReleased',...dp,button:'left',clickCount:1},pageSession);
 let node;
 const pin=async()=>{const tree=await call('Accessibility.getFullAXTree',{},pageSession);const matches=tree.nodes.filter(n=>/^Pin to toolbar$/i.test(n.name?.value??'')&&['button','checkbox','switch'].includes(n.role?.value));assert.ok(matches.length<=1,'Ambiguous public pin control');node=matches[0];return node;};
 await until(pin,'public Chrome pin-to-toolbar control');
 const isPinned=n=>['true',true].includes(n.properties?.find(p=>['checked','pressed'].includes(p.name))?.value?.value);
 if(!isPinned(node)){
  await call('DOM.scrollIntoViewIfNeeded',{backendNodeId:node.backendDOMNodeId},pageSession);
  const {model}=await call('DOM.getBoxModel',{backendNodeId:node.backendDOMNodeId},pageSession),q=model.content;
  const p={x:(q[0]+q[2]+q[4]+q[6])/4,y:(q[1]+q[3]+q[5]+q[7])/4};assert.ok(model.width>0&&model.height>0);
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',...p},pageSession);await call('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1},pageSession);await call('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1},pageSession);
  await until(async()=>Boolean(await pin())&&isPinned(node),'actual Chrome toolbar pin saved');
 }
 await screenshot(`lifecycle-toolbar-pin-${starts}.png`);
 await call('Page.navigate',{url:'about:blank'},pageSession);await until(()=>evaluate("location.href==='about:blank'&&document.readyState==='complete'",pageSession),'normal browser tab ready');
}
async function attachPanel(){
 await screenshot(`lifecycle-toolbar-before-open-${starts}.png`);
 const {bounds}=await call('Browser.getWindowForTarget',{targetId:pageTarget});assert.equal(bounds.width,1288);assert.ok([850,851].includes(bounds.height));
 // Locate the project's exact opaque icon pixels in the actual toolbar band.
 // This avoids a raw-Chrome crash in the experimental CDP action hook. The
 // physical click must mount the real panel, otherwise the check fails.
 const script=`from PIL import Image
import json
a=Image.open(${JSON.stringify(path.join(out,`lifecycle-toolbar-before-open-${starts}.png`))}).convert('RGBA')
i=Image.open(${JSON.stringify(path.join(root,'public/icon/16.png'))}).convert('RGBA')
mask=[(x,y,i.getpixel((x,y))[:3]) for y in range(i.height) for x in range(i.width) if i.getpixel((x,y))[3]>250]
anchor=next(p for p in mask if p[2][0]>150 and p[2][1]<120)
matches=[]
for y in range(${bounds.top+45},${bounds.top+95}-i.height+1):
 for x in range(${bounds.left+850},${bounds.left+bounds.width}-i.width+1):
  if max(abs(a.getpixel((x+anchor[0],y+anchor[1]))[c]-anchor[2][c]) for c in range(3))>3:continue
  if all(max(abs(a.getpixel((x+px,y+py))[c]-rgb[c]) for c in range(3))<=3 for px,py,rgb in mask):matches.append({'x':x+i.width//2,'y':y+i.height//2})
print(json.dumps(matches))`;
 const points=JSON.parse(execFileSync('python3',['-c',script],{encoding:'utf8'}));assert.equal(points.length,1,'Exactly one actual DropShredder toolbar icon');
 execFileSync('xdotool',['mousemove',String(points[0].x),String(points[0].y),'click','1']);
 (report.toolbarActions??=[]).push({start:starts,icon:points[0],method:'Exact opaque project-icon pixels in actual screenshot; real X11 pointer click'});
 await until(async()=>{panelTarget=(await call('Target.getTargets')).targetInfos.find(t=>t.url===`chrome-extension://${id}/sidepanel.html`);return panelTarget;},'native panel mounted');
 panelSession=(await call('Target.attachToTarget',{targetId:panelTarget.targetId,flatten:true})).sessionId;
 await call('Runtime.enable',{},panelSession);
 await until(()=>evaluate("Boolean(document.querySelector('#build-meta')?.textContent.includes('0.2.0'))"),'native document ready');
}
async function startBrowser(){
 starts++;
 await fs.rm(path.join(profile,'DevToolsActivePort'),{force:true});
 child=spawn(chromium.executablePath(),['--no-sandbox','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-dev-shm-usage','--enable-automation','--test-type','--disable-infobars','--lang=en-US','--accept-lang=en-US','--window-size=1288,851','--window-position=10,10','--remote-debugging-port=0','--remote-debugging-address=127.0.0.1','--enable-unsafe-extension-debugging',`--user-data-dir=${profile}`,`--disable-extensions-except=${ext}`,`--load-extension=${ext}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
 child.stderr.on('data',b=>{stderr=(stderr+b.toString()).slice(-5000);});
 let port;await until(async()=>{try{port=(await fs.readFile(path.join(profile,'DevToolsActivePort'),'utf8')).trim().split('\n');return /^\d+$/.test(port[0]);}catch{return false;}},'raw Chrome debugging endpoint',15000);
 socket=new WebSocket(`ws://127.0.0.1:${port[0]}${port[1]}`);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',()=>reject(Error('Raw browser socket unavailable')),{once:true});});
 socket.addEventListener('message',e=>{
  const r=JSON.parse(e.data);
  if(r.method==='Runtime.exceptionThrown')report.errors.push(r.params.exceptionDetails.text);
  if(r.method==='Fetch.requestPaused'){
   const {requestId,request}=r.params;report.requests.push(request.url);
   const n=new URL(request.url).pathname.match(/\/products\/history-(\d+)/)?.[1]??'0';
   const product={'@context':'https://schema.org','@type':'Product',name:`Owned history mug ${n}`,sku:`HISTORY-${n}`,offers:{'@type':'Offer',price:'12.00',priceCurrency:'USD'}};
   const html=`<!doctype html><title>${product.name}</title><main><h1>${product.name}</h1><p class="product-price">$12.00</p><button>Add to cart</button></main><script type="application/ld+json">${JSON.stringify(product)}</script>`;
   void call('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'content-type',value:'text/html'}],body:Buffer.from(html).toString('base64')},r.sessionId).catch(e=>report.errors.push(String(e)));return;
  }
  const p=pending.get(r.id);if(!p)return;pending.delete(r.id);clearTimeout(p.timer);if(r.error)p.reject(Error(JSON.stringify(r.error)));else p.resolve(r.result);
 });
 report.browser=await call('Browser.getVersion');
 let initial;await until(async()=>{initial=(await call('Target.getTargets')).targetInfos.find(t=>t.type==='service_worker'&&t.url.endsWith('/background.js'));return initial;},'initial extension worker');id=new URL(initial.url).host;assert.equal(initial.attached,false);
 const pages=(await call('Target.getTargets')).targetInfos.filter(t=>t.type==='page'&&!t.url.startsWith('chrome-extension://'));assert.equal(pages.length,1);pageTarget=pages[0].targetId;
 const {windowId}=await call('Browser.getWindowForTarget',{targetId:pageTarget});await call('Browser.setWindowBounds',{windowId,bounds:{left:10,top:10,width:1288,height:851}});
 pageSession=(await call('Target.attachToTarget',{targetId:pageTarget,flatten:true})).sessionId;
 await call('Runtime.enable',{},pageSession);await call('Page.enable',{},pageSession);
 await call('Fetch.enable',{patterns:[{urlPattern:'https://fixture.example.com/*'}]},pageSession);
 await pinToolbar();
 await attachPanel();
}
async function stopBrowser(){
 socket?.close();for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('Browser closed'));}pending.clear();
 if(child&&child.exitCode===null){child.kill('SIGTERM');await Promise.race([new Promise(r=>child.once('exit',r)),pause(3000)]);if(child.exitCode===null)child.kill('SIGKILL');}
}
const settings=()=>evaluate("chrome.storage.local.get('dropshredder-feature-settings-v1').then(r=>r['dropshredder-feature-settings-v1'])");
const history=()=>evaluate(`new Promise((resolve,reject)=>{const r=indexedDB.open('dropshredder',2);r.onerror=()=>reject(r.error);r.onsuccess=()=>{const d=r.result;if(!d.objectStoreNames.contains('observations')){d.close();resolve({count:0,rows:[]});return;}const t=d.transaction('observations','readonly'),q=t.objectStore('observations').getAll();q.onsuccess=()=>resolve({count:q.result.length,rows:q.result.map(x=>({url:x.url,id:x.id,identityKey:x.identityKey}))});q.onerror=()=>reject(q.error);t.oncomplete=()=>d.close();};})`);
async function navigate(n){const url=`https://fixture.example.com/products/history-${n}?token=OWNED-NOT-PRIVATE#owned-fragment`;await call('Page.navigate',{url},pageSession);await until(()=>evaluate(`document.querySelector('h1')?.textContent===${JSON.stringify(`Owned history mug ${n}`)}`,pageSession),'owned product navigation');return url;}
async function scan(n){await navigate(n);await until(()=>evaluate("!document.querySelector('#scan').disabled"),'scan ready');await click('#scan');await until(()=>evaluate("!document.querySelector('#scan').disabled"),'scan completed',20000);const r=JSON.parse(await evaluate("document.querySelector('#raw').textContent"));assert.equal(r.product.sku,`HISTORY-${n}`);assert.equal(r.product.title,`Owned history mug ${n}`);assert.equal(r.verdict.severeWarningAllowed,false);return r.product;}
try{
 await test('L01','Exact unmodified package mounts with a service worker that has no debugger attached',async()=>{
  const candidate=JSON.parse(await fs.readFile(path.join(import.meta.dirname,'candidate-build-info.json'),'utf8'));
  const files=(await fs.readdir(ext,{recursive:true,withFileTypes:true})).filter(e=>e.isFile()).map(e=>path.relative(ext,path.join(e.parentPath,e.name))).sort();assert.deepEqual(files,candidate.buildFiles.map(x=>x.path).sort());
  for(const x of candidate.buildFiles){const b=await fs.readFile(path.join(ext,x.path));assert.equal(b.length,x.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),x.sha256);}
  report.packagedSourceCommit=candidate.sourceCommit;await startBrowser();assert.equal(await evaluate("chrome.permissions.contains({origins:['https://*/*']})"),false);
  if(!await evaluate("document.querySelector('.settings-panel').open"))await click('.settings-panel > summary');await click('#auto-source-hunt');await until(async()=>(await settings())?.autoSourceHunt===true,'normal background patch');
  report.workerBeforeIdle=(await workers())[0];await screenshot('lifecycle-before-idle.png');return {files:files.length,worker:report.workerBeforeIdle};
 });
 await test('L02','Chrome naturally terminates the idle worker after the native panel closes, without a stop or worker-debugger command',async()=>{
  const {bounds}=await call('Browser.getWindowForTarget',{targetId:pageTarget});assert.equal(bounds.width,1288);assert.ok([850,851].includes(bounds.height));
  const beforeWidth=await evaluate('innerWidth',pageSession);
  // Actual Chrome156 desktop captures establish the panel-header Close point.
  execFileSync('xdotool',['mousemove',String(bounds.left+bounds.width-23),String(bounds.top+106),'click','1']);
  // Chrome may cache a closed panel WebContents; actual main-page viewport
  // expansion proves closure without incorrectly requiring cache destruction.
  await until(async()=>(await evaluate('innerWidth',pageSession))>=beforeWidth+200,'native panel actually closed');
  await call('Target.detachFromTarget',{sessionId:panelSession});panelSession=undefined;
  const started=Date.now();await until(async()=>(await workers()).length===0,'natural worker idle shutdown',75000,1000);
  await screenshot('lifecycle-worker-naturally-stopped.png');return {idleElapsedMs:Date.now()-started,workerTargets:await workers(),pageWidthBefore:beforeWidth,pageWidthAfter:await evaluate('innerWidth',pageSession),panelDebuggerDetached:true,scope:'Native panel closed; browser/page remain open; no worker debugger, force stop or time manipulation'};
 });
 await test('L03','A normal native settings action wakes a fresh worker and preserves the earlier saved patch',async()=>{
  await attachPanel();assert.equal(await evaluate("document.querySelector('#auto-source-hunt').checked"),true);
  if(!await evaluate("document.querySelector('.settings-panel').open"))await click('.settings-panel > summary');await click('#prefer-made-in-usa');await until(async()=>(await settings())?.preferMadeInUSA===true,'woken worker patch');
  const w=(await workers())[0];assert.ok(w);assert.notEqual(w.targetId,report.workerBeforeIdle.targetId);
  const s=await settings();assert.deepEqual(s,{autoSourceHunt:true,autoProtection:false,weeklyIntelligenceUpdates:false,preferMadeInUSA:true,toneMode:'professional'});await screenshot('lifecycle-worker-woken.png');return {worker:w,settings:s};
 });
 await test('L04','Genuine Chrome consent and12 actual product scans create only sanitized local history',async()=>{
  await navigate(0);await click('#auto-protection');await pause(2500);await screenshot('lifecycle-real-consent.png');execFileSync('xdotool',['key','Tab','Return']);
  await until(()=>evaluate("!document.querySelector('#auto-protection').disabled"),'consent settled');assert.equal(await evaluate("chrome.permissions.contains({origins:['https://*/*']})"),true);
  for(let n=0;n<12;n++)await scan(n);
  await until(async()=>(await history()).count===12,'12 actual history records');const rows=await history();for(const r of rows.rows){assert.ok(!r.url.includes('?')&&!r.url.includes('#'));assert.ok(!r.url.includes('OWNED-NOT-PRIVATE'));}
  await screenshot('lifecycle-history-created.png');return rows;
 });
 await test('L05','The actual DELETE MY SCAN HISTORY control clears IndexedDB and the next real scan writes normally',async()=>{
  await click('.local-data > summary');await click('#clear-history');await until(async()=>(await history()).count===0,'actual history deletion');
  const s=await settings();assert.equal(s.autoSourceHunt,true);assert.equal(s.preferMadeInUSA,true);assert.equal(s.autoProtection,true);
  await scan(12);await until(async()=>(await history()).count===1,'history reusable');await screenshot('lifecycle-history-reused.png');return {history:await history(),preservedSettings:s};
 });
 await test('L06','Full browser restart retains the post-deletion history and preferences while revoked monitoring remains off',async()=>{
  await click('#revoke-optional-access');await until(()=>evaluate("!document.querySelector('#revoke-optional-access').disabled"),'genuine access removal');assert.equal(await evaluate("chrome.permissions.contains({origins:['https://*/*']})"),false);
  await stopBrowser();await startBrowser();const s=await settings();assert.deepEqual(s,{autoSourceHunt:true,autoProtection:false,weeklyIntelligenceUpdates:false,preferMadeInUSA:true,toneMode:'professional'});
  assert.equal((await history()).count,1);assert.deepEqual(await evaluate('chrome.scripting.getRegisteredContentScripts()'),[]);assert.equal(await evaluate("chrome.permissions.contains({origins:['https://*/*']})"),false);
  assert.deepEqual(report.errors,[]);assert.ok(report.requests.every(u=>new URL(u).origin==='https://fixture.example.com'));await screenshot('lifecycle-restarted.png');return {settings:s,history:await history(),scope:'Full disposable profile restart, not elapsed-week signed publisher acceptance'};
 });
 report.status='PASS — NATURAL WORKER / HISTORY ENGINEERING SUBSET';
}catch(e){report.status='FAIL OR ENVIRONMENT BLOCKED';report.failure=String(e);report.chromeStderr=stderr;
 report.accessibilityAtFailure=pageSession?await call('Accessibility.getFullAXTree',{},pageSession).then(t=>t.nodes.filter(n=>n.name?.value).slice(0,240).map(n=>({role:n.role?.value,name:n.name.value,properties:n.properties}))).catch(()=>undefined):undefined;
 await screenshot('lifecycle-failure.png').catch(()=>{});console.error(e);process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();report.testsPassed=report.tests.filter(t=>t.status==='PASS').length;await fs.writeFile(path.join(out,'lifecycle-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await stopBrowser().catch(()=>{});await fs.rm(profile,{recursive:true,force:true});}
