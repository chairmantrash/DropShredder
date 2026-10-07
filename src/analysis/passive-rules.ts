import type { EvidenceSignal } from '../types/evidence';
import type { ProductSnapshot } from '../types/product';

const scarcityPatterns=[
  /only\s+\d+\s+(?:left|remaining)/i,
  /sale\s+ends\s+(?:today|tonight)/i,
  /limited\s+time/i,
  /hurry(?:!+)?/i,
];
const longShipping=/\b(?:1[2-9]|2\d|3\d)\s*(?:-|to|–)\s*(?:1[5-9]|2\d|3\d)\s+(?:business\s+)?days\b/i;

export function runPassiveRules(product: ProductSnapshot, pageText: string): EvidenceSignal[] {
  const out: EvidenceSignal[]=[];

  for (const signal of product.pageSignals) {
    if (signal.startsWith('platform:')) {
      out.push({
        id:'COMMERCE_PLATFORM_DETECTED', family:'technology', severity:'info', confidence:.97, weight:0,
        title:'Store platform identified',
        explanation:'We can tell what shopping platform this store uses. That alone says nothing bad about the seller.',
        observedValue:signal,
        independentKey:signal,
      });
    }
    if (signal === 'review-platform:loox') {
      out.push({
        id:'REVIEW_PLATFORM_LOOX', family:'reviews', severity:'info', confidence:.98, weight:0,
        title:'Loox reviews are being used',
        explanation:'This store uses Loox for reviews. Plenty of legitimate stores do too, so this is not a red flag by itself.',
        observedValue:'Loox storefront widget signature',
        independentKey:'review-platform-loox',
      });
    }
    if (signal === 'review-platform:judgeme') {
      out.push({
        id:'REVIEW_PLATFORM_JUDGEME', family:'reviews', severity:'info', confidence:.98, weight:0,
        title:'Judge.me reviews are being used',
        explanation:'This store uses Judge.me for reviews. That does not mean the reviews are fake or imported.',
        observedValue:'Judge.me storefront widget signature',
        independentKey:'review-platform-judgeme',
      });
    }
    if (signal.startsWith('tracking-platform:')) {
      out.push({
        id:'TRACKING_PLATFORM_DETECTED', family:'technology', severity:'info', confidence:.96, weight:0,
        title:'Order-tracking service identified',
        explanation:'The store uses a third-party order-tracking service. That matters only if the shipping trail later clashes with what the seller promised.',
        observedValue:signal,
        independentKey:signal,
      });
    }
  }

  if (product.shippingText && longShipping.test(product.shippingText)) {
    out.push({
      id:'LONG_SHIPPING_WINDOW', family:'fulfillment', severity:'moderate', confidence:.75, weight:10,
      title:'Delivery may take a while',
      explanation:'The stated delivery window is unusually long and can be consistent with overseas fulfillment. It does not prove the product is dropshipped.',
      observedValue:product.shippingText.slice(0,220), independentKey:'fulfillment-window',
    });
  }

  const scarcity=scarcityPatterns
    .map(pattern=>pageText.match(pattern)?.[0])
    .find((value):value is string=>Boolean(value));
  if (scarcity) {
    out.push({
      id:'SCARCITY_LANGUAGE', family:'scarcity', severity:'weak', confidence:.55, weight:4,
      title:'Pressure-to-buy language',
      explanation:'The page is pushing urgency such as limited-time or low-stock language. Legitimate stores do this too, so we only take it seriously if the claim keeps resetting or never goes away.',
      observedValue:scarcity.slice(0,180), independentKey:'scarcity-copy',
    });
  }

  if (product.jsonLdProductCount===0 && product.imageUrls.length>12 && !product.sku && !product.gtin && !product.mpn) {
    out.push({
      id:'LOW_PROVENANCE_METADATA', family:'provenance', severity:'weak', confidence:.45, weight:3,
      title:'Few product identity details',
      explanation:'We could not find common product identifiers such as a GTIN, MPN or SKU in the page data. Many legitimate stores omit them, so this is only a small reason to dig deeper.',
      independentKey:'metadata-sparsity',
    });
  }

  return out;
}
