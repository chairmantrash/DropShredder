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

export function analyzeReputationObservations(observations:ReputationObservation[]):EvidenceSignal[]{
  const out:EvidenceSignal[]=[];
  const negativeSources=observations.filter(obs=>{
    const text=(obs.snippets ?? []).join(' ');
    const termHits=complaintTermHits(text);
    return (typeof obs.rating==='number' && obs.reviewCount && obs.reviewCount>=20 && obs.rating<=2.5)
      || (typeof obs.negativeShare==='number' && obs.reviewCount && obs.reviewCount>=20 && obs.negativeShare>=.45)
      || (typeof obs.complaintCount==='number' && obs.complaintCount>=10)
      || termHits>=3;
  });

  if(negativeSources.length===1){
    const source=negativeSources[0]!;
    out.push({
      id:'PUBLIC_REPUTATION_CONCERNS',
      family:'merchant',
      severity:'moderate',
      confidence:.68,
      weight:8,
      title:'Public reputation source shows substantial complaints',
      explanation:'One independent public review/complaint source shows a notable concentration of negative feedback. Review platforms can be incomplete or biased, so one source is corroborative rather than conclusive.',
      observedValue:source.source,
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
      title:'Multiple independent reputation sources show substantial complaints',
      explanation:'Two or more public review/complaint sources independently show elevated negative feedback. This is a merchant-quality/risk signal and does not by itself prove dropshipping or provenance deception.',
      observedValue:negativeSources.map(s=>s.source).join(', '),
      independentKey:'reputation:multi-source',
    });
  }

  return out;
}
