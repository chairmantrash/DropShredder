import {commerceText, localizedNegation} from '../languages/commerce-text';
import type { EvidenceSignal } from '../types/evidence';
import type { ProductSnapshot } from '../types/product';
import { marketplacePolicyEvidence } from './marketplace-policy';
import { certificationClaimEvidence } from './certification-claims';
import { focusedSafetyEvidence } from '../intelligence/focused-safety';

const scarcityPatterns=[
  /only\s+\d+\s+(?:left|remaining)/i,
  /sale\s+ends\s+(?:today|tonight)/i,
  /limited\s+time/i,
  /hurry(?:!+)?/i,
];
const longShipping=/\b(?:1[2-9]|2\d|3\d)\s*(?:-|to|–|से|থেকে|إلى|à|a|至)\s*(?:1[5-9]|2\d|3\d)\s+(?:business\s+)?days\b/i;

export function runPassiveRules(product: ProductSnapshot, pageText: string): EvidenceSignal[] {
  const out: EvidenceSignal[]=[...marketplacePolicyEvidence(product),...certificationClaimEvidence(product),...focusedSafetyEvidence(product)];

  const contextualCount=out.length;
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

  if (product.shippingText && longShipping.test(commerceText(product.shippingText,1000).text) && !localizedNegation(product.shippingText)) {
    out.push({
      id:'LONG_SHIPPING_WINDOW', family:'fulfillment', severity:'moderate', confidence:.75, weight:10,
      title:'Delivery may take a while',
      explanation:'Delivery looks slow enough that the item may be shipping from overseas. That alone does not prove dropshipping.',
      observedValue:product.shippingText.slice(0,220), independentKey:'fulfillment-window',
    });
  }

  const matching=commerceText(pageText);
  const scarcity=scarcityPatterns
    .map(pattern=>matching.match(pattern)?.original)
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
      explanation:'The page gives us very little to identify the exact product. That’s common, but it makes the item harder to trace.',
      independentKey:'metadata-sparsity',
    });
  }

  return out.map((item,index)=>index<contextualCount || item.provenance?item:{...item,provenance:{sourceUrl:product.url,observedAt:product.capturedAt,method:`Local rule analysis of ${product.extraction?.method || 'product metadata and bounded page text'}`}});
}
