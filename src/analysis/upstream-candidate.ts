import type { EvidenceSignal } from '../types/evidence';

export interface UpstreamCandidate {
  sourceUrl:string;
  sourceDomain:string;
  observedAt:string;
  identifiersMatched?:string[];
  imageMatch?:'exact'|'near';
  technicalSimilarity?:number;
  sourceType?:'manufacturer'|'wholesale'|'marketplace'|'retailer'|'unknown';
}

export function upstreamCandidateEvidence(candidate:UpstreamCandidate,currentCapturedAt:string):EvidenceSignal[] {
  const older=Date.parse(candidate.observedAt)<Date.parse(currentCapturedAt);
  const idCount=candidate.identifiersMatched?.length ?? 0;
  const invariantStrong=(candidate.technicalSimilarity ?? 0)>=.82;
  const exactImage=candidate.imageMatch==='exact';

  if(!older) return [{
    id:'UPSTREAM_CANDIDATE_NONCHRONOLOGICAL',
    family:'provenance',severity:'info',confidence:.7,weight:0,
    title:'Possible related listing found',
    explanation:'A related listing was found, but it is not known to predate the current listing. It cannot establish upstream provenance.',
    observedValue:candidate.sourceDomain,
    independentKey:`candidate:${candidate.sourceDomain}`,
  }];

  if(idCount>=1 && (exactImage || invariantStrong)){
    return [{
      id:'OLDER_UPSTREAM_IDENTIFIER_MATCH',
      family:'provenance',severity:'strong',confidence:.9,weight:24,
      title:'Older upstream listing matches stable product identifiers',
      explanation:'An older listing matches at least one stable identifier plus independent product evidence. This is strong provenance evidence, though OEM/private-label relationships can still be legitimate.',
      observedValue:`${candidate.sourceDomain} • identifiers ${candidate.identifiersMatched?.join(', ')}`,
      independentKey:'upstream-identifier-match',
    }];
  }

  if(exactImage && invariantStrong){
    return [{
      id:'OLDER_UPSTREAM_IMAGE_INVARIANT_MATCH',
      family:'provenance',severity:'strong',confidence:.86,weight:22,
      title:'Older listing matches image and technical invariants',
      explanation:'An older listing matches both imagery and technical product invariants. This is substantially stronger than an image match alone but still does not prove deception by itself.',
      observedValue:candidate.sourceDomain,
      independentKey:'upstream-image-invariant',
    }];
  }

  return [{
    id:'OLDER_RELATED_LISTING',
    family:'provenance',severity:'moderate',confidence:.7,weight:10,
    title:'Older related listing found',
    explanation:'A related product listing predates the current listing. Additional identifier, image, manufacturer, or specification evidence is needed before treating it as strong provenance evidence.',
    observedValue:candidate.sourceDomain,
    independentKey:'upstream-related-listing',
  }];
}
