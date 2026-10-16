import {commerceText} from '../languages/commerce-text';
import type { EvidenceSignal } from '../types/evidence';
import type { ProductSnapshot } from '../types/product';

export interface AmazonAdapterResult {
  productPatch: Partial<ProductSnapshot>;
  evidence: EvidenceSignal[];
}

export function analyzeAmazonPage(pageText: string): AmazonAdapterResult {
  const evidence: EvidenceSignal[]=[];
  const matching=commerceText(pageText);
  const sellerMatch=matching.match(/(?:sold by|seller)\s*[:\n]?\s*([^\n]{2,100})/i)?.canonical;
  const shipsFromMatch=matching.match(/ships from\s*[:\n]?\s*([^\n]{2,100})/i)?.canonical;

  if (sellerMatch?.[1]) {
    evidence.push({
      id:'AMAZON_SELLER_DISCLOSURE',
      family:'merchant',
      severity:'info',
      confidence:.7,
      weight:0,
      title:'Amazon seller disclosure detected',
      explanation:'Amazon permits third-party fulfillment when the merchant remains the seller of record. Seller identity is therefore recorded as context, not evidence of wrongdoing.',
      observedValue:matching.original(sellerMatch.index+sellerMatch[0].lastIndexOf(sellerMatch[1]),sellerMatch[1].length).trim().slice(0,100),
      independentKey:'amazon-seller-disclosure',
    });
  }

  if (shipsFromMatch?.[1]) {
    evidence.push({
      id:'AMAZON_SHIPS_FROM_DISCLOSURE',
      family:'fulfillment',
      severity:'info',
      confidence:.7,
      weight:0,
      title:'Amazon fulfillment disclosure detected',
      explanation:'Ships-from information describes fulfillment, not manufacturing origin or product originality.',
      observedValue:matching.original(shipsFromMatch.index+shipsFromMatch[0].lastIndexOf(shipsFromMatch[1]),shipsFromMatch[1].length).trim().slice(0,100),
      independentKey:'amazon-fulfillment-disclosure',
    });
  }

  return {
    productPatch:{
      seller:sellerMatch?.[1]?matching.original(sellerMatch.index+sellerMatch[0].lastIndexOf(sellerMatch[1]),sellerMatch[1].length).trim():undefined,
      pageSignals:[
        ...(sellerMatch?.[1] ? ['amazon:seller-disclosure'] : []),
        ...(shipsFromMatch?.[1] ? ['amazon:ships-from-disclosure'] : []),
      ],
    },
    evidence,
  };
}
