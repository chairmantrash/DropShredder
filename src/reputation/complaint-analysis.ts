import type { EvidenceSignal } from '../types/evidence';

export interface ReputationObservation {
  source:string;
  rating?:number;
  reviewCount?:number;
  complaintCount?:number;
  negativeShare?:number;
  snippets?:string[];
  url:string;
}

const DROPSHIP_COMPLAINT_TERMS=[
  'dropship','drop ship','aliexpress','temu','cheap quality','poor quality','not as described',
  'never arrived','shipping delay','refund','return refused','customer service','wrong item',
  'fake tracking','tracking never updated','different product','counterfeit'
];

function complaintTermHits(text:string):number{
  const normalized=text.toLowerCase();
  return DROPSHIP_COMPLAINT_TERMS.filter(term=>normalized.includes(term)).length;
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
  // Multiple pages on one review platform count as one source, not
  // independent corroboration. Prefer the observation with more reviews.
  const perSource=new Map<string,ReputationObservation>();
  for(const observation of observations){
    const key=observation.source.trim().toLowerCase();
    if(!key) continue;
    const old=perSource.get(key);
    if(!old || (observation.reviewCount ?? 0)>(old.reviewCount ?? 0)){
      perSource.set(key,observation);
    }
  }
  const negativeSources=[...perSource.values()].filter(obs=>{
    const text=(obs.snippets ?? []).join(' ');
    const termHits=complaintTermHits(text);
    return (typeof obs.rating==='number' && obs.reviewCount && obs.reviewCount>=20 && obs.rating<=2.5)
      || (typeof obs.negativeShare==='number' && obs.reviewCount && obs.reviewCount>=30 && obs.negativeShare>=.20)
      || (typeof obs.complaintCount==='number' && obs.complaintCount>=10)
      || (termHits>=3 && (obs.snippets?.length ?? 0)>=3);
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
      independentKey:`reputation:${source.source}`,
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
    });
  }

  return out;
}
