import type { EvidenceSignal } from '../types/evidence';
import type { StoredObservation } from '../storage/history';
import type { ProductSnapshot } from '../types/product';

function bitSimilarity(a:string,b:string):number {
  if(!/^[01]{64}$/.test(a) || !/^[01]{64}$/.test(b) || !a.includes('0') || !a.includes('1') || !b.includes('0') || !b.includes('1')) return 0;
  let same=0;
  for(let i=0;i<a.length;i++) if(a[i]===b[i]) same++;
  return same/a.length;
}

export interface ImageHistoryMatch {
  currentUrl:string;
  historicalUrl:string;
  historicalDomain:string;
  historicalCapturedAt:string;
  exact:boolean;
  ahashSimilarity:number;
  dhashSimilarity:number;
}

export function findImageHistoryMatches(
  current:ProductSnapshot,
  previous:StoredObservation[],
):ImageHistoryMatch[] {
  const currentFingerprints=(current.imageFingerprints ?? []).slice(0,12);
  if(!currentFingerprints.length) return [];

  const matches:ImageHistoryMatch[]=[];
  const observations=previous.slice(0,250);
  // Per-call only: repeated gallery hashes reuse work without retaining browsing data.
  const similarities=new Map<string,number>();
  const compare=(a:string,b:string):number=>{
    if(a.length!==64 || b.length!==64) return 0;
    const key=a+':'+b;
    const cached=similarities.get(key);
    if(cached!==undefined) return cached;
    const value=bitSimilarity(a,b);
    if(similarities.size<512) similarities.set(key,value);
    return value;
  };
  const times=new Map<string,number>();
  for(const obs of observations){
    const value=Date.parse(obs.capturedAt);
    times.set(obs.capturedAt,Number.isFinite(value)?value:Number.POSITIVE_INFINITY);
  }
  for(const now of currentFingerprints){
    for(const obs of observations){
      let best:ImageHistoryMatch|undefined;
      for(const old of (obs.report.product.imageFingerprints ?? []).slice(0,12)){
        const exact=Boolean(now.sha256 && old.sha256 && now.sha256===old.sha256);
        const ah=compare(now.ahash,old.ahash);
        const dh=compare(now.dhash,old.dhash);
        if(exact || (ah>=.92 && dh>=.9)){
          const candidate:ImageHistoryMatch={
            currentUrl:now.url,
            historicalUrl:old.url,
            historicalDomain:obs.domain,
            historicalCapturedAt:obs.capturedAt,
            exact,
            ahashSimilarity:ah,
            dhashSimilarity:dh,
          };
          if(!best || Number(candidate.exact)>Number(best.exact) ||
            (candidate.exact===best.exact && (ah+dh>best.ahashSimilarity+best.dhashSimilarity ||
              (ah+dh===best.ahashSimilarity+best.dhashSimilarity && candidate.historicalUrl<best.historicalUrl)))) best=candidate;
        }
      }
      // One relationship per current image and historical observation, not every gallery pair.
      if(best) matches.push(best);
    }
  }
  return matches.sort((a,b)=>times.get(a.historicalCapturedAt)!-times.get(b.historicalCapturedAt)!);
}

export function imageHistoryEvidence(
  current:ProductSnapshot,
  previous:StoredObservation[],
):EvidenceSignal[] {
  const matches=findImageHistoryMatches(current,previous);
  if(!matches.length) return [];

  const crossDomain=matches.filter(m=>m.historicalDomain!==current.domain);
  if(!crossDomain.length){
    return [{
      id:'IMAGE_HISTORY_REPEAT_SAME_DOMAIN',
      family:'provenance',
      severity:'info',
      confidence:.98,
      weight:0,
      title:'Previously seen product image',
      explanation:'This image or a near-identical version was seen previously on the same domain. This is useful for chronology but is not negative evidence.',
      observedValue:`${matches.length} historical match(es)`,
      independentKey:'image-history-same-domain',
    }];
  }

  const oldest=crossDomain[0]!;
  const now=Date.parse(current.capturedAt),historicalTime=Date.parse(oldest.historicalCapturedAt);
  const chronology=Number.isFinite(now)&&Number.isFinite(historicalTime)&&historicalTime<=now;
  const ageDays=chronology?Math.floor((now-historicalTime)/86400000):undefined;
  return [{
    id:'CROSS_DOMAIN_IMAGE_MATCH',
    family:'provenance',
    severity:chronology?'moderate':'info',
    confidence:chronology?(oldest.exact?.92:.8):.5,
    weight:chronology?12:0,
    title:'Same product image seen on another domain',
    explanation:'A matching or near-identical product image was previously observed on another domain. This establishes a relationship worth investigating, but not which seller originated the image.',
    observedValue:`${oldest.exact?'Exact':'Near'} match on ${oldest.historicalDomain} • ${chronology?`${ageDays} day(s) earlier`:'observation chronology unresolved'}`,
    independentKey:'image-cross-domain-match',
    correlationKeys:(current.imageFingerprints??[]).slice(0,12)
      .filter(image=>image.sha256 && crossDomain.some(match=>match.currentUrl===image.url))
      .map(image=>'image:'+image.sha256),
  }];
}
