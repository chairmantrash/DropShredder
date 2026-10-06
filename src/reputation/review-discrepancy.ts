import type { EvidenceSignal } from '../types/evidence';
import type { ReputationObservation } from './complaint-analysis';

export interface HostedReviewSummary {
  rating?:number;
  reviewCount?:number;
  source:string;
}

export function reviewDiscrepancyEvidence(
  hosted:HostedReviewSummary|undefined,
  external:ReputationObservation|undefined,
):EvidenceSignal[]{
  if(!hosted || typeof hosted.rating!=='number' || typeof external?.rating!=='number') return [];
  if((hosted.reviewCount ?? 0)<20 || (external.reviewCount ?? 0)<20) return [];

  const gap=hosted.rating-external.rating;
  if(gap<.9) return [];

  return [{
    id:'REVIEW_SOURCE_RATING_GAP',
    family:'reviews',
    severity:gap>=1.5?'strong':'moderate',
    confidence:gap>=1.5?.86:.76,
    weight:gap>=1.5?18:10,
    title:'Store-hosted and independent review ratings materially disagree',
    explanation:'The rating shown through the merchant/store review system is substantially higher than an independent review platform. This does not prove review manipulation, but consumers should inspect the independent complaints before relying on the storefront rating.',
    observedValue:`${hosted.source}: ${hosted.rating}/5 (${hosted.reviewCount} reviews) • ${external.source}: ${external.rating}/5 (${external.reviewCount} reviews)`,
    independentKey:'review-source-rating-gap',
  }];
}
