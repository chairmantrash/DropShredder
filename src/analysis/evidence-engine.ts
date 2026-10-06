import type { EvidenceSignal, Verdict } from '../types/evidence';

const severityRank: Record<EvidenceSignal['severity'], number> = {
  info: 0,
  weak: 1,
  moderate: 2,
  strong: 3,
  direct: 4,
};

export function calculateVerdict(signals: EvidenceSignal[]): Verdict {
  const weighted = signals.reduce((sum, signal) => sum + signal.weight * signal.confidence, 0);
  const likelihood = Math.max(0, Math.min(99, Math.round(weighted)));

  const direct = new Set(signals.filter(s => s.severity === 'direct').map(s => s.independentKey));
  const strongFamilies = new Set(
    signals.filter(s => severityRank[s.severity] >= severityRank.strong).map(s => s.family),
  );
  const corroborating = new Set(
    signals.filter(s => severityRank[s.severity] >= severityRank.moderate).map(s => s.independentKey),
  );

  const severeWarningAllowed =
    (direct.size >= 1 && corroborating.size >= 2) || strongFamilies.size >= 2;

  let deceptionRisk: Verdict['deceptionRisk'] = 'unknown';
  if (signals.length >= 1) deceptionRisk = likelihood >= 65 ? 'high' : likelihood >= 35 ? 'moderate' : 'low';

  return {
    massResellLikelihood: signals.length ? likelihood : null,
    dropshipLikelihood: signals.length ? Math.max(0, likelihood - 8) : null,
    deceptionRisk,
    severeWarningAllowed,
    reason: severeWarningAllowed
      ? 'Independent evidence families satisfy the severe-warning gate.'
      : 'Evidence is not yet independent/strong enough for a severe automatic accusation.',
  };
}
