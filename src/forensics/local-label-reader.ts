import { normalizeGtin } from '../analysis/product-identity';

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
    return collectLocalLabelResults(barcodes.values.map(v=>v.rawValue),text.values.map(v=>v.rawText),
      text.supported,barcodes.supported);
  }finally{bitmap.close();}
}
