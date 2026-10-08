import type { EvidenceSignal } from '../types/evidence';
import type { ProductSnapshot } from '../types/product';
import type { StoredObservation } from '../storage/history';
import { compareProductIdentity } from './product-identity';

export function localMerchantNetworkEvidence(
  current:ProductSnapshot,
  history:StoredObservation[],
):EvidenceSignal[]{
  const currentDomain=current.domain.toLowerCase().replace(/^www\./,'');
  const matches=new Map<string,string[]>();
  for(const obs of history.slice(0,250)){
    const otherDomain=obs.domain.toLowerCase().replace(/^www\./,'');
    if(otherDomain===currentDomain) continue;
    const identity=compareProductIdentity(current,obs.report.product);
    if(identity.compatible && identity.matches.length) matches.set(otherDomain,identity.matches);
  }

  if(!matches.size) return [];

  const domains=[...matches.keys()];
  return [{
    id:'CROSS_DOMAIN_SHARED_PRODUCT_IDENTIFIER',
    family:'identity',
    severity:'info',
    confidence:.94,
    weight:0,
    title:'Matching typed product identifiers appeared on other stores',
    explanation:'Matching GTIN, ASIN or brand/model identifiers suggest comparable products, not a common merchant owner. Store-local SKUs are not global identifiers. A legitimate manufacturer can supply unrelated retailers; this carries no merchant-risk weight.',
    observedValue:domains.map(domain=>`${domain}: ${matches.get(domain)!.join(', ')}`).join(' • '),
    independentKey:'merchant-network:shared-product-id',
  }];
}

export function crossDomainReferenceEvidence(
  currentDomain:string,
  text:string,
  knownDomains:string[],
):EvidenceSignal[]{
  const current=currentDomain.toLowerCase().replace(/^www\./,'');
  const refs=knownDomains
    .map(d=>d.toLowerCase().replace(/^www\./,''))
    .filter(d=>d!==current && text.toLowerCase().includes(d));

  if(!refs.length) return [];

  return [{
    id:'CROSS_DOMAIN_MERCHANT_REFERENCE',
    family:'identity',
    severity:'moderate',
    confidence:.9,
    weight:12,
    title:'This store points directly to another seller’s website',
    explanation:'The store’s own page mentions another seller’s website. That can happen with sister brands, shared support or copied content, so the connection is worth a closer look.',
    observedValue:[...new Set(refs)].join(', '),
    independentKey:'merchant-network:cross-domain-reference',
  }];
}
