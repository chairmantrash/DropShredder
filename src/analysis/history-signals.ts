import type { EvidenceSignal } from '../types/evidence';
import type { DropShredderReport } from '../types/report';
import type { StoredObservation } from '../storage/history';
import { compareProductIdentity } from './product-identity';

function scarcityTexts(report:DropShredderReport):string[] {
  return report.evidence
    .filter(e=>e.family==='scarcity')
    .map(e=>e.observedValue || e.title)
    .map(v=>v.toLowerCase().replace(/\d{1,2}:\d{2}(?::\d{2})?/g,'<time>').replace(/\s+/g,' ').trim())
    .filter(Boolean);
}

export function analyzeHistory(current:DropShredderReport, previous:StoredObservation[]):EvidenceSignal[] {
  const out:EvidenceSignal[]=[];
  const now=Date.parse(current.product.capturedAt);
  const seen=new Set<string>();
  const offerUrl=(p:DropShredderReport['product'])=>{
    try{const url=new URL(p.canonicalUrl??p.url);url.search='';url.hash='';return url.href;}catch{return undefined;}
  };
  const currentOffer=offerUrl(current.product);
  previous=previous.slice(0,120).filter(obs=>{
    const at=Date.parse(obs.capturedAt),identity=compareProductIdentity(current.product,obs.report.product);
    if(!currentOffer || obs.domain!==current.product.domain || offerUrl(obs.report.product)!==currentOffer) return false;
    if(!Number.isFinite(now) || !Number.isFinite(at) || at>=now || !identity.compatible || seen.has(obs.capturedAt)) return false;
    seen.add(obs.capturedAt);return true;
  }).sort((a,b)=>b.capturedAt.localeCompare(a.capturedAt));
  if(!previous.length) return out;

  const currentScarcity=new Set(scarcityTexts(current));
  if(currentScarcity.size){
    const matches=previous.filter(obs=>scarcityTexts(obs.report).some(v=>currentScarcity.has(v)));
    if(matches.length>=2){
      const oldest=Math.min(...matches.map(x=>Date.parse(x.capturedAt)).filter(Number.isFinite));
      const ageDays=Number.isFinite(oldest)
        ? Math.max(0,Math.floor((Date.parse(current.product.capturedAt)-oldest)/86400000))
        : 0;
      out.push({
        id:'REPEATED_SCARCITY_CLAIM',family:'scarcity',
        severity:ageDays>=2?'strong':'moderate',confidence:ageDays>=2?.87:.68,
        weight:ageDays>=2?20:9,title:'That "limited" deal keeps hanging around',
        explanation:ageDays>=2
          ? 'The same hurry-up message was still there across several visits and multiple days. A supposedly urgent deal that never seems to end deserves more skepticism.'
          : 'The same hurry-up message has shown up more than once. We need more time before calling it a serious warning.',
        observedValue:`${matches.length+1} matching observations across ${ageDays} day(s)`,
        independentKey:'scarcity-longitudinal',
      });
    }
  }

  const priorRatings=previous.map(o=>o.report.reviewIntegrity).filter((x):x is NonNullable<DropShredderReport['reviewIntegrity']>=>Boolean(x&&x.total>=5));
  const currentReviews=current.reviewIntegrity;
  if(currentReviews&&currentReviews.total>=5&&priorRatings.length){
    const oldest=priorRatings.at(-1)!;
    const countJump=oldest.total>0&&currentReviews.total>=oldest.total*2&&currentReviews.total-oldest.total>=20;
    const ratingJump=oldest.displayedRating!==undefined&&currentReviews.displayedRating!==undefined&&currentReviews.displayedRating-oldest.displayedRating>=.8;
    if(countJump&&ratingJump){
      out.push({
        id:'REVIEW_HISTORY_JUMP',family:'reviews',severity:'moderate',confidence:.72,weight:9,
        title:'The review history changed fast',
        explanation:'The visible review count and rating both jumped sharply since an earlier check. That can happen legitimately, but it is worth checking for a relaunch, review migration or a changed product.',
        observedValue:`${oldest.total} → ${currentReviews.total} reviews; ${oldest.displayedRating!.toFixed(1)} → ${currentReviews.displayedRating!.toFixed(1)} rating`,
        independentKey:'review-history-jump',
      });
    }
  }

  const currency=current.product.currency?.toUpperCase();
  const priceHistory=currency?previous.filter(obs=>
    (obs.report.product.currency??obs.currency)?.toUpperCase()===currency):[];
  const prices=currency?[current.product.price,...priceHistory.map(o=>o.report.product.price)]
    .filter((x):x is number=>typeof x==='number'&&Number.isFinite(x)&&x>0):[];
  if(prices.length>=3){
    const min=Math.min(...prices),max=Math.max(...prices);
    if(min>0 && max/min>=1.8){
      out.push({
        id:'LARGE_PRICE_SWING_HISTORY',family:'pricing',severity:'moderate',confidence:.66,weight:8,
        title:'The price has been bouncing around',
        explanation:'This product’s price has moved a lot across scans. That can be legitimate, but it is worth comparing against any "was" price or huge discount claim.',
        observedValue:`${min.toFixed(2)}–${max.toFixed(2)} across ${prices.length} observations`,
        independentKey:'price-history-range',
      });
    }
  }

  return out;
}
