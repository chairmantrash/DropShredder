import type { EvidenceSignal } from '../types/evidence';
import type { DropShredderReport } from '../types/report';
import type { StoredObservation } from '../storage/history';
import { compareProductIdentity } from './product-identity';
import {commerceText} from '../languages/commerce-text';

function countdowns(report:DropShredderReport):Array<{key:string;seconds:number}> {
  const out:Array<{key:string;seconds:number}>=[];
  for(const item of report.evidence.slice(0,300).filter(e=>e.family==='scarcity'&&e.id!=='REPEATED_SCARCITY_CLAIM').slice(0,20)){
    const text=commerceText(item.observedValue||item.title,300).text.toLowerCase();
    const hit=text.match(/\b(?:sale|offer|deal)\s+ends\s+(?:in\s+)?(\d{1,3}):(\d{2}):(\d{2})\b/);
    if(!hit||Number(hit[2])>59||Number(hit[3])>59)continue;
    const seconds=Number(hit[1])*3600+Number(hit[2])*60+Number(hit[3]);
    if(seconds<=0||seconds>7*86400)continue;
    out.push({key:hit[0].replace(/\d{1,3}:\d{2}:\d{2}/,'<time>').replace(/\s+/g,' '),seconds});
  }
  return out;
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

  for(const clock of countdowns(current)){
    const deadline=now+clock.seconds*1000;
    // A repeated low-stock phrase or a normally decreasing clock is not a reset.
    // Require two real earlier visits and a later implied expiry beyond clock drift.
    const matches=previous.filter(obs=>countdowns(obs.report).some(v=>v.key===clock.key&&deadline>Date.parse(obs.capturedAt)+v.seconds*1000+60_000));
    if(matches.length>=2){
      const oldest=Math.min(...matches.map(x=>Date.parse(x.capturedAt)).filter(Number.isFinite));
      const ageDays=Number.isFinite(oldest)
        ? Math.max(0,Math.floor((Date.parse(current.product.capturedAt)-oldest)/86400000))
        : 0;
      out.push({
        id:'REPEATED_SCARCITY_CLAIM',family:'scarcity',
        severity:ageDays>=2?'strong':'moderate',confidence:ageDays>=2?.87:.68,
        weight:ageDays>=2?20:9,title:'The countdown deadline moved later across visits',
        explanation:ageDays>=2
          ? 'The displayed countdown implies a later expiry than on at least two earlier visits across multiple days. Check whether the promotion terms explain a recurring offer; this does not prove fraud or dropshipping.'
          : 'The displayed countdown implies a later expiry than on at least two earlier visits. A recurring promotion can be legitimate; compare the stated deadline and terms.',
        observedValue:`${matches.length+1} observations across ${ageDays} day(s); current implied deadline ${new Date(deadline).toISOString()}`,
        independentKey:'scarcity-longitudinal',
        correlationKeys:['scarcity-copy'],
        provenance:{sourceUrl:current.product.url,observedAt:current.product.capturedAt,method:'Local same-product observation timestamps plus explicit HH:MM:SS offer countdown; 60-second drift tolerance'},
      });
      break;
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
