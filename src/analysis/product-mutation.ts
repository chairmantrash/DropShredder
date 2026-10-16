import type { EvidenceSignal } from '../types/evidence';
import type { ProductSnapshot } from '../types/product';
import type { StoredObservation } from '../storage/history';
import { compareProductIdentity } from './product-identity';

function normalizedUrl(product:ProductSnapshot):string{
  return (product.canonicalUrl || product.url).split('#')[0] ?? product.url;
}

export function productMutationEvidence(
  current:ProductSnapshot,
  history:StoredObservation[],
):EvidenceSignal[]{
  const url=normalizedUrl(current);
  const now=Date.parse(current.capturedAt);
  const prior=history.slice(0,250)
    .filter(obs=>normalizedUrl(obs.report.product)===url && Number.isFinite(Date.parse(obs.capturedAt)) && Date.parse(obs.capturedAt)<now)
    .sort((a,b)=>a.capturedAt.localeCompare(b.capturedAt));

  if(!prior.length) return [];

  const oldest=prior[0]!.report.product;
  const identity=compareProductIdentity(current,oldest);
  // Different selected sizes/colors on one canonical URL are not a recycled listing.
  if(identity.conflicts.some(key=>key.startsWith('variant'))) return [];
  const identifierConflict=identity.conflicts.length>0;
  const fingerprintConflict=Boolean(
    current.technicalFingerprint &&
    oldest.technicalFingerprint &&
    current.technicalFingerprint!==oldest.technicalFingerprint
  );

  const oldHashes=new Set((oldest.imageFingerprints ?? []).slice(0,12).map(x=>x.sha256).filter(Boolean));
  const currentHashes=new Set((current.imageFingerprints ?? []).slice(0,12).map(x=>x.sha256).filter(Boolean));
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
    observedValue:`${independentChanges} observed identity dimensions changed since ${oldest.capturedAt.slice(0,10)}`,
    independentKey:'product-identity-mutation',
    sourceKey:'listing-history:'+url,
  }];
}
