import type { ReputationObservation } from './complaint-analysis';

function htmlToText(html:string):string{
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&nbsp;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&quot;/gi,'"')
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

const CACHE_MS=30*60*1000;

export async function fetchTrustpilotObservation(domain:string):Promise<ReputationObservation|undefined>{
  const normalized=domain.toLowerCase().replace(/^www\./,'');
  const cacheKey=`trustpilot:${normalized}`;
  try{
    const cached=(await chrome.storage.session.get(cacheKey))[cacheKey] as {at:number;value:ReputationObservation|undefined}|undefined;
    if(cached && Date.now()-cached.at<CACHE_MS) return cached.value;
  }catch{}

  const host='https://www.trustpilot.com/*';
  const granted=await chrome.permissions.contains({origins:[host]})
    || await chrome.permissions.request({origins:[host]});
  if(!granted) return undefined;

  const url=`https://www.trustpilot.com/review/${encodeURIComponent(normalized)}`;
  const response=await fetch(url,{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(5000)});
  if(response.status===404){
    try{await chrome.storage.session.set({[cacheKey]:{at:Date.now(),value:undefined}});}catch{}
    return undefined;
  }
  if(!response.ok) throw new Error(`Trustpilot lookup failed: HTTP ${response.status}`);
  const length=Number(response.headers.get('content-length') || 0);
  if(length>5_000_000) throw new Error('Trustpilot response exceeded the safety limit.');
  const html=await response.text();
  if(html.length>5_000_000) throw new Error('Trustpilot response exceeded the safety limit.');
  const value=parseTrustpilotHtml(html,url);
  try{await chrome.storage.session.set({[cacheKey]:{at:Date.now(),value}});}catch{}
  return value;
}
