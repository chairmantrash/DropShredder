import type { EvidenceSignal } from '../types/evidence';
import type { ReviewAnalysisInput, ReviewSnapshot } from '../types/review';

function normalize(text:string):string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
}

function tokens(text:string):Set<string> {
  return new Set(normalize(text).split(' ').filter(t=>t.length>=4));
}

function jaccard(a:Set<string>,b:Set<string>):number {
  if(!a.size || !b.size) return 0;
  let intersection=0;
  for(const value of a) if(b.has(value)) intersection++;
  return intersection/(a.size+b.size-intersection);
}

function duplicatePairs(reviews:ReviewSnapshot[]): {pairs:number; ratio:number} {
  let pairs=0;
  let eligible=0;
  for(let i=0;i<reviews.length;i++){
    const a=tokens(reviews[i]?.body ?? '');
    if(a.size<4) continue;
    for(let j=i+1;j<reviews.length;j++){
      const b=tokens(reviews[j]?.body ?? '');
      if(b.size<4) continue;
      eligible++;
      if(jaccard(a,b)>=0.72) pairs++;
    }
  }
  return {pairs,ratio:eligible?pairs/eligible:0};
}

function maxWindowShare(reviews:ReviewSnapshot[],days:number):number {
  const dates=reviews
    .map(r=>r.date ? Date.parse(r.date) : NaN)
    .filter(Number.isFinite)
    .sort((a,b)=>a-b);
  if(dates.length<5) return 0;
  const windowMs=days*86400000;
  let max=0;
  let end=0;
  for(let start=0;start<dates.length;start++){
    if(end<start) end=start;
    while(end<dates.length && dates[end]!-dates[start]!<=windowMs) end++;
    max=Math.max(max,end-start);
  }
  return max/dates.length;
}

function wrongProductHints(input:ReviewAnalysisInput): {count:number;category?:string} {
  if(!input.productTitle) return {count:0};
  const title=normalize(input.productTitle);
  const mismatchTerms=[
    'necklace','bracelet','earrings','handbag','purse','phone case','shirt','shoes',
    'lamp','charger','vacuum','blender','dress','jacket','ring','watch'
  ];
  const counts=new Map<string,number>();
  for(const review of input.reviews){
    const text=normalize((review.title ?? '')+' '+review.body);
    for(const term of mismatchTerms){
      if(title.includes(term)) continue;
      if(text.includes(term)) counts.set(term,(counts.get(term) ?? 0)+1);
    }
  }
  const top=[...counts.entries()].sort((a,b)=>b[1]-a[1])[0];
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

  const burst3=maxWindowShare(reviews,3);
  const burst7=maxWindowShare(reviews,7);
  if(reviews.length>=12 && (burst3>=0.35 || burst7>=0.55)){
    out.push({
      id:'REVIEW_DATE_BURST',family:'reviews',severity:'moderate',confidence:.72,weight:11,
      title:'A lot of reviews landed at nearly the same time',
      explanation:'Many visible reviews arrived in a short burst. Product launches and promotions can cause that naturally, so timing alone is not enough to call the reviews suspicious.',
      observedValue:`3-day share ${Math.round(burst3*100)}%; 7-day share ${Math.round(burst7*100)}%`,
      independentKey:'reviews-date-burst',
    });
  }

  const dup=duplicatePairs(reviews.slice(0,80));
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
    const predating=reviews.filter(r=>r.date && Date.parse(r.date)<listingTime-86400000).length;
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

  const incentivePatterns=[
    /free\s+(?:product|item|sample)/i,
    /received\s+(?:this|the\s+product)\s+(?:for\s+free|at\s+a\s+discount)/i,
    /discount\s+(?:code|in\s+exchange)/i,
    /in\s+exchange\s+for\s+(?:my\s+)?(?:honest\s+)?review/i,
  ];
  const incentivized=reviews.filter(review=>incentivePatterns.some(pattern=>pattern.test(review.body))).length;
  if(incentivized>=2){
    out.push({
      id:'INCENTIVIZED_REVIEW_LANGUAGE',family:'reviews',severity:'moderate',confidence:.78,weight:9,
      title:'Several reviewers say they got something for the review',
      explanation:'Several visible reviews mention a free item, discount or other incentive. Properly disclosed incentives can be legitimate, but those reviews may not reflect an ordinary buyer's experience.',
      observedValue:`${incentivized} visible review(s) contain incentive language`,
      independentKey:'reviews-incentive-language',
    });
  }

  return out;
}
