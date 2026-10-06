import type { EvidenceSignal, RiskLevel, Verdict } from '../types/evidence';

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

function riskLevel(signals: EvidenceSignal[]): RiskLevel {
  const scored=signals.filter(signal=>effectiveWeight(signal)>0);
  if(!scored.length) return 'unknown';

  const direct=scored.filter(signal=>signal.severity==='direct').length;
  const strong=scored.filter(signal=>signal.severity==='strong').length;
  const moderate=scored.filter(signal=>signal.severity==='moderate').length;

  if(direct>=1 || strong>=2) return 'high';
  if(strong>=1 || moderate>=2) return 'moderate';
  return 'low';
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
  const scored = unique.filter(signal => effectiveWeight(signal) > 0);

  const provenance = scored.filter(signal => signal.family === 'provenance');
  const fulfillment = scored.filter(signal => signal.family === 'fulfillment');
  const merchant = scored.filter(signal => signal.family === 'merchant' || signal.family === 'identity');
  const manipulation = scored.filter(signal =>
    signal.family === 'scarcity' ||
    signal.family === 'pricing' ||
    signal.family === 'reviews' ||
    signal.family === 'claims'
  );

  const provenanceWeight = provenance.reduce((sum, signal) => sum + effectiveWeight(signal), 0);
  const dropshipWeight = provenanceWeight + fulfillment.reduce((sum,signal)=>sum+effectiveWeight(signal)*.65,0);
  const massResellLikelihood = provenance.length
    ? Math.max(0, Math.min(99, Math.round(provenanceWeight)))
    : null;
  const dropshipLikelihood = provenance.length || fulfillment.length
    ? Math.max(0, Math.min(99, Math.round(dropshipWeight)))
    : null;

  // Severe automatic accusations remain restricted to product provenance and
  // fulfillment evidence. Merchant reputation, reviews, policy friction,
  // pricing and scarcity can never unlock this gate by themselves.
  const severePool=[...provenance,...fulfillment];
  const directKeys = new Set(severePool.filter(s => s.severity === 'direct').map(s => s.independentKey));
  const corroboratingKeys = new Set(
    severePool.filter(s => severityRank[s.severity] >= severityRank.moderate).map(s => s.independentKey),
  );
  const strongFamilies = new Set(
    severePool.filter(s => severityRank[s.severity] >= severityRank.strong).map(s => s.family),
  );

  const directWithIndependentCorroboration =
    directKeys.size >= 1 &&
    [...corroboratingKeys].some(key => !directKeys.has(key));

  const severeWarningAllowed =
    directWithIndependentCorroboration || strongFamilies.size >= 2;

  const deceptionSignals=scored.filter(signal =>
    signal.family==='provenance' ||
    signal.family==='claims' ||
    signal.family==='scarcity' ||
    signal.family==='pricing'
  );

  return {
    massResellLikelihood,
    dropshipLikelihood,
    deceptionRisk:riskLevel(deceptionSignals),
    merchantRisk:riskLevel(merchant),
    manipulationRisk:riskLevel(manipulation),
    fulfillmentRisk:riskLevel(fulfillment),
    severeWarningAllowed,
    reason: severeWarningAllowed
      ? 'Independent provenance/fulfillment evidence satisfies the severe-warning gate.'
      : severePool.length
        ? 'Product evidence is not yet independent/strong enough for a severe automatic accusation.'
        : scored.length
          ? 'Risk signals exist, but none establish product provenance or dropshipping.'
          : 'No accusation-weighted evidence is available yet.',
  };
}
