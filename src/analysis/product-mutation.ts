import type { EvidenceSignal } from '../types/evidence';
import type { ProductSnapshot } from '../types/product';
import type { StoredObservation } from '../storage/history';

function normalizedUrl(product:ProductSnapshot):string{
  return (product.canonicalUrl || product.url).split('#')[0] ?? product.url;
}

function idSet(product:ProductSnapshot):Set<string>{
  return new Set([product.gtin,product.mpn,product.sku,product.asin]
    .filter((v):v is string=>Boolean(v))
    .map(v=>v.trim().toLowerCase()));
}

export function productMutationEvidence(
  current:ProductSnapshot,
  history:StoredObservation[],
):EvidenceSignal[]{
  const url=normalizedUrl(current);
  const prior=history
    .filter(obs=>normalizedUrl(obs.report.product)===url)
    .sort((a,b)=>a.capturedAt.localeCompare(b.capturedAt));

  if(!prior.length) return [];

  const oldest=prior[0]!.report.product;
  const currentIds=idSet(current);
  const oldIds=idSet(oldest);
  const identifierConflict=currentIds.size>0 && oldIds.size>0 && ![...currentIds].some(id=>oldIds.has(id));
  const fingerprintConflict=Boolean(
    current.technicalFingerprint &&
    oldest.technicalFingerprint &&
    current.technicalFingerprint!==oldest.technicalFingerprint
  );

  const oldHashes=new Set((oldest.imageFingerprints ?? []).map(x=>x.sha256));
  const currentHashes=new Set((current.imageFingerprints ?? []).map(x=>x.sha256));
  const imageHistoryAvailable=oldHashes.size>0 && currentHashes.size>0;
  const imageOverlap=imageHistoryAvailable && [...currentHashes].some(hash=>oldHashes.has(hash));

  const independentChanges=[
    identifierConflict,
    fingerprintConflict,
    imageHistoryAvailable && !imageOverlap,
  ].filter(Boolean).length;

  if(independentChanges<2) return [];

  return [{
    id:'PRODUCT_IDENTITY_MUTATION',
    family:'provenance',
    severity:independentChanges>=3?'strong':'moderate',
    confidence:independentChanges>=3?.9:.78,
    weight:independentChanges>=3?20:10,
    title:'This listing may have changed products',
    explanation:'The same product page now points to something that differs in several important ways from what DropShredder saw before. The store may have relaunched or replaced the item, but recycled listings can also carry old reviews and history into a different product.',
    observedValue:`${independentChanges} independent identity dimensions changed since ${oldest.capturedAt.slice(0,10)}`,
    independentKey:'product-identity-mutation',
  }];
}
