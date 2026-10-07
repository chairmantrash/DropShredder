import type { EvidenceSignal, Contradiction, Verdict } from './evidence';
import type { MerchantSnapshot } from './merchant';
import type { ProductSnapshot } from './product';
import type { SupplyChainProfile } from '../analysis/supply-chain-profile';
import type { ReviewIntegrityReport } from '../analysis/review-integrity';

export interface DropShredderReport {
  version: 1;
  product: ProductSnapshot;
  merchant: MerchantSnapshot;
  evidence: EvidenceSignal[];
  contradictions: Contradiction[];
  verdict: Verdict;
  supplyChain?: SupplyChainProfile;
  reviewIntegrity?: ReviewIntegrityReport;
}
