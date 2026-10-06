import type { EvidenceSignal, Contradiction, Verdict } from './evidence';
import type { MerchantSnapshot } from './merchant';
import type { ProductSnapshot } from './product';

export interface DropShredderReport {
  version: 1;
  product: ProductSnapshot;
  merchant: MerchantSnapshot;
  evidence: EvidenceSignal[];
  contradictions: Contradiction[];
  verdict: Verdict;
}
