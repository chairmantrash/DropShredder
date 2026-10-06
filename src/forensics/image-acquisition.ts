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
  if(!/^https?:/i.test(url)) return undefined;
  const granted=await ensureImageHostPermission(url);
  if(!granted) return undefined;

  const response=await fetch(url,{credentials:'omit',cache:'force-cache'});
  if(!response.ok) throw new Error(`Image fetch failed: HTTP ${response.status}`);
  const blob=await response.blob();
  if(!blob.type.startsWith('image/')) throw new Error('Selected resource is not an image.');

  const bytes=await blob.arrayBuffer();
  const sha256=await sha256Hex(bytes);
  const bitmap=await createImageBitmap(blob);
  try {
    const canvas=new OffscreenCanvas(bitmap.width,bitmap.height);
    const context=canvas.getContext('2d',{willReadFrequently:true});
    if(!context) throw new Error('Canvas context unavailable.');
    context.drawImage(bitmap,0,0);
    const imageData=context.getImageData(0,0,bitmap.width,bitmap.height);
    const ahash=averageHash(imageData);
    const dhash=differenceHash(imageData);
    return {
      url,
      sha256,
      ahash:ahash.bits,
      dhash:dhash.bits,
      width:bitmap.width,
      height:bitmap.height,
      capturedAt:new Date().toISOString(),
    };
  } finally {
    bitmap.close();
  }
}
