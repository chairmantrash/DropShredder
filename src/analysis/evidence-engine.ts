import type { EvidenceSignal, Verdict } from '../types/evidence';

const severityRank: Record<EvidenceSignal['severity'], number> = {
  info: 0,
  weak: 1,
  moderate: 2,
  strong: 3,
  direct: 4,
};

function effectiveWeight(signal: EvidenceSignal): number {
  if (signal.severity === 'info') return 0;
  return Math.max(0, signal.weight * signal.confidence);
}

export function dedupeEvidence(signals: EvidenceSignal[]): EvidenceSignal[] {
  const byKey = new Map<string, EvidenceSignal>();
  for (const signal of signals) {
    const current = byKey.get(signal.independentKey);
    if (!current) {
      byKey.set(signal.independentKey, signal);
      continue;
    }

    const currentScore = severityRank[current.severity] * 100 + effectiveWeight(current);
    const nextScore = severityRank[signal.severity] * 100 + effectiveWeight(signal);
    if (nextScore > currentScore) byKey.set(signal.independentKey, signal);
  }
  return [...byKey.values()];
}

export function calculateVerdict(signals: EvidenceSignal[]): Verdict {
  const unique = dedupeEvidence(signals);
  // Merchant complaints, identity checks, and policy friction must not inflate
  // product provenance or dropshipping likelihood.
  const scored = unique.filter(signal => effectiveWeight(signal) > 0);
  const provenance = scored.filter(signal => signal.family === 'provenance' || signal.family === 'fulfillment');
  const provenanceWeight = provenance.reduce((sum, signal) => sum + effectiveWeight(signal), 0);
  const likelihood = Math.max(0, Math.min(99, Math.round(provenanceWeight)));
  const riskWeight = scored.reduce((sum, signal) => sum + effectiveWeight(signal), 0);
  const riskScore = Math.max(0, Math.min(99, Math.round(riskWeight)));

  const directKeys = new Set(provenance.filter(s => s.severity === 'direct').map(s => s.independentKey));
  const corroboratingKeys = new Set(
    provenance.filter(s => severityRank[s.severity] >= severityRank.moderate).map(s => s.independentKey),
  );
  const strongFamilies = new Set(
    provenance.filter(s => severityRank[s.severity] >= severityRank.strong).map(s => s.family),
  );

  const directWithIndependentCorroboration =
    directKeys.size >= 1 &&
    [...corroboratingKeys].some(key => !directKeys.has(key));

  const severeWarningAllowed =
    directWithIndependentCorroboration || strongFamilies.size >= 2;

  let deceptionRisk: Verdict['deceptionRisk'] = 'unknown';
  if (scored.length >= 1) {
    deceptionRisk = riskScore >= 65 ? 'high' : riskScore >= 35 ? 'moderate' : 'low';
  }

  return {
    massResellLikelihood: provenance.length ? likelihood : null,
    dropshipLikelihood: provenance.length ? Math.max(0, likelihood - 8) : null,
    deceptionRisk,
    severeWarningAllowed,
    reason: severeWarningAllowed
      ? 'Independent evidence families satisfy the severe-warning gate.'
      : scored.length
        ? 'Evidence is not yet independent/strong enough for a severe automatic accusation.'
        : 'No accusation-weighted evidence is available yet.',
  };
}
