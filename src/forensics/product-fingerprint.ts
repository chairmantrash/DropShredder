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
  return value
    .toLowerCase()
    .replace(/[×x]/g,'x')
    .replace(/[^a-z0-9.°+\-\s]/g,' ')
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

  const identifiers=unique([input.gtin ?? '',input.mpn ?? '',input.sku ?? '',...(source.match(MODEL_PATTERN) ?? [])]);
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
