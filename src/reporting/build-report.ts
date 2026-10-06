import { calculateVerdict } from '../analysis/evidence-engine';
import { runPassiveRules } from '../analysis/passive-rules';
import type { DropShredderReport } from '../types/report';
import type { MerchantSnapshot } from '../types/merchant';
import type { ProductSnapshot } from '../types/product';

export function buildPassiveReport(product: ProductSnapshot, merchant: MerchantSnapshot, pageText: string): DropShredderReport {
  const evidence=runPassiveRules(product,pageText);
  return {
    version:1,
    product,
    merchant,
    evidence,
    contradictions:[],
    verdict:calculateVerdict(evidence),
  };
}
