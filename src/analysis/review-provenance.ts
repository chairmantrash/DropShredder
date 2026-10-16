import {reviewDateMillis} from '../languages/commerce-date';
import type { EvidenceSignal } from '../types/evidence';
import type { ReviewAnalysisInput, ReviewSnapshot } from '../types/review';
import { reviewDuplicatePairs, reviewHasIncentiveLanguage, reviewMaxWindowShare, reviewMentionsMismatchedCategory } from './review-primitives';

function wrongProductHints(input:ReviewAnalysisInput): {count:number;category?:string} {
  const counts=new Map<string,number>();
  for(const review of input.reviews){
    const category=reviewMentionsMismatchedCategory(input.productTitle,(review.title ?? '')+' '+review.body);
    if(category) counts.set(category,(counts.get(category) ?? 0)+1);
  }
  const top=[...counts.entries()].sort((left,right)=>right[1]-left[1])[0];
  return top ? {category:top[0],count:top[1]} : {count:0};
}

export function analyzeReviewProvenance(input:ReviewAnalysisInput): EvidenceSignal[] {
  const out:EvidenceSignal[]=[];
  const reviews=input.reviews.filter(r=>r.body?.trim());
  if(reviews.length<5) return out;

  const verifiedKnown=reviews.filter(r=>typeof r.verified==='boolean');
  if(verifiedKnown.length>=10){
    const verified=verifiedKnown.filter(r=>r.verified).length;
    const ratio=verified/verifiedKnown.length;
    if(ratio<0.25){
      out.push({
        id:'LOW_VERIFIED_PURCHASE_SHARE',family:'reviews',severity:'moderate',confidence:.62,weight:8,
        title:'Few visible reviews are marked as verified purchases',
        explanation:'Only a small share of the visible reviews are marked as verified purchases. That can happen legitimately, so it matters only if other review patterns look off too.',
        observedValue:`${verified}/${verifiedKnown.length} visible reviews marked verified`,
        independentKey:'reviews-verified-share',
      });
    }
  }

  const burst3=reviewMaxWindowShare(reviews,3);
  const burst7=reviewMaxWindowShare(reviews,7);
  if(reviews.length>=12 && (burst3>=0.35 || burst7>=0.55)){
    out.push({
      id:'REVIEW_DATE_BURST',family:'reviews',severity:'moderate',confidence:.72,weight:11,
      title:'A lot of reviews landed at nearly the same time',
      explanation:'Many visible reviews arrived in a short burst. Product launches and promotions can cause that naturally, so timing alone is not enough to call the reviews suspicious.',
      observedValue:`3-day share ${Math.round(burst3*100)}%; 7-day share ${Math.round(burst7*100)}%`,
      independentKey:'reviews-date-burst',
    });
  }

  const dup=reviewDuplicatePairs(reviews,80);
  if(dup.pairs>=2 && dup.ratio>=0.025){
    out.push({
      id:'REVIEW_TEXT_DUPLICATION',family:'reviews',severity:dup.ratio>=0.08?'strong':'moderate',
      confidence:dup.ratio>=0.08?.88:.72,weight:dup.ratio>=0.08?19:10,
      title:'Some reviews sound unusually alike',
      explanation:'Several visible reviews use unusually similar wording. Templates, syndicated reviews or copied text could explain it, so look for another warning before making the call.',
      observedValue:`${dup.pairs} high-similarity review pair(s)`,
      independentKey:'reviews-text-duplication',
    });
  }

  if(input.listingCreatedAt){
    const listingTime=Date.parse(input.listingCreatedAt);
    const predating=reviews.filter(r=>r.date && reviewDateMillis(r.date)<listingTime-86400000).length;
    if(Number.isFinite(listingTime) && predating>=2){
      out.push({
        id:'REVIEWS_PREDATE_LISTING',family:'reviews',severity:'strong',confidence:.86,weight:22,
        title:'Some reviews are older than the listing itself',
        explanation:'Some visible reviews appear to be older than this listing. Stores can legitimately migrate or combine reviews, but this is worth checking before trusting the rating at face value.',
        observedValue:`${predating} visible review(s) predate the listing`,
        independentKey:'reviews-predate-listing',
      });
    }
  }

  const mismatch=wrongProductHints(input);
  if(mismatch.count>=2){
    out.push({
      id:'REVIEW_PRODUCT_MISMATCH',family:'reviews',severity:'strong',confidence:.82,weight:21,
      title:'Some reviews seem to be talking about another product',
      explanation:'Several visible reviews repeatedly talk about a different kind of product. The store may have merged variants or migrated old reviews, but you should not assume those reviews describe what is being sold now.',
      observedValue:`${mismatch.count} review(s) mention ${mismatch.category}`,
      independentKey:'reviews-product-mismatch',
    });
  }

  if(reviews.length>=15){
    const rated=reviews.filter(r=>typeof r.rating==='number');
    if(rated.length>=15){
      const fiveStar=rated.filter(r=>(r.rating ?? 0)>=4.8).length/rated.length;
      if(fiveStar>=.9){
        out.push({
          id:'EXTREME_FIVE_STAR_CONCENTRATION',family:'reviews',severity:'weak',confidence:.58,weight:4,
          title:'Almost every visible rating is five stars',
          explanation:'Great products can earn great ratings. But when almost every visible review is five stars, it is worth comparing with reviews somewhere the store does not control.',
          observedValue:`${Math.round(fiveStar*100)}% of visible rated reviews are approximately five-star`,
          independentKey:'reviews-rating-concentration',
        });
      }
    }
  }

  const incentivized=reviews.filter(review=>reviewHasIncentiveLanguage(review.body)).length;
  if(incentivized>=2){
    out.push({
      id:'INCENTIVIZED_REVIEW_LANGUAGE',family:'reviews',severity:'moderate',confidence:.78,weight:9,
      title:'Several reviewers say they got something for the review',
      explanation:'Several visible reviews mention a free item, discount or other incentive. Properly disclosed incentives can be legitimate, but those reviews may not reflect an ordinary buyer’s experience.',
      observedValue:`${incentivized} visible review(s) contain incentive language`,
      independentKey:'reviews-incentive-language',
    });
  }

  return out;
}
