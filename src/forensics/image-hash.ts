export interface PerceptualHash {
  kind:'ahash'|'dhash';
  bits:string;
  width:number;
  height:number;
}

function gray(r:number,g:number,b:number):number {
  return Math.round(r*.299+g*.587+b*.114);
}

function sampleNearest(
  data:ImageData,
  outWidth:number,
  outHeight:number,
):number[] {
  const values:number[]=[];
  for(let y=0;y<outHeight;y++){
    const sy=Math.min(data.height-1,Math.floor((y+.5)*data.height/outHeight));
    for(let x=0;x<outWidth;x++){
      const sx=Math.min(data.width-1,Math.floor((x+.5)*data.width/outWidth));
      const i=(sy*data.width+sx)*4;
      values.push(gray(data.data[i] ?? 0,data.data[i+1] ?? 0,data.data[i+2] ?? 0));
    }
  }
  return values;
}

export function averageHash(data:ImageData,size=8):PerceptualHash {
  const values=sampleNearest(data,size,size);
  const mean=values.reduce((a,b)=>a+b,0)/values.length;
  return {
    kind:'ahash',
    bits:values.map(v=>v>=mean?'1':'0').join(''),
    width:size,
    height:size,
  };
}

export function differenceHash(data:ImageData,width=8,height=8):PerceptualHash {
  const values=sampleNearest(data,width+1,height);
  let bits='';
  for(let y=0;y<height;y++){
    const row=y*(width+1);
    for(let x=0;x<width;x++) bits+=values[row+x]!>=values[row+x+1]!'1':'0';
  }
  return {kind:'dhash',bits,width,height};
}

export function hammingDistance(a:PerceptualHash,b:PerceptualHash):number {
  if(a.kind!==b.kind || a.bits.length!==b.bits.length) return Number.POSITIVE_INFINITY;
  let distance=0;
  for(let i=0;i<a.bits.length;i++) if(a.bits[i]!==b.bits[i]) distance++;
  return distance;
}

export function hashSimilarity(a:PerceptualHash,b:PerceptualHash):number {
  const distance=hammingDistance(a,b);
  if(!Number.isFinite(distance)) return 0;
  return 1-distance/a.bits.length;
}

export async function sha256Hex(bytes:ArrayBuffer):Promise<string> {
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(value=>value.toString(16).padStart(2,'0')).join('');
}
