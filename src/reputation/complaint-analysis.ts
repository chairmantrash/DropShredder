import type { EvidenceSignal } from '../types/evidence';

export interface ReputationObservation {
  source:string;
  scope?:'merchant'|'product';
  subjectId?:string;
  rating?:number;
  reviewCount?:number;
  complaintCount?:number;
  negativeShare?:number;
  snippets?:string[];
  url:string;
}

const COMPLAINT_TERMS=['cheap quality','poor quality','not as described','never arrived','shipping delay','refund refused',
  'refund denied','no refund','return refused','poor customer service','wrong item','fake tracking','tracking never updated','different product','counterfeit'];
export function reputationSourceKey(obs:ReputationObservation):string {
  try{const host=new URL(obs.url).hostname.toLowerCase();
    for(const name of ['trustpilot','sitejabber','consumeraffairs','bbb','reddit'])
      if(host===name+'.com'||host.endsWith('.'+name+'.com')||host===name+'.org'||host.endsWith('.'+name+'.org')) return name;
  }catch{}
  return obs.source.trim().toLowerCase().replace(/[^a-z0-9]+/g,'');
}
export function complaintPhraseHit(text:string,terms=COMPLAINT_TERMS):boolean {
  const normalized=text.slice(0,2000).normalize('NFKC').toLowerCase();
  return terms.some(term=>{
    const at=normalized.indexOf(term);if(at<0) return false;
    return !/\b(?:not|no|never)\s+(?:really\s+)?$/.test(normalized.slice(Math.max(0,at-25),at));
  });
}
export function validatedReputationObservations(input:ReputationObservation[]):ReputationObservation[] {
  const count=(v:number|undefined)=>Number.isInteger(v)&&v!>=0&&v!<=1_000_000_000?v:undefined;
  const out=new Map<string,ReputationObservation>();
  for(const original of input.slice(0,50)){
    const key=reputationSourceKey(original);if(!key) continue;
    const obs={...original,rating:Number.isFinite(original.rating)&&original.rating!>=0&&original.rating!<=5?original.rating:undefined,
      reviewCount:count(original.reviewCount),complaintCount:count(original.complaintCount),
      negativeShare:Number.isFinite(original.negativeShare)&&original.negativeShare!>=0&&original.negativeShare!<=1?original.negativeShare:undefined,
      snippets:[...new Map((original.snippets??[]).slice(0,30).map(v=>{
        const text=v.slice(0,1000).replace(/\s+/g,' ').trim();return [text.normalize('NFKC').toLowerCase(),text];
      })).values()]};
    const old=out.get(key);if(!old||(obs.reviewCount??0)>(old.reviewCount??0)) out.set(key,obs);
  }
  return [...out.values()];
}

function observationSummary(obs:ReputationObservation):string{
  const parts=[
    typeof obs.rating==='number'? `rating ${obs.rating}/5` : undefined,
    typeof obs.reviewCount==='number'? `${obs.reviewCount} reviews` : undefined,
    typeof obs.negativeShare==='number'? `${Math.round(obs.negativeShare*100)}% one-star/negative share` : undefined,
  ].filter(Boolean);
  if(obs.snippets?.length){
    parts.push(...obs.snippets.slice(0,3).map(s=>`“${s.slice(0,180)}”`));
  }
  return parts.join(' • ');
}

export function analyzeReputationObservations(observations:ReputationObservation[]):EvidenceSignal[]{
  const out:EvidenceSignal[]=[];
  const negativeSources=validatedReputationObservations(observations).filter(obs=>{
    const snippets=(obs.snippets??[]).filter(snippet=>complaintPhraseHit(snippet));
    return (obs.rating!==undefined && (obs.reviewCount??0)>=20 && obs.rating<=2.5)
      || (obs.negativeShare!==undefined && (obs.reviewCount??0)>=30 && obs.negativeShare>=.20)
      || (obs.complaintCount!==undefined && obs.complaintCount>=10)
      || snippets.length>=3;
  });

  if(negativeSources.length===1){
    const source=negativeSources[0]!;
    out.push({
      id:'PUBLIC_REPUTATION_CONCERNS',
      family:'merchant',
      severity:'moderate',
      confidence:.68,
      weight:8,
      title:'A lot of buyers are complaining',
      explanation:'One outside review source shows a meaningful pile-up of bad ratings or complaints. Any single review site can be skewed, so check another source before making the call.',
      observedValue:[source.source,observationSummary(source)].filter(Boolean).join(' • '),
      independentKey:`reputation:${reputationSourceKey(source)}`,
      correlationKeys:['reputation:'+reputationSourceKey(source)],
    });
  }

  if(negativeSources.length>=2){
    out.push({
      id:'MULTI_SOURCE_REPUTATION_CONCERNS',
      family:'merchant',
      severity:'strong',
      confidence:.86,
      weight:20,
      title:'Complaints show up in more than one place',
      explanation:'Bad feedback is showing up across more than one outside source. That is a stronger warning about the store, but it still does not prove the product is dropshipped or that the seller lied about where it came from.',
      observedValue:negativeSources.map(s=>`${s.source}: ${observationSummary(s)}`).join(' | '),
      independentKey:'reputation:multi-source',
      correlationKeys:negativeSources.map(source=>'reputation:'+reputationSourceKey(source)),
    });
  }

  return out;
}
