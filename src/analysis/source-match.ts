import type { EvidenceSignal } from '../types/evidence';
import type { ProductSnapshot } from '../types/product';
import type { StoredObservation } from '../storage/history';
import { indexedSourceForDomain } from '../intelligence/source-index';
import { compareProductIdentity } from './product-identity';

export interface SourceMatch {
  domain:string;
  sourceName:string;
  sourceClass:string;
  sourceUrl:string;
  capturedAt:string;
  technicalFingerprintMatch:boolean;
  identifierMatch:boolean;
  matchedIdentifiers:string[];
  imageMatch:boolean;
  correlationKeys:string[];
}

export function findIndexedSourceMatches(current:ProductSnapshot,history:StoredObservation[]):SourceMatch[] {
  const out:SourceMatch[]=[];
  for(const obs of history.slice(0,250)){
    const source=indexedSourceForDomain(obs.domain);
    if(!source || obs.domain===current.domain) continue;
    const other=obs.report.product;
    const identity=compareProductIdentity(current,other);
    if(!identity.compatible) continue;
    const identifierMatch=identity.matches.length>0;
    const technicalFingerprintMatch=Boolean(current.technicalFingerprint && other.technicalFingerprint &&
      current.technicalFingerprint===other.technicalFingerprint);
    const hashes=new Set((other.imageFingerprints??[]).slice(0,30).map(x=>x.sha256).filter(Boolean));
    const matchingHashes=(current.imageFingerprints??[]).slice(0,30).map(x=>x.sha256).filter(x=>Boolean(x)&&hashes.has(x));
    const imageMatch=matchingHashes.length>0;
    if(!identifierMatch && !technicalFingerprintMatch && !imageMatch) continue;
    let sourceUrl:string;
    try{
      const url=new URL(other.url);
      if(url.protocol!=='https:' || url.username || url.password) continue;
      url.search='';url.hash='';sourceUrl=url.href;
    }catch{continue;}
    out.push({
      domain:obs.domain,sourceName:source.name,sourceClass:source.sourceClass,sourceUrl,
      capturedAt:obs.capturedAt,technicalFingerprintMatch,identifierMatch,
      matchedIdentifiers:identity.matches,imageMatch,
      correlationKeys:matchingHashes.map(hash=>'image:'+hash),
    });
  }
  // Input history order must not decide which evidence is shown.
  const rank=(match:SourceMatch)=>(match.identifierMatch?4:0)+(match.technicalFingerprintMatch?2:0)+(match.imageMatch?1:0);
  return out.sort((a,b)=>rank(b)-rank(a) || a.sourceUrl.localeCompare(b.sourceUrl) || a.capturedAt.localeCompare(b.capturedAt));
}

export function indexedSourceEvidence(current:ProductSnapshot,history:StoredObservation[]):EvidenceSignal[] {
  const strongest=findIndexedSourceMatches(current,history)[0];
  if(!strongest) return [];
  const channels=[strongest.identifierMatch,strongest.technicalFingerprintMatch,strongest.imageMatch].filter(Boolean).length;
  const currentTime=Date.parse(current.capturedAt),sourceTime=Date.parse(strongest.capturedAt);
  const unresolved=!Number.isFinite(currentTime) || !Number.isFinite(sourceTime) || sourceTime>currentTime;
  return [{
    id:'INDEXED_SOURCE_MATCH',family:'provenance',
    severity:unresolved?'info':channels>=2?'strong':'moderate',
    confidence:unresolved?.5:channels>=2?.9:.74,weight:unresolved?0:channels>=2?22:11,
    title:'We found what looks like the same product elsewhere',
    explanation:'Matching typed identifiers, product details or images identify a comparison candidate. Store-local SKUs are not global IDs. Observation dates do not establish publication order, manufacturing origin or deceptive resale; wholesale, licensed imagery and disclosed production can be legitimate.',
    observedValue:`${strongest.sourceName} • ${strongest.sourceUrl} • ${channels} matching channel(s) • observed ${strongest.capturedAt}${unresolved?' • chronology unresolved':''}`,
    independentKey:'indexed-source-match',
    correlationKeys:strongest.correlationKeys,
    sourceKey:`history:${strongest.sourceUrl}:${strongest.capturedAt}`,
    provenance:{sourceUrl:strongest.sourceUrl,observedAt:strongest.capturedAt,method:'typed identifier / local fingerprint comparison'},
  }];
}
