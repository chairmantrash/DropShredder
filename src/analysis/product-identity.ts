/** Normalization is retrieval support, not verification of a seller-authored identifier. */
export interface ProductIdentityInput {
  gtin?:string;
  asin?:string;
  brand?:string;
  mpn?:string;
  sku?:string;
  variantId?:string;
  domain?:string;
  specifications?:Record<string,string>;
}

export function normalizeProductIdentifier(value:string|undefined):string|undefined {
  if(!value || value.length>200) return undefined;
  const text=value.normalize('NFKC').toLowerCase()
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g,'').replace(/[‐‑‒–—―]/g,'-').trim();
  // Remove formatting spaces/hyphens only; do not collapse every punctuation or non-Latin name.
  return text?.replace(/[\s-]+/g,'') || undefined;
}

export function normalizeGtin(value:string|undefined):string|undefined {
  if(!value || value.length>100) return undefined;
  const digits=value.normalize('NFKC').replace(/[\s-]+/g,'');
  if(!digits || !/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(digits) || /^0+$/.test(digits)) return undefined;
  let sum=0;
  for(let i=digits.length-2,position=0;i>=0;i--,position++) sum+=Number(digits[i])*(position%2===0?3:1);
  if((10-sum%10)%10!==Number(digits.at(-1))) return undefined;
  return digits.padStart(14,'0');
}

export function normalizeAsin(value:string|undefined):string|undefined {
  if(!value || value.length>100) return undefined;
  const asin=value.normalize('NFKC').trim().toUpperCase();
  return asin && /^[A-Z0-9]{10}$/.test(asin) ? asin : undefined;
}

export function compareProductIdentity(a:ProductIdentityInput,b:ProductIdentityInput) {
  const matches:string[]=[], conflicts:string[]=[];
  for(const [name,left,right] of [
    ['gtin',normalizeGtin(a.gtin),normalizeGtin(b.gtin)],
    ['asin',normalizeAsin(a.asin),normalizeAsin(b.asin)],
  ] as const){
    if(left && right) (left===right?matches:conflicts).push(name);
  }
  const brandA=normalizeProductIdentifier(a.brand),brandB=normalizeProductIdentifier(b.brand);
  const modelA=normalizeProductIdentifier(a.mpn),modelB=normalizeProductIdentifier(b.mpn);
  if(brandA && brandB && brandA===brandB && modelA && modelB){
    (modelA===modelB?matches:conflicts).push('brand-model');
  }
  // Store-local variant/SKU numbers are not globally unique. Do not cross-match those namespaces.
  if(a.domain && a.domain===b.domain && a.variantId && b.variantId &&
      normalizeProductIdentifier(a.variantId)!==normalizeProductIdentifier(b.variantId)) conflicts.push('variant');
  for(const key of ['color','colour','size','capacity']){
    const get=(v:ProductIdentityInput)=>Object.entries(v.specifications??{}).slice(0,40)
      .find(([name])=>name.toLowerCase()===key)?.[1];
    const left=normalizeProductIdentifier(get(a)),right=normalizeProductIdentifier(get(b));
    if(left && right && left!==right) conflicts.push(`variant:${key}`);
  }
  return {matches,conflicts,compatible:conflicts.length===0};
}
