import {canonicalCommerceText,commerceTokens} from '../languages/commerce-text';
import { normalizeGtin, normalizeProductIdentifier } from '../analysis/product-identity';

const MARKETING_STOPWORDS=new Set([
  'premium','luxury','ultimate','revolutionary','exclusive','amazing','best','perfect','new',
  'improved','professional','innovative','advanced','stylish','beautiful','high','quality',
  'must','have','viral','trending','hot','sale','special','original','authentic'
]);

const UNIT_PATTERN=/\b\d+(?:\.\d+)?\s?(?:mah|wh|w|kw|v|mah|ml|l|oz|fl\s?oz|g|kg|lb|lbs|mm|cm|m|in|inch|inches|ft|hz|khz|mhz|ghz|°c|°f|k)\b/gi;
const MODEL_PATTERN=/\b(?=[a-z0-9-]{5,}\b)(?=[a-z0-9-]*\d)(?=[a-z0-9-]*[a-z])[a-z0-9]+(?:-[a-z0-9]+)+\b/gi;
const MATERIALS=[
  'aluminum','aluminium','stainless steel','steel','silicone','silicon','plastic','abs',
  'polycarbonate','polyester','cotton','leather','nylon','glass','ceramic','wood','bamboo',
  'copper','brass','titanium','rubber'
];

function normalizeText(value:string):string {
  return canonicalCommerceText(value,10000)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[×x]/g,'x')
    .replace(/[^\p{L}\p{M}\p{N}.°+\-\s]/gu,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function unique(values:string[]):string[] {
  return [...new Set(values.map(v=>normalizeText(v)).filter(Boolean))];
}

export interface ProductFingerprintInput {
  title?:string;
  description?:string;
  brand?:string;
  sku?:string;
  mpn?:string;
  gtin?:string;
  asin?:string;
  specifications?:Record<string,string>;
}

export interface ProductFingerprint {
  identifiers:string[];
  units:string[];
  materials:string[];
  technicalTokens:string[];
  canonical:string;
}

export function buildProductFingerprint(input:ProductFingerprintInput):ProductFingerprint {
  const specText=Object.entries(input.specifications ?? {})
    .flatMap(([k,v])=>[k,v])
    .join(' ');
  const source=normalizeText([input.title,input.description,specText].filter(Boolean).join(' '));

  const identifiers=unique([input.asin ?? '',input.gtin ?? '',input.mpn ?? '',input.sku ?? '',...(source.match(MODEL_PATTERN) ?? [])]);
  const units=unique(source.match(UNIT_PATTERN) ?? []);
  const materials=unique(MATERIALS.filter(material=>source.includes(material)));

  const technicalTokens=unique(
    source.split(' ')
      .filter(token=>token.length>=3)
      .filter(token=>!MARKETING_STOPWORDS.has(token))
      .filter(token=>/\d/.test(token) || units.includes(token) || materials.includes(token))
  );

  const canonical=[...identifiers,...units,...materials,...technicalTokens]
    .sort()
    .join('|');

  return {identifiers,units,materials,technicalTokens,canonical};
}

export function fingerprintSimilarity(a:ProductFingerprint,b:ProductFingerprint):number {
  const left=new Set(a.canonical.split('|').filter(Boolean));
  const right=new Set(b.canonical.split('|').filter(Boolean));
  if(!left.size || !right.size) return 0;
  let common=0;
  for(const token of left) if(right.has(token)) common++;
  return common/(left.size+right.size-common);
}


export interface ExactProductFingerprintInput {
  gtin?:string;
  brand?:string;
  mpn?:string;
  sku?:string;
  variantId?:string;
  title?:string;
  specs?:Record<string,string|number>;
  imageHashes?:string[];
}

export interface ExactProductFingerprint {
  gtin?:string;
  brand?:string;
  mpn?:string;
  sku?:string;
  variantId?:string;
  titleTokens:string[];
  specTokens:string[];
  imageHashes:string[];
}

const normalizeExactText=(value:string|undefined)=>
  value?.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu,' ').trim()||undefined;
const normalizeExactIdentifier=normalizeProductIdentifier;

export function buildExactProductFingerprint(input:ExactProductFingerprintInput):ExactProductFingerprint {
  const titleTokens=[...new Set(commerceTokens(input.title??'').filter(token=>token.length>=3||/\p{Script=Han}/u.test(token)))].sort().slice(0,40);
  const specTokens=Object.entries(input.specs??{})
    .map(([key,value])=>`${normalizeExactText(canonicalCommerceText(key,200))}=${normalizeExactText(String(value))}`)
    .filter(Boolean)
    .sort()
    .slice(0,50);
  return {
    gtin:normalizeGtin(input.gtin),
    brand:normalizeProductIdentifier(input.brand),
    mpn:normalizeProductIdentifier(input.mpn),
    sku:normalizeExactIdentifier(input.sku),
    variantId:normalizeExactIdentifier(input.variantId),
    titleTokens,
    specTokens,
    imageHashes:[...new Set(input.imageHashes??[])].sort().slice(0,12),
  };
}

export function compareExactProductFingerprints(a:ExactProductFingerprint,b:ExactProductFingerprint){
  const reasons:string[]=[];
  const conflicts:string[]=[];
  if(a.gtin && b.gtin && a.gtin!==b.gtin) conflicts.push('Different GTINs');
  if(a.brand && b.brand && a.brand===b.brand && a.mpn && b.mpn && a.mpn!==b.mpn) conflicts.push('Different model numbers');
  for(const key of ['color','colour','size','capacity']){
    const value=(v:ExactProductFingerprint)=>v.specTokens.find(token=>token.startsWith(key+'='));
    if(value(a) && value(b) && value(a)!==value(b)) conflicts.push(`Different ${key}`);
  }
  if(conflicts.length) return {score:0,reasons:conflicts,exactIdentity:false,conflicts};
  let score=0;
  if(a.gtin&&b.gtin&&a.gtin===b.gtin){
    score=1;
    reasons.push('Same GTIN');
  }else{
    if(a.brand&&b.brand&&a.brand===b.brand&&a.mpn&&b.mpn&&a.mpn===b.mpn){
      score+=.72;
      reasons.push('Same brand and model number');
    }
    const images=a.imageHashes.filter(hash=>b.imageHashes.includes(hash)).length;
    if(images){
      score+=Math.min(.5,images*.25);
      reasons.push('Same product image');
    }
    const specs=a.specTokens.filter(token=>b.specTokens.includes(token)).length;
    if(specs>=3){
      score+=Math.min(.35,specs*.06);
      reasons.push('Matching product details');
    }
    const title=a.titleTokens.filter(token=>b.titleTokens.includes(token)).length;
    const denominator=Math.max(1,new Set([...a.titleTokens,...b.titleTokens]).size);
    if(title/denominator>=.55){
      score+=.18;
      reasons.push('Very similar product name');
    }
  }
  return {score:Math.min(1,score),reasons,exactIdentity:Boolean(a.gtin&&b.gtin&&a.gtin===b.gtin),conflicts};
}
