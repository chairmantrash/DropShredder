export type EvidenceSeverity = 'info' | 'weak' | 'moderate' | 'strong' | 'direct';
export type EvidenceFamily =
  | 'provenance'
  | 'fulfillment'
  | 'pricing'
  | 'scarcity'
  | 'reviews'
  | 'merchant'
  | 'catalog'
  | 'technology'
  | 'identity'
  | 'claims';

export interface EvidenceSignal {
  id: string;
  family: EvidenceFamily;
  severity: EvidenceSeverity;
  confidence: number;
  weight: number;
  title: string;
  explanation: string;
  observedValue?: string;
  independentKey: string;
}

export interface Contradiction {
  id: string;
  claim: string;
  observation: string;
  confidence: number;
  explanation: string;
  independentKey: string;
}

export interface Verdict {
  massResellLikelihood: number | null;
  dropshipLikelihood: number | null;
  deceptionRisk: 'unknown' | 'low' | 'moderate' | 'high';
  severeWarningAllowed: boolean;
  reason: string;
}
