import type { EvidenceSignal } from '../types/evidence';
import type { ProductObservation } from '../database/history';

function normalize(value:string):string {
  return value.toLowerCase().replace(/\d{1,2}:\d{2}(?::\d{2})?/g,'<time>').replace(/\s+/g,' ').trim();
}

export function scarcityHistorySignals(
  current: ProductObservation,
  previous: ProductObservation[],
): EvidenceSignal[] {
  const out: EvidenceSignal[]=[];
  if(!current.scarcitySnippets.length || !previous.length) return out;

  const currentNormalized=new Set(current.scarcitySnippets.map(normalize));
  const historicalMatches=previous.filter(obs=>
    obs.scarcitySnippets.some(text=>currentNormalized.has(normalize(text))),
  );

  if(historicalMatches.length>=2){
    const oldest=historicalMatches.reduce((a,b)=>
      Date.parse(a.capturedAt)<Date.parse(b.capturedAt)?a:b,
    );
    const days=Math.max(0,Math.floor((Date.parse(current.capturedAt)-Date.parse(oldest.capturedAt))/86400000));
    out.push({
      id:'REPEATED_SCARCITY_CLAIM',
      family:'scarcity',
      severity:days>=2?'strong':'moderate',
      confidence:days>=2?.86:.68,
      weight:days>=2?20:9,
      title:'Scarcity message repeated across visits',
      explanation:days>=2
        ? 'The same urgency/scarcity claim has persisted across multiple observations over multiple days. This is materially stronger than a one-time countdown.'
        : 'The same urgency/scarcity claim appeared across multiple observations. More elapsed time is needed before treating it as strong evidence.',
      observedValue:`${historicalMatches.length+1} observations; oldest matching observation ${days} day(s) ago`,
      independentKey:'longitudinal-scarcity',
    });
  }

  return out;
}
