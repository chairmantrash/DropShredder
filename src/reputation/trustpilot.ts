import type { ReputationObservation } from './complaint-analysis';

function htmlToText(html:string):string{
  return html
    .replace(/<script\b[^>]*>[\s\S]*?(?:<\/script\b[^>]*>|$)/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?(?:<\/style\b[^>]*>|$)/gi,' ')
    .replace(/<[^>]+>/g,' ')
    // Decode one original entity per match. Chained replacements would
    // reinterpret &amp;quot; as a quote instead of its literal &quot; text.
    .replace(/&(?:nbsp|amp|apos|quot|lt|gt|#\d+|#x[a-f0-9]+);/gi,entity=>{
      const key=entity.slice(1,-1).toLowerCase();
      const named:Record<string,string>={nbsp:' ',amp:'&',apos:"'",quot:'"',lt:'<',gt:'>'};
      if(!key.startsWith('#'))return named[key]??entity;
      const code=key.startsWith('#x')?parseInt(key.slice(2),16):Number(key.slice(1));
      return code>0&&code<=0x10ffff&&(code<0xd800||code>0xdfff)?String.fromCodePoint(code):'\ufffd';
    })
    .replace(/\s+/g,' ')
    .trim();
}

function numberValue(raw:string|undefined):number|undefined{
  if(!raw) return undefined;
  const value=Number(raw.replace(/,/g,''));
  return Number.isFinite(value)?value:undefined;
}

const COMPLAINT_TERMS=[
  'poor quality','cheap quality','flimsy','ripped','fell apart','fall apart','broken','refund',
  'return','never received','never recieved','not received','not recieved','unreachable',
  'wrong item','not as described','awful','junk','fake tracking','counterfeit'
];

export function parseTrustpilotHtml(html:string,url:string):ReputationObservation|undefined{
  const text=htmlToText(html);
  if(!/Trustpilot|TrustScore/i.test(text)) return undefined;

  const rating=numberValue(
    text.match(/(?:TrustScore\s+)?([0-5](?:\.\d)?)\s+(?:out of 5|Average)/i)?.[1]
    ?? text.match(/\b([0-5](?:\.\d)?)\s+\d[\d,]*\s+reviews\b/i)?.[1]
  );
  const reviewCount=numberValue(
    text.match(/\b(\d[\d,]*)\s+reviews\b/i)?.[1]
    ?? text.match(/All reviews\s*\((\d[\d,]*)\)/i)?.[1]
  );
  const oneStar=numberValue(text.match(/1-star\s*(\d{1,3})%/i)?.[1]);
  const negativeShare=typeof oneStar==='number'?Math.min(1,oneStar/100):undefined;

  const sentences=text.split(/(?<=[.!?])\s+/);
  const snippets=sentences
    .filter(sentence=>COMPLAINT_TERMS.some(term=>sentence.toLowerCase().includes(term)))
    .map(sentence=>sentence.slice(0,320))
    .filter((value,index,array)=>array.indexOf(value)===index)
    .slice(0,8);

  if(rating===undefined && reviewCount===undefined && negativeShare===undefined && !snippets.length) return undefined;

  return {
    source:'Trustpilot',
    rating,
    reviewCount,
    negativeShare,
    snippets,
    url,
  };
}
