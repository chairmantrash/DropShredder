import type { ReviewSnapshot } from '../types/review';

export type ReviewFlag='duplicate'|'burst'|'wrong-product'|'incentivized'|'unverified';

export interface ReviewIntegrityItem {
  index:number;
  flags:ReviewFlag[];
  suspicion:number;
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
  items:ReviewIntegrityItem[];
}

function norm(value:string):string{
  return value.toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
}
function tokenSet(value:string):Set<string>{
  return new Set(norm(value).split(' ').filter(t=>t.length>=4));
}
function similarity(a:string,b:string):number{
  const aa=tokenSet(a),bb=tokenSet(b);
  if(aa.size<4||bb.size<4)return 0;
  let hit=0;for(const x of aa)if(bb.has(x))hit++;
  return hit/(aa.size+bb.size-hit);
}
const incentive=[
  /free\s+(?:product|item|sample)/i,
  /received\s+(?:this|the\s+product)\s+(?:for\s+free|at\s+a\s+discount)/i,
  /discount\s+(?:code|in\s+exchange)/i,
  /in\s+exchange\s+for\s+(?:my\s+)?(?:honest\s+)?review/i,
];
const categories=['necklace','bracelet','earrings','handbag','purse','phone case','shirt','shoes','lamp','charger','vacuum','blender','dress','jacket','ring','watch'];

export function reviewIntegrity(reviews:ReviewSnapshot[],productTitle?:string):ReviewIntegrityReport{
  const usable=reviews.filter(r=>r.body?.trim()).slice(0,120);
  const scores=usable.map(()=>({score:0,flags:new Set<ReviewFlag>()}));
  const title=norm(productTitle??'');

  // Duplicate/copied wording. Pairwise work is bounded to 120 reviews.
  for(let i=0;i<usable.length;i++)for(let j=i+1;j<usable.length;j++){
    if(similarity(usable[i]!.body,usable[j]!.body)>=.72){
      scores[i]!.score+=.45;scores[j]!.score+=.45;
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
    const review=usable[i]!,text=norm((review.title??'')+' '+review.body),s=scores[i]!;
    if(incentive.some(p=>p.test(review.body))){s.score+=.35;s.flags.add('incentivized');}
    if(review.verified===false){s.score+=.15;s.flags.add('unverified');}
    if(title){
      const mismatch=categories.some(term=>!title.includes(term)&&text.includes(term));
      if(mismatch){s.score+=.55;s.flags.add('wrong-product');}
    }
  }

  // One weak clue does not condemn a review. Flag only combined evidence or a strong wrong-product clue.
  const items=scores.map((s,index)=>({index,flags:[...s.flags],suspicion:Math.min(1,s.score)}));
  const flaggedItems=items.filter(x=>x.suspicion>=.5);
  const passedItems=items.filter(x=>x.suspicion<.5);
  const rated=usable.map((r,index)=>({r,index})).filter(x=>typeof x.r.rating==='number');
  const displayedRating=rated.length?rated.reduce((a,x)=>a+(x.r.rating??0),0)/rated.length:undefined;
  const adjusted=rated.filter(x=>items[x.index]!.suspicion<.5);
  const adjustedRating=adjusted.length?adjusted.reduce((a,x)=>a+(x.r.rating??0),0)/adjusted.length:undefined;
  const total=usable.length,flagged=flaggedItems.length,passed=passedItems.length;
  return {
    total,rated:rated.length,flagged,passed,
    passedPercent:total?Math.round(passed/total*100):0,
    flaggedPercent:total?Math.round(flagged/total*100):0,
    displayedRating,adjustedRating,items,
  };
}
