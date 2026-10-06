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

function wrongProductHints(input:ReviewAnalysisInput): number {
  if(!input.productTitle) return 0;
  const product=tokens(input.productTitle);
  if(product.size<2) return 0;
  const mismatchTerms=[
    'necklace','bracelet','earrings','handbag','purse','phone case','shirt','shoes',
    'lamp','charger','vacuum','blender','dress','jacket','ring','watch'
  ];
  let count=0;
  for(const review of input.reviews){
    const text=normalize(review.title+' '+review.body);
    const mentions=mismatchTerms.filter(term=>text.includes(term));
    if(mentions.length && [...product].every(term=>!text.includes(term))) count++;
  }
  return count;
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
        title:'Low verified-purchase share in visible reviews',
        explanation:'A low verified-purchase share can have legitimate causes and is not proof of manipulation. It becomes useful only with independent review anomalies.',
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
      title:'Visible reviews cluster unusually tightly in time',
      explanation:'A concentrated review burst can reflect launches, campaigns, or legitimate demand spikes, so chronology alone is circumstantial.',
      observedValue:`3-day share ${Math.round(burst3*100)}%; 7-day share ${Math.round(burst7*100)}%`,
      independentKey:'reviews-date-burst',
    });
  }

  const dup=duplicatePairs(reviews.slice(0,80));
  if(dup.pairs>=2 && dup.ratio>=0.025){
    out.push({
      id:'REVIEW_TEXT_DUPLICATION',family:'reviews',severity:dup.ratio>=0.08?'strong':'moderate',
      confidence:dup.ratio>=0.08?.88:.72,weight:dup.ratio>=0.08?19:10,
      title:'Near-duplicate review wording detected',
      explanation:'Multiple visible reviews contain unusually similar wording. Templates, syndication, or copied reviews are possible explanations; independent corroboration is still required.',
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
        title:'Reviews appear to predate this listing',
        explanation:'Visible review dates precede the known listing date. Legitimate review migration or marketplace aggregation can explain this, so provenance must be checked before concluding manipulation.',
        observedValue:`${predating} visible review(s) predate the listing`,
        independentKey:'reviews-predate-listing',
      });
    }
  }

  const mismatch=wrongProductHints(input);
  if(mismatch>=2){
    out.push({
      id:'REVIEW_PRODUCT_MISMATCH',family:'reviews',severity:'strong',confidence:.82,weight:21,
      title:'Reviews may describe a different product',
      explanation:'Multiple visible reviews appear to discuss product categories inconsistent with the current listing. Variant merges or legitimate migrated reviews remain possible alternatives.',
      observedValue:`${mismatch} potentially mismatched review(s)`,
      independentKey:'reviews-product-mismatch',
    });
  }

  return out;
}
