import {COMMERCE_LANGUAGE_KIT} from './commerce-kit';

/** Matching normalization only; never apply to stored identifiers or source quotations. */
export function normalizeCommerceCharacters(value:string):string {
  return value.normalize('NFKC').replace(/[\u061c\u200b\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g,'')
    .replace(/[٠-٩۰-۹०-९০-৯]/g,char=>String(char.charCodeAt(0)-[0x660,0x6f0,0x966,0x9e6].find(start=>char.charCodeAt(0)>=start&&char.charCodeAt(0)<start+10)!));
}
const aliases=new Map<string,string>();
for(const [canonical,...languages] of COMMERCE_LANGUAGE_KIT.phrases){
  for(const alias of languages.flat()){
    const key=normalizeCommerceCharacters(alias).toLowerCase();
    if((key.length>1||/\p{Script=Han}/u.test(key))&&key!==canonical.toLowerCase()) aliases.set(key,canonical);
  }
}
const escape=(value:string)=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const phrasePattern=new RegExp([...aliases.keys()].sort((a,b)=>b.length-a.length).map(escape).join('|'),'giu');
const letterMarkNumber=/[\p{L}\p{M}\p{N}]/u;

export interface CommerceText {
  text:string;
  original:(start:number,length:number)=>string;
  match:(pattern:RegExp)=>{canonical:RegExpExecArray;original:string}|undefined;
}
/** A single vocabulary pass with source spans; rule outputs quote the actual merchant wording. */
export function commerceText(source:string,max=100_000):CommerceText {
  source=source.slice(0,max);
  const normalized:string[]=[],starts:number[]=[],ends:number[]=[];
  for(const {segment:char,index:offset} of new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(source)){
    const part=normalizeCommerceCharacters(char);
    normalized.push(part);
    for(let n=0;n<part.length;n++){starts.push(offset);ends.push(offset+char.length);}
  }
  const input=normalized.join(''),pieces:string[]=[],outStarts:number[]=[],outEnds:number[]=[];
  let cursor=0;
  const append=(start:number,end:number,replacement?:string)=>{
    const text=replacement??input.slice(start,end);pieces.push(text);
    for(let i=0;i<text.length;i++){
      outStarts.push(starts[replacement===undefined?start+i:start]??source.length);
      outEnds.push(ends[replacement===undefined?start+i:end-1]??source.length);
      if(replacement!==undefined&&i===0&&text[i]===' ') outEnds[outEnds.length-1]=starts[start]??source.length;
      if(replacement!==undefined&&i===text.length-1&&text[i]===' ') outStarts[outStarts.length-1]=ends[end-1]??source.length;
    }
  };
  // matchAll clones the compiled regex: calls do not share mutable lastIndex.
  for(const match of input.matchAll(phrasePattern)){
    const start=match.index;
    if(!/\p{Script=Han}/u.test(match[0])&&(letterMarkNumber.test(input[start-1]??'')||letterMarkNumber.test(input[start+match[0].length]??''))) continue;
    append(cursor,start);
    append(start,start+match[0].length,' '+aliases.get(match[0].toLowerCase())+' ');
    cursor=start+match[0].length;
  }
  append(cursor,input.length);
  let text=pieces.join('');
  for(const [pattern,replacement] of COMMERCE_LANGUAGE_KIT.dynamic){
    const chunks:string[]=[],nextStarts:number[]=[],nextEnds:number[]=[];
    let cursor=0,count=0;
    const copy=(start:number,end:number)=>{
      chunks.push(text.slice(start,end));
      for(let i=start;i<end;i++){nextStarts.push(outStarts[i]!);nextEnds.push(outEnds[i]!);}
    };
    for(const hit of text.matchAll(new RegExp(pattern,'giu'))){
      if(count++>=80) break;
      const start=hit.index,end=start+hit[0].length;
      const value=replacement.replace(/\$(\d+)/g,(_,n:string)=>hit[Number(n)]??'');
      copy(cursor,start);chunks.push(value);
      for(let i=0;i<value.length;i++){nextStarts.push(outStarts[start]??0);nextEnds.push(outEnds[end-1]??source.length);}
      cursor=end;
    }
    if(cursor){copy(cursor,text.length);text=chunks.join('');outStarts.length=0;outEnds.length=0;for(let i=0;i<nextStarts.length;i++){outStarts.push(nextStarts[i]!);outEnds.push(nextEnds[i]!);}}
  }
  const original=(start:number,length:number)=>source.slice(outStarts[start]??0,outEnds[Math.min(outEnds.length-1,start+length-1)]??source.length);
  return {text,original,match:(pattern)=>{
    const canonical=new RegExp(pattern.source,pattern.flags.replace('g','')).exec(text);
    return canonical?{canonical,original:original(canonical.index,canonical[0].length)}:undefined;
  }};
}
export function canonicalCommerceText(value:string,max=100_000):string{return commerceText(value,max).text;}

/** Native segmentation retains marks and CJK words; similarity remains lexical, not translation. */
export function commerceTokens(value:string,max=4000):string[]{
  const text=normalizeCommerceCharacters(value.slice(0,max)).toLowerCase();
  const out:string[]=[];
  const segmenter=new Intl.Segmenter(undefined,{granularity:'word'});
  for(const segment of segmenter.segment(text)){
    if(segment.isWordLike&&/[\p{L}\p{N}]/u.test(segment.segment)) out.push(segment.segment);
    if(out.length>=120) break;
  }
  return out;
}
export function localizedPath(value:string):string {
  try{return decodeURIComponent(value).normalize('NFKC').toLowerCase();}catch{return value.toLowerCase();}
}
export function variantKey(value:string):string|undefined {
  const name=value.normalize('NFKC').toLowerCase().replace(/^options\[/,'').replace(/\]$/,'');
  return Object.entries(COMMERCE_LANGUAGE_KIT.variants).find(([key,aliases])=>key===name||aliases.includes(name))?.[0];
}
/** Explicit contextual negation. Do not treat a bare translated negative as affirmative evidence. */
export function localizedNegation(source:string):boolean {
  return /(?:\b(?:not|without|never|no)\b|不(?:收取|支付|承担|是)|无需|没有|नहीं|बिना|নয়|নেই|না(?![\p{L}\p{M}])|\b(?:sin|sans|não)\b|\bne\b.{0,50}\bpas\b|\baucun\b|\bne sera\b|لا\s|ليس|بدون)/iu.test(source);
}
