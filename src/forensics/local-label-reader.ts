import { normalizeGtin } from '../analysis/product-identity';

type TesseractAPI={createWorker:(lang:string,oem:number,opts:Record<string,unknown>)=>Promise<{
  recognize:(image:Blob)=>Promise<{data:{text?:string}}>;
  terminate:()=>Promise<unknown>;
}>};
let offlineScript:Promise<TesseractAPI>|undefined;
function offlineEngine():Promise<TesseractAPI>{
  if(offlineScript)return offlineScript;
  offlineScript=new Promise<TesseractAPI>((resolve,reject)=>{
    const existing=(globalThis as unknown as {Tesseract?:TesseractAPI}).Tesseract;
    if(existing?.createWorker){resolve(existing);return;}
    const script=document.createElement('script');
    script.src=chrome.runtime.getURL('ocr/tesseract.min.js');
    script.async=true;
    script.addEventListener('load',()=>{
      const api=(globalThis as unknown as {Tesseract?:TesseractAPI}).Tesseract;
      if(api?.createWorker)resolve(api);
      else reject(new Error('Packaged local OCR engine did not initialize.'));
    },{once:true});
    script.addEventListener('error',()=>reject(new Error('Packaged OCR assets are missing or unavailable.')),{once:true});
    document.head.append(script);
  }).catch(error=>{offlineScript=undefined;throw error;});
  return offlineScript;
}
async function localTesseract(canvas:OffscreenCanvas,signal:AbortSignal):Promise<string[]>{
  signal.throwIfAborted();
  const api=await offlineEngine();
  signal.throwIfAborted();
  const ocrOrigin=chrome.runtime.getURL('ocr/');
  const worker=await api.createWorker('eng',1,{
    workerPath:ocrOrigin+'worker.min.js',
    corePath:ocrOrigin,
    langPath:ocrOrigin.slice(0,-1),
    workerBlobURL:false,
    cacheMethod:'none',
  });
  const cancel=()=>{void worker.terminate().catch(()=>{});};
  signal.addEventListener('abort',cancel,{once:true});
  try{
    signal.throwIfAborted();
    const image=await canvas.convertToBlob({type:'image/png'});
    signal.throwIfAborted();
    const result=await worker.recognize(image);
    signal.throwIfAborted();
    return (result.data.text??'').slice(0,5000).split(/\r?\n/).map(s=>s.trim()).filter(Boolean).slice(0,60);
  }finally{
    signal.removeEventListener('abort',cancel);
    await worker.terminate().catch(()=>{});
  }
}

export interface LocalLabelReading {barcodes:string[];gtins:string[];textLines:string[];textAvailable:boolean;barcodeAvailable:boolean}
type Detection={rawValue?:string;rawText?:string;};
type Constructor<T>={new():T;create?:()=>Promise<T>};
type Detector={detect:(image:ImageBitmap|OffscreenCanvas)=>Promise<Detection[]>};
type ShapeAPI={BarcodeDetector?:Constructor<Detector>;TextDetector?:Constructor<Detector>};
export function collectLocalLabelResults(codes:unknown[],lines:unknown[],textAvailable:boolean,barcodeAvailable:boolean):LocalLabelReading{
  const clean=(v:unknown)=>typeof v==='string'?v.normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,160):'';
  const barcodes=[...new Set(codes.slice(0,30).map(clean).filter(Boolean))].slice(0,16);
  const textLines=[...new Set(lines.slice(0,100).map(clean).filter(Boolean))].slice(0,50);
  const gtins=[...new Set(barcodes.map(code=>normalizeGtin(code)).filter((x):x is string=>Boolean(x)))].slice(0,10);
  return {barcodes,gtins,textLines,textAvailable,barcodeAvailable};
}
/**
 * Deliberate opt-in image processing. Decode one local File, downsample before
 * platform detectors, never transmit pixels, persist images or probe page fields.
 * Shape Detection is capability-gated: browser support is not assumed.
 */
export async function readLocalLabel(file:File,signal:AbortSignal):Promise<LocalLabelReading>{
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size<1||file.size>8_000_000)
    throw new Error('Choose a supported image under 8 MB.');
  signal.throwIfAborted();
  const bitmap=await createImageBitmap(file);
  try{
    signal.throwIfAborted();
    if(!bitmap.width||!bitmap.height||bitmap.width*bitmap.height>40_000_000) throw new Error('Image dimensions are unsupported.');
    const scale=Math.min(1,1024/Math.max(bitmap.width,bitmap.height));
    const canvas=new OffscreenCanvas(Math.max(1,Math.floor(bitmap.width*scale)),Math.max(1,Math.floor(bitmap.height*scale)));
    const ctx=canvas.getContext('2d');
    if(!ctx) throw new Error('Local image canvas is unavailable.');
    ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    const api=globalThis as unknown as ShapeAPI;
    const detect=async(Type:Constructor<Detector>|undefined):Promise<{supported:boolean;values:Detection[]}>=>{
      if(!Type) return {supported:false,values:[]};
      const detector=typeof Type.create==='function'?await Type.create():new Type();
      signal.throwIfAborted();
      try{
        const values=await detector.detect(canvas);
        signal.throwIfAborted();
        return {supported:true,values:Array.isArray(values)?values.slice(0,100):[]};
      }catch{
        signal.throwIfAborted();
        return {supported:false,values:[]};
      }
    };
    const barcodes=await detect(api.BarcodeDetector);
    const text=await detect(api.TextDetector);
    // Native platform OCR is optional in Chrome. A bundled Tesseract engine
    // supplies a fully offline fallback with no user account or CDN requests.
    let lines=text.values.map(v=>v.rawText);
    let ocrAvailable=text.supported;
    if(!ocrAvailable){
      try{
        lines=await localTesseract(canvas,signal);
        ocrAvailable=true;
      }catch(error){
        signal.throwIfAborted();
        // Never mask a broken packaged OCR engine as "unavailable" after the
        // user explicitly requested fallback recognition.
        throw new Error('Offline OCR failed: '+String(error&&typeof error==='object'&&'message' in error?(error as {message:unknown}).message:error).slice(0,240));
      }
    }
    return collectLocalLabelResults(barcodes.values.map(v=>v.rawValue),lines,
      ocrAvailable,barcodes.supported);
  }finally{bitmap.close();}
}
