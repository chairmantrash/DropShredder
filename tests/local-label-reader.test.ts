import assert from 'node:assert/strict';
import test from 'node:test';
import {collectLocalLabelResults,readLocalLabel} from '../src/forensics/local-label-reader';

test('local shape detector output is bounded, checksum-filtered and unscored',()=>{
 const r=collectLocalLabelResults(['012345678905','012345678905','FAKE BARCODE'],
 ['Product model ACME','Product model ACME','Lot 007'],true,true);
 assert.equal(r.barcodes.length,2);
 assert.equal(r.gtins.length,1);
 assert.equal(r.textLines.length,2);
 assert.equal(r.barcodeAvailable,true);
});
test('label parser never invents OCR when unavailable',()=>{
 const r=collectLocalLabelResults([],[],false,false);
 assert.deepEqual(r.barcodes,[]);assert.equal(r.textAvailable,false);
});

test('unsupported OCR model cannot decode or fetch an image',async()=>{
 const {readLocalLabel}=await import('../src/forensics/local-label-reader');
 await assert.rejects(readLocalLabel(new File(['pixels'],'fixture.png',{type:'image/png'}),new AbortController().signal,'remote-model' as never),/Unsupported/);
});

test('explicit Arabic OCR preserves the native detector budget and caps enlarged input; cancellation terminates its worker',async()=>{
 const originals=new Map(['OffscreenCanvas','createImageBitmap','Tesseract','chrome','BarcodeDetector','TextDetector'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 const detectorSizes:number[][]=[],ocrSizes:number[][]=[];
 let terminated=0,closed=0,abortOnInit:AbortController|undefined;
 class Canvas{
  constructor(public width:number,public height:number){}
  getContext(){return {drawImage:()=>{},imageSmoothingEnabled:true,imageSmoothingQuality:'low'};}
  async convertToBlob(){return new Blob([JSON.stringify([this.width,this.height])]);}
 }
 const install=(k:string,value:unknown)=>Object.defineProperty(globalThis,k,{value,configurable:true,writable:true});
 install('OffscreenCanvas',Canvas);
 install('createImageBitmap',async()=>({width:1600,height:400,close:()=>{closed++;}}));
 install('chrome',{runtime:{getURL:(p:string)=>'chrome-extension://owned-fixture/'+p}});
 install('BarcodeDetector',class {async detect(c:Canvas){detectorSizes.push([c.width,c.height]);return [];}});
 install('TextDetector',undefined);
 install('Tesseract',{createWorker:async()=>{
  abortOnInit?.abort();
  return {recognize:async(b:Blob)=>{ocrSizes.push(JSON.parse(await b.text()));return {data:{text:'Unverified fixture label'}};},terminate:async()=>{terminated++;}};
 }});
 try{
  const file=new File(['owned mock image'],'owned.png',{type:'image/png'});
  for(const language of ['ara','hin','eng'] as const)await readLocalLabel(file,new AbortController().signal,language);
  assert.deepEqual(detectorSizes,[[1024,256],[1024,256],[1024,256]]);
  assert.deepEqual(ocrSizes,[[2048,512],[1024,256],[1024,256]]);
  assert.equal(terminated,3);assert.equal(closed,3);
  abortOnInit=new AbortController();
  await assert.rejects(readLocalLabel(file,abortOnInit.signal,'ara'),{name:'AbortError'});
  assert.equal(ocrSizes.length,3);assert.equal(terminated,4);assert.equal(closed,4);
 }finally{
  for(const [key,descriptor]of originals){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}
 }
});
