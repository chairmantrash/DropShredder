import type { EvidenceSignal } from '../types/evidence';
import type { ReputationObservation } from '../reputation/complaint-analysis';

const QUALITY_CLAIMS=[
  /\bhigh[- ]quality\b/i,
  /\bpremium(?:\s+quality)?\b/i,
  /\bsuperior\s+(?:quality|craftsmanship)\b/i,
  /\bexceptional\s+(?:quality|craftsmanship)\b/i,
  /\bmade\s+to\s+last\b/i,
  /\bbuilt\s+to\s+last\b/i,
  /\bdurable\b/i,
  /\bfinest\s+(?:materials?|quality)\b/i,
  /\bhandcrafted\b/i,
  /\bartisan[- ]made\b/i,
];

const QUALITY_COMPLAINTS=[
  'poor quality','cheap quality','flimsy','ripped','rip after','fell apart','fall apart',
  'broken seam','broken elastic','fray','frayed','junk','awful material','cheap material',
  'not the quality','quality is so-so','stitching'
];

function claimMatch(text:string):string|undefined{
  for(const pattern of QUALITY_CLAIMS){
    const match=text.match(pattern);
    if(match?.[0]) return match[0];
  }
  return undefined;
}

export function qualityClaimEvidence(
  merchantText:string,
  observations:ReputationObservation[],
):EvidenceSignal[]{
  const claim=claimMatch(merchantText);
  if(!claim) return [];

  const complaintSnippets=observations
    .flatMap(obs=>obs.snippets ?? [])
    .filter(snippet=>QUALITY_COMPLAINTS.some(term=>snippet.toLowerCase().includes(term)))
    .filter((value,index,array)=>array.indexOf(value)===index);

  const substantialVolume=observations.some(obs=>(obs.reviewCount ?? 0)>=20);
  if(complaintSnippets.length<2 || !substantialVolume) return [];

  return [{
    id:'QUALITY_MARKETING_CONFLICT',
    family:'claims',
    severity:complaintSnippets.length>=4?'strong':'moderate',
    confidence:complaintSnippets.length>=4?.84:.74,
    weight:complaintSnippets.length>=4?20:12,
    title:'Buyers push back on the premium-quality pitch',
    explanation:'The store calls the product premium, durable or well-made, but outside reviews repeatedly complain about materials, construction or durability. Reviews are subjective, so treat this as a reason to question the sales pitch—not proof of fraud.',
    observedValue:`Merchant claim: “${claim}” • Complaints: ${complaintSnippets.slice(0,3).map(s=>`“${s.slice(0,160)}”`).join(' • ')}`,
    independentKey:'quality-marketing-conflict',
  }];
}
