import {reviewDateMillis} from '../languages/commerce-date';
import {canonicalCommerceText,commerceTokens} from '../languages/commerce-text';
import type { ReviewSnapshot } from '../types/review';
export const REVIEW_MISMATCH_TERMS=[
  'necklace','bracelet','earrings','handbag','purse','phone case','shirt','shoes',
  'lamp','charger','vacuum','blender','dress','jacket','ring','watch',
] as const;

export const REVIEW_INCENTIVE_PATTERNS=[
  /free\s+(?:product|item|sample)/i,
  /received\s+(?:this|the\s+product)\s+(?:for\s+free|at\s+a\s+discount)/i,
  /discount\s+(?:code|in\s+exchange)/i,
  /in\s+exchange\s+for\s+(?:my\s+)?(?:honest\s+)?review/i,
] as const;

export function normalizeReviewText(text:string):string {
  return canonicalCommerceText(text,5000).toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
}

export function reviewTokenSet(text:string):Set<string> {
  return new Set(commerceTokens(text).filter(token=>token.length>=4||/\p{Script=Han}/u.test(token)));
}

export function reviewTextSimilarity(a:string,b:string):number {
  const left=reviewTokenSet(a),right=reviewTokenSet(b);
  if(left.size<4||right.size<4) return 0;
  let intersection=0;
  for(const token of left) if(right.has(token)) intersection++;
  return intersection/(left.size+right.size-intersection);
}

export function reviewMentionsMismatchedCategory(productTitle:string|undefined,text:string):string|undefined {
  const title=normalizeReviewText(productTitle??'');
  if(!title) return undefined;
  const normalized=normalizeReviewText(text);
  return REVIEW_MISMATCH_TERMS.find(term=>!title.includes(term)&&normalized.includes(term));
}

export function reviewHasIncentiveLanguage(text:string):boolean {
  return REVIEW_INCENTIVE_PATTERNS.some(pattern=>pattern.test(canonicalCommerceText(text,5000)));
}


export function reviewDuplicatePairs(reviews:readonly ReviewSnapshot[],limit=80):{pairs:number;ratio:number}{
  const bounded=reviews.slice(0,limit);
  let pairs=0;
  let eligible=0;
  for(let i=0;i<bounded.length;i++){
    for(let j=i+1;j<bounded.length;j++){
      const left=bounded[i]?.body ?? '',right=bounded[j]?.body ?? '';
      if(reviewTokenSet(left).size<4||reviewTokenSet(right).size<4) continue;
      eligible++;
      if(reviewTextSimilarity(left,right)>=.72) pairs++;
    }
  }
  return {pairs,ratio:eligible?pairs/eligible:0};
}

export function reviewMaxWindowShare(reviews:readonly ReviewSnapshot[],days:number):number {
  const dates=reviews
    .map(review=>review.date?reviewDateMillis(review.date):NaN)
    .filter(Number.isFinite)
    .sort((a,b)=>a-b);
  if(dates.length<5) return 0;
  const windowMs=days*86400000;
  let max=0,end=0;
  for(let start=0;start<dates.length;start++){
    if(end<start) end=start;
    while(end<dates.length&&dates[end]!-dates[start]!<=windowMs) end++;
    max=Math.max(max,end-start);
  }
  return max/dates.length;
}
