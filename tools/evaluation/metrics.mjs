import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Descriptive per-case Wilson intervals. They assume independent observations;
// this tool does not authenticate reviewers or establish population accuracy.
export function rate(successes, total) {
  if (!total) return { successes, total, estimate: null, lower95: null, upper95: null };
  const z = 1.959963984540054, p = successes / total, z2 = z * z;
  const center = (p + z2 / (2 * total)) / (1 + z2 / total);
  const margin = z * Math.sqrt(p * (1 - p) / total + z2 / (4 * total * total)) / (1 + z2 / total);
  return { successes, total, estimate: p, lower95: Math.max(0, center - margin), upper95: Math.min(1, center + margin) };
}

function summarize(cases) {
  const count = (truth, prediction) => cases.filter(c => c.truth === truth && c.prediction === prediction).length;
  const tp = count('warranted', 'warning'), fp = count('benign', 'warning');
  const positive = cases.filter(c => c.truth === 'warranted').length;
  const negative = cases.filter(c => c.truth === 'benign').length;
  const unresolvedWarnings = count('unresolved', 'warning');
  return {
    samples: cases.length, positive, negative,
    unresolvedTruth: cases.filter(c => c.truth === 'unresolved').length,
    trueWarnings: tp, falseWarnings: fp, unresolvedWarnings,
    missedWarnings: positive - tp,
    adjudicatedPrecision: rate(tp, tp + fp),
    worstCasePrecision: rate(tp, tp + fp + unresolvedWarnings),
    recall: rate(tp, positive),
    falsePositiveRate: rate(fp, negative),
    unknownShare: rate(cases.filter(c => c.prediction === 'unknown').length, cases.length),
  };
}

export function evaluateCorpus(input) {
  if (input.version !== 1 || !Array.isArray(input.cases)) throw new Error('Expected version1 corpus with cases array');
  if (!/^[a-f0-9]{40}$/.test(input.pin?.sourceCommit ?? '') || !/^[a-f0-9]{64}$/.test(input.pin?.artifactSha256 ?? '')) throw new Error('Exact source commit and artifact SHA256 required');
  const ids = new Set(), test = [], issues = [];
  const fields = ['id', 'merchantGroup', 'productGroup', 'category', 'platform', 'language', 'labelReviewer', 'observationRef'];
  const calibration = input.calibrationGroups;
  if (!Array.isArray(calibration?.merchants) || !Array.isArray(calibration?.products)) throw new Error('Calibration merchant/product group lists required');
  const merchants = new Set(calibration.merchants), products = new Set(calibration.products);
  for (const c of input.cases) {
    if (fields.some(k => typeof c[k] !== 'string' || !c[k].trim())) throw new Error('Case metadata incomplete');
    if (ids.has(c.id)) throw new Error('Duplicate case id: ' + c.id);
    ids.add(c.id);
    if (!['warranted', 'benign', 'unresolved'].includes(c.truth) || !['warning', 'no-warning', 'unknown'].includes(c.prediction)) throw new Error('Invalid truth/prediction for ' + c.id);
    if (!Array.isArray(c.truthRefs) || !c.truthRefs.length || c.truthRefs.some(x => typeof x !== 'string' || !x.trim())) throw new Error('Ground-truth references required for ' + c.id);
    if (c.sourceCommit !== input.pin.sourceCommit || c.artifactSha256 !== input.pin.artifactSha256) throw new Error('Mixed or unpinned candidate for ' + c.id);
    if (merchants.has(c.merchantGroup) || products.has(c.productGroup)) issues.push('Calibration leakage: ' + c.id);
    test.push(c);
  }
  const provenance = input.provenance ?? {};
  if (provenance.independentGroundTruth !== true) issues.push('Independent ground truth not attested');
  if (provenance.rightsCleared !== true) issues.push('Corpus rights not cleared');
  if (typeof provenance.thresholdApproval !== 'string' || !provenance.thresholdApproval.trim()) issues.push('Owner threshold approval missing');
  if (provenance.clusterDependenceReviewed !== true) issues.push('Merchant/product clustering review missing');
  const overall = summarize(test), strata = {};
  const dimensions = ['category', 'platform', 'language'];
  for (const dimension of dimensions) {
    const required = input.requiredStrata?.[dimension];
    if (!Array.isArray(required) || !required.length || required.some(x => typeof x !== 'string' || !x.trim())) throw new Error('Required coverage missing for ' + dimension);
    strata[dimension] = {};
    for (const value of new Set([...required, ...test.map(c => c[dimension])])) {
      strata[dimension][value] = summarize(test.filter(c => c[dimension] === value));
    }
  }
  // Joint cells expose blind spots hidden by marginal aggregate metrics.
  const joint = new Map();
  for (const c of test) {
    const key = JSON.stringify([c.category, c.platform, c.language]);
    if (!joint.has(key)) joint.set(key, []);
    joint.get(key).push(c);
  }
  strata.joint = Object.fromEntries([...joint].map(([key, cases]) => [key, summarize(cases)]));
  const thresholds = input.thresholds;
  const keys = ['minSamples', 'minPrecisionLower95', 'minRecallLower95', 'maxFalsePositiveUpper95', 'maxUnknownUpper95'];
  if (!thresholds || keys.some(k => !Number.isFinite(thresholds[k]))) {
    issues.push('Numeric acceptance thresholds missing');
  } else {
    if (!Number.isSafeInteger(thresholds.minSamples) || thresholds.minSamples < 1 || keys.slice(1).some(k => thresholds[k] < 0 || thresholds[k] > 1)) throw new Error('Invalid thresholds');
    const check = (name, m) => {
      if (m.samples < thresholds.minSamples || !m.positive || !m.negative) issues.push(name + ': insufficient independently labeled positive/negative coverage');
      for (const [metric, bound, threshold, minimum] of [
        ['worstCasePrecision', 'lower95', 'minPrecisionLower95', true],
        ['recall', 'lower95', 'minRecallLower95', true],
        ['falsePositiveRate', 'upper95', 'maxFalsePositiveUpper95', false],
        ['unknownShare', 'upper95', 'maxUnknownUpper95', false],
      ]) {
        const value = m[metric][bound];
        if (value === null || (minimum ? value < thresholds[threshold] : value > thresholds[threshold])) issues.push(name + ': ' + metric + ' fails ' + threshold);
      }
    };
    check('overall', overall);
    for (const [dimension, values] of Object.entries(strata)) for (const [value, m] of Object.entries(values)) check(dimension + ':' + value, m);
  }
  if (!test.length) issues.push('No observed evaluation cases');
  return {
    version: 1, pin: input.pin, status: issues.length ? 'NOT_ACCEPTED' : 'CORPUS_GATE_PASSED',
    scope: 'Supplied observations/attestations only; not browser verification, reviewer authentication, population accuracy or public-release approval',
    intervalMethod: 'Wilson95 descriptive per case; independence assumption and merchant clustering require review',
    groupCounts: { merchants: new Set(test.map(c => c.merchantGroup)).size, products: new Set(test.map(c => c.productGroup)).size },
    overall, strata, issues: [...new Set(issues)],
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node tools/evaluation/metrics.mjs corpus.json');
    const result = evaluateCorpus(JSON.parse(fs.readFileSync(process.argv[2], 'utf8')));
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.status === 'CORPUS_GATE_PASSED' ? 0 : 2;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
