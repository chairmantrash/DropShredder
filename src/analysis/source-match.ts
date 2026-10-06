import type { EvidenceSignal } from '../types/evidence';
import type { ProductSnapshot } from '../types/product';
import type { StoredObservation } from '../storage/history';
import { indexedSourceForDomain } from '../intelligence/source-index';

export interface SourceMatch {
  domain:string;
  sourceName:string;
  sourceClass:string;
  capturedAt:string;
  technicalFingerprintMatch:boolean;
  identifierMatch:boolean;
  imageMatch:boolean;
}

function identifiers(product:ProductSnapshot):Set<string>{
  return new Set([product.gtin,product.mpn,product.sku,product.asin]
    .filter((v):v is string=>Boolean(v))
    .map(v=>v.toLowerCase()));
}

export function findIndexedSourceMatches(
  current:ProductSnapshot,
  history:StoredObservation[],
):SourceMatch[]{
  const currentIds=identifiers(current);
  const out:SourceMatch[]=[];

  for(const obs of history){
    const source=indexedSourceForDomain(obs.domain);
    if(!source || obs.domain===current.domain) continue;
    const other=obs.report.product;
    const otherIds=identifiers(other);
    const identifierMatch=[...currentIds].some(id=>otherIds.has(id));
    const technicalFingerprintMatch=Boolean(
      current.technicalFingerprint &&
      other.technicalFingerprint &&
      current.technicalFingerprint===other.technicalFingerprint
    );
    const currentHashes=current.imageFingerprints ?? [];
    const otherHashes=other.imageFingerprints ?? [];
    const imageMatch=currentHashes.some(a=>otherHashes.some(b=>a.sha256===b.sha256));

    if(identifierMatch || technicalFingerprintMatch || imageMatch){
      out.push({
        domain:obs.domain,
        sourceName:source.name,
        sourceClass:source.sourceClass,
        capturedAt:obs.capturedAt,
        technicalFingerprintMatch,
        identifierMatch,
        imageMatch,
      });
    }
  }

  return out;
}

export function indexedSourceEvidence(
  current:ProductSnapshot,
  history:StoredObservation[],
):EvidenceSignal[]{
  const matches=findIndexedSourceMatches(current,history);
  if(!matches.length) return [];

  const strongest=matches[0]!;
  const independent=[
    strongest.identifierMatch,
    strongest.technicalFingerprintMatch,
    strongest.imageMatch,
  ].filter(Boolean).length;

  return [{
    id:'INDEXED_SOURCE_MATCH',
    family:'provenance',
    severity:independent>=2?'strong':'moderate',
    confidence:independent>=2?.9:.74,
    weight:independent>=2?22:11,
    title:'Similar product found in indexed source history',
    explanation:independent>=2
      ? 'DropShredder found the product on a known supplier/marketplace source using multiple independent product invariants. Chronology and seller claims still determine whether this is legitimate wholesale/private-label activity or deceptive provenance.'
      : 'DropShredder found a related product in its local indexed source history. A single matching characteristic is not enough to establish provenance.',
    observedValue:`${strongest.sourceName} • ${strongest.domain} • ${independent} independent match type(s)`,
    independentKey:'indexed-source-match',
  }];
}
