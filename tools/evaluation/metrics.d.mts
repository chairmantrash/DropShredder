export interface Rate {
  successes: number;
  total: number;
  estimate: number | null;
  lower95: number | null;
  upper95: number | null;
}
export interface Metrics {
  samples: number;
  positive: number;
  negative: number;
  unresolvedTruth: number;
  trueWarnings: number;
  falseWarnings: number;
  unresolvedWarnings: number;
  missedWarnings: number;
  adjudicatedPrecision: Rate;
  worstCasePrecision: Rate;
  recall: Rate;
  falsePositiveRate: Rate;
  unknownShare: Rate;
}
export interface CorpusResult {
  version: number;
  pin: { sourceCommit: string; artifactSha256: string };
  status: 'NOT_ACCEPTED' | 'CORPUS_GATE_PASSED';
  scope: string;
  intervalMethod: string;
  groupCounts: { merchants: number; products: number };
  overall: Metrics;
  strata: Record<string, Record<string, Metrics>>;
  issues: string[];
}
export function rate(successes: number, total: number): Rate;
export function evaluateCorpus(input: unknown): CorpusResult;
