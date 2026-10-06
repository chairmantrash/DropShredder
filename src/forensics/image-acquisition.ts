import { averageHash, differenceHash, sha256Hex } from './image-hash';

export interface CapturedImageFingerprint {
  url:string;
  sha256:string;
  ahash:string;
  dhash:string;
  width:number;
  height:number;
  capturedAt:string;
}

const MAX_IMAGE_BYTES=15_000_000;
const HASH_SAMPLE_MAX=128;

function hostPattern(url:string):string {
  const parsed=new URL(url);
  return `${parsed.protocol}//${parsed.host}/*`;
}

async function ensureImageHostPermission(url:string):Promise<boolean> {
  const origin=hostPattern(url);
  if(await chrome.permissions.contains({origins:[origin]})) return true;
  return chrome.permissions.request({origins:[origin]});
}

export async function captureImageFingerprint(url:string):Promise<CapturedImageFingerprint|undefined> {
  if(!/^https:/i.test(url)) return undefined;
  const granted=await ensureImageHostPermission(url);
  if(!granted) return undefined;

  const response=await fetch(url,{
    credentials:'omit',
    cache:'force-cache',
    signal:AbortSignal.timeout(8000),
  });
  if(!response.ok) throw new Error(`Image fetch failed: HTTP ${response.status}`);
  const declaredSize=Number(response.headers.get('content-length') || 0);
  if(declaredSize>MAX_IMAGE_BYTES) throw new Error('Selected image exceeds the 15 MB safety limit.');

  const blob=await response.blob();
  if(blob.size>MAX_IMAGE_BYTES) throw new Error('Selected image exceeds the 15 MB safety limit.');
  if(!blob.type.startsWith('image/')) throw new Error('Selected resource is not an image.');

  const bytes=await blob.arrayBuffer();
  const sha256=await sha256Hex(bytes);
  const bitmap=await createImageBitmap(blob);
  try {
    const originalWidth=bitmap.width;
    const originalHeight=bitmap.height;
    if(!originalWidth || !originalHeight) throw new Error('Image dimensions are invalid.');

    const scale=Math.min(1,HASH_SAMPLE_MAX/Math.max(originalWidth,originalHeight));
    const width=Math.max(1,Math.round(originalWidth*scale));
    const height=Math.max(1,Math.round(originalHeight*scale));
    const canvas=new OffscreenCanvas(width,height);
    const context=canvas.getContext('2d',{willReadFrequently:true});
    if(!context) throw new Error('Canvas context unavailable.');
    context.drawImage(bitmap,0,0,width,height);
    const imageData=context.getImageData(0,0,width,height);
    const ahash=averageHash(imageData);
    const dhash=differenceHash(imageData);
    return {
      url,
      sha256,
      ahash:ahash.bits,
      dhash:dhash.bits,
      width:originalWidth,
      height:originalHeight,
      capturedAt:new Date().toISOString(),
    };
  } finally {
    bitmap.close();
  }
}
