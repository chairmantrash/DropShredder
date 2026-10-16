import {commerceText,localizedNegation} from '../languages/commerce-text';
export type ClaimKind=
  | 'business-age'
  | 'handmade'
  | 'original-design'
  | 'made-in'
  | 'ships-from'
  | 'manufacturer'
  | 'scarcity'
  | 'customer-count';

export interface ExtractedClaim {
  kind:ClaimKind;
  text:string;
  normalizedValue?:string;
  confidence:number;
}

interface Pattern {
  kind:ClaimKind;
  regex:RegExp;
  value?:(match:RegExpMatchArray)=>string|undefined;
}

const PATTERNS:Pattern[]=[
  {kind:'made-in',regex:/\b(China|United States|India|Bangladesh|France|Brazil|Portugal|Spain)\s+made in\b/i,value:m=>m[1]},
  {kind:'ships-from',regex:/\b(China|United States|India|Bangladesh|France|Brazil|Portugal|Spain)\s+ships from\b/i,value:m=>m[1]},
  {kind:'business-age',regex:/\b(?:since|est(?:ablished)?\.?\s*)(19\d{2}|20\d{2})\b/i,value:m=>m[1]},
  {kind:'handmade',regex:/\b(?:handmade|handcrafted|crafted\s+by\s+(?:us|me|our\s+team)|made\s+by\s+(?:us|me))\b/i},
  {kind:'original-design',regex:/\b(?:designed\s+by\s+us|our\s+original\s+design|designed\s+in-house|proprietary\s+design)\b/i},
  {kind:'made-in',regex:/\bmade\s+in\s+([a-z][a-z .'-]{2,40})\b/i,value:m=>m[1]?.trim()},
  {kind:'ships-from',regex:/\b(?:ships?|shipping|fulfilled)\s+(?:directly\s+)?from\s+([a-z][a-z .,'-]{2,60})\b/i,value:m=>m[1]?.trim()},
  {kind:'manufacturer',regex:/\b(?:manufactured|made)\s+by\s+([a-z0-9][a-z0-9 &.'-]{2,60})\b/i,value:m=>m[1]?.trim()},
  {kind:'scarcity',regex:/\b(?:only\s+\d+\s+(?:left|remaining)|sale\s+ends\s+(?:today|tonight)|limited\s+time)\b/i},
  {kind:'customer-count',regex:/\b(?:over\s+)?([\d,.]+)\+?\s+(?:happy\s+)?customers\b/i,value:m=>m[1]?.replace(/,/g,'')},
];

export function extractClaims(pageText:string):ExtractedClaim[] {
  const out:ExtractedClaim[]=[];
  const matching=commerceText(pageText);
  for(const pattern of PATTERNS){
    const hit=matching.match(pattern.regex);
    const match=hit?.canonical;
    if(!match||out.some(c=>c.kind===pattern.kind)) continue;
    const context=matching.original(Math.max(0,match.index-25),match[0].length+55);
    const clause=context.split(/[.;!?。！？।]/).find(part=>part.includes(hit!.original))??hit!.original;
    if(pattern.kind!=='scarcity'&&localizedNegation(clause)) continue;
    out.push({
      kind:pattern.kind,
      text:hit!.original.slice(0,220),
      normalizedValue:pattern.value?.(match),
      confidence:pattern.kind==='made-in' || pattern.kind==='ships-from' ? .7 : .82,
    });
  }
  return out;
}
