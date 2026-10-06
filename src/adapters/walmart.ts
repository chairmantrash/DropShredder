import type { EvidenceSignal } from '../types/evidence';
import type { ProductSnapshot } from '../types/product';

export interface WalmartAdapterResult {
  productPatch: Partial<ProductSnapshot>;
  evidence: EvidenceSignal[];
}

export function analyzeWalmartPage(pageText: string): WalmartAdapterResult {
  const evidence: EvidenceSignal[]=[];
  const soldMatch=pageText.match(/sold(?:\s+and\s+shipped)?\s+by\s+([^\n]{2,120})/i);

  if (soldMatch?.[1]) {
    evidence.push({
      id:'WALMART_SELLER_DISCLOSURE',
      family:'merchant',
      severity:'info',
      confidence:.78,
      weight:0,
      title:'Walmart Marketplace seller disclosure detected',
      explanation:'Marketplace seller identity is useful for merchant correlation and business-verification checks, but third-party seller status alone carries no accusation weight.',
      observedValue:soldMatch[1].trim().slice(0,120),
      independentKey:'walmart-seller-disclosure',
    });
  }

  return {
    productPatch:{
      seller:soldMatch?.[1]?.trim(),
      pageSignals:soldMatch?.[1] ? ['walmart:seller-disclosure'] : [],
    },
    evidence,
  };
}
