import type { EvidenceSignal } from '../types/evidence';
import { reputationSourceKey, validatedReputationObservations, type ReputationObservation } from './complaint-analysis';

export interface HostedReviewSummary {
  rating?:number;
  reviewCount?:number;
  source:string;
  scope?:'merchant'|'product';
  subjectId?:string;
}

export function reviewDiscrepancyEvidence(
  hosted:HostedReviewSummary|undefined,
  external:ReputationObservation|undefined,
):EvidenceSignal[]{
  if(!hosted || typeof hosted.rating!=='number' || typeof external?.rating!=='number') return [];
  external=validatedReputationObservations([external])[0];
  if(external?.rating===undefined || !Number.isFinite(hosted.rating) || hosted.rating<0 || hosted.rating>5 || !Number.isInteger(hosted.reviewCount)) return [];
  if((hosted.reviewCount ?? 0)<20 || (external.reviewCount ?? 0)<20) return [];

  const gap=hosted.rating-external.rating;
  if(gap<.9) return [];

  const comparable=Boolean(hosted.scope && hosted.scope===external.scope && hosted.subjectId && hosted.subjectId===external.subjectId);
  return [{
    id:'REVIEW_SOURCE_RATING_GAP',
    family:'reviews',
    severity:comparable?(gap>=1.5?'strong':'moderate'):'info',
    confidence:gap>=1.5?.86:.76,
    weight:comparable?(gap>=1.5?18:10):0,
    title:comparable?'The store’s rating looks much better than outside reviews':'Rating gap uses different or unresolved review populations',
    explanation:'Product reviews and merchant-service reviews can describe different things. Unless subject and scope match, this comparison is informational only. The rating shown on the store is much higher than the rating on an outside review source. That does not prove anyone manipulated reviews, but you should read the outside complaints before trusting the number on the sales page.',
    observedValue:`${hosted.source}: ${hosted.rating}/5 (${hosted.reviewCount} reviews) • ${external.source}: ${external.rating}/5 (${external.reviewCount} reviews)`,
    independentKey:'review-source-rating-gap',
    correlationKeys:['reputation:'+reputationSourceKey(external)],
  }];
}
