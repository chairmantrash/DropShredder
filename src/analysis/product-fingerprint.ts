export interface ProductFingerprintInput {
 gtin?:string; brand?:string; mpn?:string; sku?:string; variantId?:string;
 title?:string; specs?:Record<string,string|number>; imageHashes?:string[];
}
export interface ProductFingerprint {
 gtin?:string; brand?:string; mpn?:string; sku?:string; variantId?:string;
 titleTokens:string[]; specTokens:string[]; imageHashes:string[];
}
const text=(v:string|undefined)=>v?.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()||undefined;
const ident=(v:string|undefined)=>text(v)?.replace(/[^a-z0-9]/g,'');
export function buildProductFingerprint(x:ProductFingerprintInput):ProductFingerprint{
 const titleTokens=[...new Set((text(x.title)??'').split(' ').filter(t=>t.length>=3))].sort().slice(0,40);
 const specTokens=Object.entries(x.specs??{}).map(([k,v])=>`${text(k)}=${text(String(v))}`).filter(Boolean).sort().slice(0,50);
 return {gtin:ident(x.gtin),brand:text(x.brand),mpn:ident(x.mpn),sku:ident(x.sku),variantId:ident(x.variantId),titleTokens,specTokens,imageHashes:[...new Set(x.imageHashes??[])].sort().slice(0,12)};
}
export function compareProductFingerprints(a:ProductFingerprint,b:ProductFingerprint){
 const reasons:string[]=[];let score=0;
 if(a.gtin&&b.gtin&&a.gtin===b.gtin){score=1;reasons.push('Same GTIN');}
 else{
  if(a.brand&&b.brand&&a.brand===b.brand&&a.mpn&&b.mpn&&a.mpn===b.mpn){score+=.72;reasons.push('Same brand and model number');}
  const images=a.imageHashes.filter(x=>b.imageHashes.includes(x)).length;
  if(images){score+=Math.min(.5,images*.25);reasons.push('Same product image');}
  const specs=a.specTokens.filter(x=>b.specTokens.includes(x)).length;
  if(specs>=3){score+=Math.min(.35,specs*.06);reasons.push('Matching product details');}
  const title=a.titleTokens.filter(x=>b.titleTokens.includes(x)).length;
  const denom=Math.max(1,new Set([...a.titleTokens,...b.titleTokens]).size);
  if(title/denom>=.55){score+=.18;reasons.push('Very similar product name');}
 }
 return {score:Math.min(1,score),reasons,exactIdentity:Boolean(a.gtin&&b.gtin&&a.gtin===b.gtin)};
}
