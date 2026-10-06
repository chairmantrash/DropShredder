import type { EvidenceSignal } from '../types/evidence';
import type { ProductSnapshot } from '../types/product';

const scarcityPatterns=[
  /only\s+\d+\s+(?:left|remaining)/i,
  /sale\s+ends\s+(?:today|tonight)/i,
  /limited\s+time/i,
  /hurry/i,
];
const longShipping=/\b(?:1[2-9]|2\d|3\d)\s*(?:-|to|–)\s*(?:1[5-9]|2\d|3\d)\s+(?:business\s+)?days\b/i;

export function runPassiveRules(product: ProductSnapshot, pageText: string): EvidenceSignal[] {
  const out: EvidenceSignal[]=[];
  if (product.shippingText && longShipping.test(product.shippingText)) {
    out.push({
      id:'LONG_SHIPPING_WINDOW', family:'fulfillment', severity:'moderate', confidence:.75, weight:10,
      title:'Long fulfillment window',
      explanation:'The visible shipping estimate resembles extended cross-border fulfillment. This is circumstantial, not proof of dropshipping.',
      observedValue:product.shippingText.slice(0,220), independentKey:'fulfillment-window',
    });
  }

  const scarcity=scarcityPatterns.find(p=>p.test(pageText));
  if (scarcity) {
    out.push({
      id:'SCARCITY_LANGUAGE', family:'scarcity', severity:'weak', confidence:.55, weight:4,
      title:'Urgency/scarcity language detected',
      explanation:'Urgency language is common in legitimate commerce and is only a weak signal until repeated observations show it is false or resetting.',
      observedValue:scarcity.source, independentKey:'scarcity-copy',
    });
  }

  if (product.jsonLdProductCount===0 && product.imageUrls.length>12 && !product.sku && !product.gtin && !product.mpn) {
    out.push({
      id:'LOW_PROVENANCE_METADATA', family:'provenance', severity:'weak', confidence:.45, weight:3,
      title:'Sparse structured provenance metadata',
      explanation:'No top-level Product JSON-LD or standard product identifiers were recovered. Many legitimate stores omit these fields, so this is weak evidence only.',
      independentKey:'metadata-sparsity',
    });
  }

  return out;
}
