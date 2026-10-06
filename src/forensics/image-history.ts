import type { EvidenceSignal } from '../types/evidence';
import type { StoredObservation } from '../storage/history';
import type { ProductSnapshot } from '../types/product';

function bitSimilarity(a:string,b:string):number {
  if(!a || !b || a.length!==b.length) return 0;
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
  const currentFingerprints=current.imageFingerprints ?? [];
  if(!currentFingerprints.length) return [];

  const matches:ImageHistoryMatch[]=[];
  for(const now of currentFingerprints){
    for(const obs of previous){
      for(const old of obs.report.product.imageFingerprints ?? []){
        const exact=Boolean(now.sha256 && old.sha256 && now.sha256===old.sha256);
        const ah=bitSimilarity(now.ahash,old.ahash);
        const dh=bitSimilarity(now.dhash,old.dhash);
        if(exact || (ah>=.92 && dh>=.9)){
          matches.push({
            currentUrl:now.url,
            historicalUrl:old.url,
            historicalDomain:obs.domain,
            historicalCapturedAt:obs.capturedAt,
            exact,
            ahashSimilarity:ah,
            dhashSimilarity:dh,
          });
        }
      }
    }
  }
  return matches.sort((a,b)=>Date.parse(a.historicalCapturedAt)-Date.parse(b.historicalCapturedAt));
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
  const ageDays=Math.max(0,Math.floor((Date.parse(current.capturedAt)-Date.parse(oldest.historicalCapturedAt))/86400000));
  return [{
    id:'CROSS_DOMAIN_IMAGE_MATCH',
    family:'provenance',
    severity:'moderate',
    confidence:oldest.exact?.92:.8,
    weight:12,
    title:'Same product image seen on another domain',
    explanation:'A matching or near-identical product image was previously observed on another domain. This establishes a relationship worth investigating, but not which seller originated the image.',
    observedValue:`${oldest.exact?'Exact':'Near'} match first observed ${ageDays} day(s) earlier on ${oldest.historicalDomain}`,
    independentKey:'image-cross-domain-match',
  }];
}
