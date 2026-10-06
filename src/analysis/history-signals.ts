import type { EvidenceSignal } from '../types/evidence';
import type { DropShredderReport } from '../types/report';
import type { StoredObservation } from '../storage/history';

function scarcityTexts(report:DropShredderReport):string[] {
  return report.evidence
    .filter(e=>e.family==='scarcity')
    .map(e=>e.observedValue || e.title)
    .map(v=>v.toLowerCase().replace(/\d{1,2}:\d{2}(?::\d{2})?/g,'<time>').replace(/\s+/g,' ').trim())
    .filter(Boolean);
}

export function analyzeHistory(current:DropShredderReport, previous:StoredObservation[]):EvidenceSignal[] {
  const out:EvidenceSignal[]=[];
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
        weight:ageDays>=2?20:9,title:'Scarcity claim persisted across visits',
        explanation:ageDays>=2
          ? 'The same urgency/scarcity message has remained observable across multiple visits over multiple days, which is substantially stronger than a one-time timer.'
          : 'The same urgency/scarcity message has appeared repeatedly. More elapsed time is needed before treating it as strong evidence.',
        observedValue:`${matches.length+1} matching observations across ${ageDays} day(s)`,
        independentKey:'scarcity-longitudinal',
      });
    }
  }

  const prices=[current.product.price,...previous.map(o=>o.price)].filter((x):x is number=>typeof x==='number'&&Number.isFinite(x));
  if(prices.length>=3){
    const min=Math.min(...prices),max=Math.max(...prices);
    if(min>0 && max/min>=1.8){
      out.push({
        id:'LARGE_PRICE_SWING_HISTORY',family:'pricing',severity:'moderate',confidence:.66,weight:8,
        title:'Large price swings observed over time',
        explanation:'Large price changes can be legitimate. This history becomes useful when compared with claimed discounts or reference prices.',
        observedValue:`${min.toFixed(2)}–${max.toFixed(2)} across ${prices.length} observations`,
        independentKey:'price-history-range',
      });
    }
  }

  return out;
}
