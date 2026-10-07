import type { ReviewSnapshot } from '../types/review';
import { normalizeReviewText, reviewHasIncentiveLanguage, reviewMentionsMismatchedCategory, reviewTextSimilarity } from './review-primitives';

export type ReviewFlag='duplicate'|'burst'|'wrong-product'|'incentivized'|'unverified'|'rating-text-conflict';

export interface ReviewIntegrityItem {
  index:number;
  flags:ReviewFlag[];
  suspicion:number;
}

export interface ReviewComplaint {
  id:string;
  label:string;
  count:number;
  share:number;
}

export interface ReviewIntegrityReport {
  total:number;
  rated:number;
  flagged:number;
  passed:number;
  passedPercent:number;
  flaggedPercent:number;
  displayedRating?:number;
  adjustedRating?:number;
  lowStarCount:number;
  commonComplaints:ReviewComplaint[];
  items:ReviewIntegrityItem[];
}

const positiveWords=/\b(?:amazing|excellent|perfect|love|great|fantastic|best|wonderful|recommend)\b/gi;
const negativeWords=/\b(?:broken|broke|terrible|awful|hate|refund|failed|failure|junk|useless|dangerous|disappointed)\b/gi;

const complaints=[
  {id:'breaks',label:'Broke quickly',patterns:[/broke|broken|fell apart|fall apart|snapped|cracked/i]},
  {id:'quality',label:'Cheap / poor quality',patterns:[/cheap quality|poor quality|cheap material|flimsy|junk|poorly made/i]},
  {id:'shipping',label:'Shipping took too long',patterns:[/never arrived|late delivery|shipping delay|took (?:forever|weeks|months)|slow shipping/i]},
  {id:'wrong-item',label:'Wrong or different item',patterns:[/wrong item|wrong product|different product|not as described/i]},
  {id:'refund',label:'Refund / return problems',patterns:[/refund|return refused|would not accept (?:the )?return|no refund/i]},
  {id:'support',label:'Bad customer service',patterns:[/customer service|no response|never replied|won't respond|would not respond/i]},
  {id:'fit',label:'Sizing / fit problems',patterns:[/too small|too large|too big|doesn't fit|does not fit|sizing/i]},
  {id:'battery',label:'Battery problems',patterns:[/battery|won't hold (?:a )?charge|stopped charging|charging problem/i]},
  {id:'overheat',label:'Overheating',patterns:[/overheat|too hot to touch|caught fire|smoke|burning smell/i]},
  {id:'missing',label:'Missing parts',patterns:[/missing (?:part|piece|screw|accessory)|parts missing/i]},
];


export function reviewIntegrity(reviews:ReviewSnapshot[],productTitle?:string):ReviewIntegrityReport{
  const usable=reviews.filter(r=>r.body?.trim()).slice(0,120);
  const scores=usable.map(()=>({score:0,flags:new Set<ReviewFlag>()}));
  const title=normalizeReviewText(productTitle??'');

  // Duplicate/copied wording. Pairwise work is bounded to 120 reviews.
  for(let i=0;i<usable.length;i++)for(let j=i+1;j<usable.length;j++){
    if(reviewTextSimilarity(usable[i]!.body,usable[j]!.body)>=.72){
      scores[i]!.score+=.55;scores[j]!.score+=.55;
      scores[i]!.flags.add('duplicate');scores[j]!.flags.add('duplicate');
    }
  }

  // Review bursts: only mark reviews when at least 6 dated reviews exist in a 3-day window.
  const dated=usable.map((r,i)=>({i,t:r.date?Date.parse(r.date):NaN})).filter(x=>Number.isFinite(x.t)).sort((a,b)=>a.t-b.t);
  for(let start=0,end=0;start<dated.length;start++){
    if(end<start)end=start;
    while(end<dated.length&&dated[end]!.t-dated[start]!.t<=3*86400000)end++;
    if(end-start>=6)for(let k=start;k<end;k++){const s=scores[dated[k]!.i]!;s.score+=.25;s.flags.add('burst');}
  }

  for(let i=0;i<usable.length;i++){
    const review=usable[i]!,text=normalizeReviewText((review.title??'')+' '+review.body),s=scores[i]!;
    if(reviewHasIncentiveLanguage(review.body)){s.score+=.35;s.flags.add('incentivized');}
    if(review.verified===false){s.score+=.15;s.flags.add('unverified');}
    if(typeof review.rating==='number'){
      const positives=(text.match(positiveWords)??[]).length;
      const negatives=(text.match(negativeWords)??[]).length;
      if((review.rating>=4.5&&negatives>=2&&negatives>positives)||(review.rating<=2&&positives>=2&&positives>negatives)){
        s.score+=.35;s.flags.add('rating-text-conflict');
      }
    }
    if(title){
      if(reviewMentionsMismatchedCategory(productTitle,text)){s.score+=.55;s.flags.add('wrong-product');}
    }
  }

  // Weak clues do not condemn a review. Strong copied wording, wrong-product evidence, or combined weaker clues can cross the flag threshold.
  const items=scores.map((s,index)=>({index,flags:[...s.flags],suspicion:Math.min(1,s.score)}));
  const flaggedItems=items.filter(x=>x.suspicion>=.5);
  const passedItems=items.filter(x=>x.suspicion<.5);
  const rated=usable.map((r,index)=>({r,index})).filter(x=>typeof x.r.rating==='number');
  const displayedRating=rated.length?rated.reduce((a,x)=>a+(x.r.rating??0),0)/rated.length:undefined;
  const adjusted=rated.filter(x=>items[x.index]!.suspicion<.5);
  const adjustedRating=adjusted.length?adjusted.reduce((a,x)=>a+(x.r.rating??0),0)/adjusted.length:undefined;
  const lowStar=usable.filter((r,index)=>typeof r.rating==='number' && r.rating<=2 && items[index]!.suspicion<.5);
  const commonComplaints=complaints.map(group=>{
    const count=lowStar.filter(r=>group.patterns.some(p=>p.test((r.title??'')+' '+r.body))).length;
    return {id:group.id,label:group.label,count,share:lowStar.length?Math.round(count/lowStar.length*100):0};
  }).filter(x=>x.count>0).sort((a,b)=>b.count-a.count).slice(0,5);
  const total=usable.length,flagged=flaggedItems.length,passed=passedItems.length;
  return {
    total,rated:rated.length,flagged,passed,
    passedPercent:total?Math.round(passed/total*100):0,
    flaggedPercent:total?Math.round(flagged/total*100):0,
    displayedRating,adjustedRating,lowStarCount:lowStar.length,commonComplaints,items,
  };
}
