import type { EvidenceSignal } from '../types/evidence';

export interface CatalogSnapshot {
  cardCount:number;
  saleCardCount:number;
}

export function catalogEvidence(snapshot:CatalogSnapshot):EvidenceSignal[]{
  if(snapshot.cardCount<8 || snapshot.saleCardCount<1) return [];
  const share=snapshot.saleCardCount/snapshot.cardCount;
  if(share<.6) return [];

  return [{
    id:'CATALOG_SALE_PREVALENCE',
    family:'pricing',
    severity:share>=.85?'moderate':'weak',
    confidence:snapshot.cardCount>=16?.82:.68,
    weight:share>=.85?9:4,
    title:'Almost everything seems to be "on sale"',
    explanation:'A large share of the store is showing sale pricing. That can be legitimate, but if the same "sale" never ends, the discount deserves a closer look.',
    observedValue:`${snapshot.saleCardCount}/${snapshot.cardCount} visible product cards appear discounted (${Math.round(share*100)}%)`,
    independentKey:'catalog-sale-prevalence',
  }];
}
