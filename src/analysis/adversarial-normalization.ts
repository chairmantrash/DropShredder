const HOMOGLYPHS:Record<string,string>={
  '０':'0','１':'1','２':'2','３':'3','４':'4','５':'5','６':'6','７':'7','８':'8','９':'9',
  'Ａ':'a','Ｂ':'b','Ｃ':'c','Ｄ':'d','Ｅ':'e','Ｆ':'f','Ｇ':'g','Ｈ':'h','Ｉ':'i','Ｊ':'j','Ｋ':'k','Ｌ':'l','Ｍ':'m',
  'Ｎ':'n','Ｏ':'o','Ｐ':'p','Ｑ':'q','Ｒ':'r','Ｓ':'s','Ｔ':'t','Ｕ':'u','Ｖ':'v','Ｗ':'w','Ｘ':'x','Ｙ':'y','Ｚ':'z'
};

export function normalizeAdversarialText(value:string):string{
  const unicode=value.normalize('NFKC');
  let mapped='';
  for(const char of unicode) mapped+=HOMOGLYPHS[char] ?? char;
  return mapped
    .toLowerCase()
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g,'')
    .replace(/[‐‑‒–—―]/g,'-')
    .replace(/[^\p{L}\p{N}%$€£¥.+-]+/gu,' ')
    .replace(/\s+/g,' ')
    .trim();
}

export function normalizeIdentifier(value:string|undefined):string|undefined{
  if(!value) return undefined;
  const normalized=normalizeAdversarialText(value).replace(/[^a-z0-9]/g,'');
  return normalized||undefined;
}
