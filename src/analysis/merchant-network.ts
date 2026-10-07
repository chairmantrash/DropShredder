import type { EvidenceSignal } from '../types/evidence';
import type { ProductSnapshot } from '../types/product';
import type { StoredObservation } from '../storage/history';

function normalize(value:string|undefined):string|undefined{
  const v=value?.trim().toLowerCase();
  return v||undefined;
}

function stableIds(product:ProductSnapshot):Set<string>{
  return new Set([product.gtin,product.mpn,product.sku,product.asin]
    .map(normalize)
    .filter((v):v is string=>Boolean(v)));
}

export function localMerchantNetworkEvidence(
  current:ProductSnapshot,
  history:StoredObservation[],
):EvidenceSignal[]{
  const currentDomain=current.domain.toLowerCase().replace(/^www\./,'');
  const ids=stableIds(current);
  if(!ids.size) return [];

  const matches=new Map<string,string[]>();
  for(const obs of history){
    const otherDomain=obs.domain.toLowerCase().replace(/^www\./,'');
    if(otherDomain===currentDomain) continue;
    const otherIds=stableIds(obs.report.product);
    const shared=[...ids].filter(id=>otherIds.has(id));
    if(shared.length) matches.set(otherDomain,shared);
  }

  if(!matches.size) return [];

  const domains=[...matches.keys()];
  return [{
    id:'CROSS_DOMAIN_SHARED_PRODUCT_IDENTIFIER',
    family:'identity',
    severity:'strong',
    confidence:.94,
    weight:22,
    title:'The exact same product ID showed up on another store',
    explanation:'DropShredder has seen this exact product identifier on a different store. The stores may share a supplier or sell the same wholesale item, so this is a connection worth checking—not proof they are secretly the same business.',
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
