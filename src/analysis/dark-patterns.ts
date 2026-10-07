import type { EvidenceSignal } from '../types/evidence';

export interface DarkPatternSnapshot {
  checkedAt:string;
  countdownSeconds?:number;
  stockLeft?:number;
  recentPurchaseText?:string;
  subscriptionText?:string;
  precheckedUpsells?:number;
}

export function darkPatternHistoryEvidence(current:DarkPatternSnapshot,previous:readonly DarkPatternSnapshot[]):EvidenceSignal[]{
  const out:EvidenceSignal[]=[];
  const prior=[...previous].sort((a,b)=>Date.parse(a.checkedAt)-Date.parse(b.checkedAt));
  const latest=prior.at(-1);
  if(!latest) return out;
  const elapsed=(Date.parse(current.checkedAt)-Date.parse(latest.checkedAt))/1000;

  if(current.countdownSeconds!==undefined&&latest.countdownSeconds!==undefined&&elapsed>=300&&current.countdownSeconds>=latest.countdownSeconds+120){
    out.push({
      id:'COUNTDOWN_RESET',family:'scarcity',severity:'strong',confidence:.9,weight:16,
      title:'The countdown reset',
      explanation:'The timer increased again on a later check instead of continuing toward zero. That is strong evidence the deadline is being recycled.',
      observedValue:`${latest.countdownSeconds}s → ${current.countdownSeconds}s after ${Math.round(elapsed/60)} minutes`,
      independentKey:'dark-pattern:countdown-reset',
    });
  }

  if(current.stockLeft!==undefined&&latest.stockLeft!==undefined&&elapsed>=3600&&current.stockLeft===latest.stockLeft&&current.stockLeft<=10){
    const same=[latest,...prior.slice(0,-1)].filter(item=>item.stockLeft===current.stockLeft).length;
    if(same>=2){
      out.push({
        id:'STOCK_SCARCITY_REPLAY',family:'scarcity',severity:'moderate',confidence:.76,weight:9,
        title:'The “only a few left” number keeps repeating',
        explanation:'The same low-stock number appeared across separate checks. That does not prove inventory is fake, but it weakens the urgency claim.',
        observedValue:`${current.stockLeft} left on ${same+1} separate checks`,
        independentKey:'dark-pattern:stock-replay',
      });
    }
  }

  if(current.recentPurchaseText&&latest.recentPurchaseText&&current.recentPurchaseText===latest.recentPurchaseText&&elapsed>=3600){
    out.push({
      id:'RECENT_PURCHASE_REPLAY',family:'scarcity',severity:'moderate',confidence:.78,weight:8,
      title:'The recent-purchase message is repeating',
      explanation:'The same “someone just bought this” message appeared again much later. That can make activity look fresher than it is.',
      observedValue:current.recentPurchaseText.slice(0,180),
      independentKey:'dark-pattern:purchase-replay',
    });
  }

  if((current.precheckedUpsells??0)>0){
    out.push({
      id:'PRECHECKED_UPSELL',family:'pricing',severity:'moderate',confidence:.9,weight:9,
      title:'An extra purchase option is already selected',
      explanation:'The page appears to preselect an extra paid option. Check the cart total before continuing.',
      observedValue:`${current.precheckedUpsells} preselected paid option(s)`,
      independentKey:'dark-pattern:prechecked-upsell',
    });
  }

  if(current.subscriptionText&&/subscribe|subscription|recurring|every\s+(?:month|week|\d+\s+days)/i.test(current.subscriptionText)){
    out.push({
      id:'SUBSCRIPTION_DISCLOSURE',family:'pricing',severity:'info',confidence:.75,weight:0,
      title:'Recurring purchase language found',
      explanation:'This page appears to mention a recurring purchase. This is informational unless the recurring charge is hidden or preselected.',
      observedValue:current.subscriptionText.slice(0,180),
      independentKey:'dark-pattern:subscription-disclosure',
    });
  }
  return out;
}
