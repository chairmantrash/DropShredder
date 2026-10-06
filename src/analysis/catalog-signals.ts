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
    title:'Large share of visible catalog is marked down',
    explanation:'A high fraction of visible product cards appear to use sale/reference pricing. This is not deceptive by itself; repeated observations can establish whether the sale state is effectively permanent.',
    observedValue:`${snapshot.saleCardCount}/${snapshot.cardCount} visible product cards appear discounted (${Math.round(share*100)}%)`,
    independentKey:'catalog-sale-prevalence',
  }];
}
