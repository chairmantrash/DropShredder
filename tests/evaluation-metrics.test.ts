import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCorpus, rate } from '../tools/evaluation/metrics.mjs';

const sourceCommit = 'a'.repeat(40), artifactSha256 = 'b'.repeat(64);
const makeCase = (id: string, truth: string, prediction: string) => ({
  id, truth, prediction, merchantGroup: id, productGroup: id,
  category: 'apparel', platform: 'custom', language: 'en',
  labelReviewer: 'independent-fixture-reviewer', observationRef: 'owned-test-observation',
  truthRefs: ['owned-test-ground-truth'], sourceCommit, artifactSha256,
});
const corpus = (cases: ReturnType<typeof makeCase>[]) => ({
  version: 1, pin: { sourceCommit, artifactSha256 },
  provenance: { independentGroundTruth: true, rightsCleared: true, thresholdApproval: 'owned test configuration', clusterDependenceReviewed: true },
  calibrationGroups: { merchants: [] as string[], products: [] as string[] },
  requiredStrata: { category: ['apparel'], platform: ['custom'], language: ['en'] },
  thresholds: { minSamples: 2, minPrecisionLower95: 0, minRecallLower95: 0, maxFalsePositiveUpper95: 1, maxUnknownUpper95: 1 },
  cases,
});

test('metrics count abstained positives as missed warnings and bound unresolved warning precision', () => {
  const r = evaluateCorpus(corpus([
    makeCase('tp1', 'warranted', 'warning'), makeCase('tp2', 'warranted', 'warning'),
    makeCase('fp', 'benign', 'warning'), makeCase('tn', 'benign', 'no-warning'),
    makeCase('fn', 'warranted', 'unknown'), makeCase('unresolved', 'unresolved', 'warning'),
  ]));
  assert.equal(r.overall.adjudicatedPrecision.estimate, 2 / 3);
  assert.equal(r.overall.worstCasePrecision.estimate, 1 / 2);
  assert.equal(r.overall.recall.estimate, 2 / 3);
  assert.equal(r.overall.falsePositiveRate.estimate, 1 / 2);
  assert.equal(r.overall.unknownShare.estimate, 1 / 6);
  assert.equal(r.overall.missedWarnings, 1);
  assert.equal(r.overall.unresolvedWarnings, 1);
});

test('zero observed errors do not produce zero uncertainty and empty denominators remain unknown', () => {
  assert.ok(Math.abs(rate(0, 100).upper95! - 0.03699349820698568) < 1e-12);
  assert.ok(Math.abs(rate(100, 100).lower95! - 0.9630065017930143) < 1e-12);
  assert.equal(rate(0, 0).estimate, null);
  assert.equal(rate(0, 0).lower95, null);
});

test('missing language strata fail even when overall observations look perfect', () => {
  const c = corpus([makeCase('positive', 'warranted', 'warning'), makeCase('negative', 'benign', 'no-warning')]);
  c.requiredStrata.language.push('hi');
  const r = evaluateCorpus(c);
  assert.equal(r.status, 'NOT_ACCEPTED');
  assert.ok(r.issues.some((x: string) => x.includes('language:hi')));
  assert.equal(r.strata.language!.hi!.samples, 0);
});

test('merchant or product leakage into calibration blocks corpus acceptance', () => {
  const c = corpus([makeCase('positive', 'warranted', 'warning'), makeCase('negative', 'benign', 'no-warning')]);
  c.calibrationGroups.merchants.push('positive'); c.calibrationGroups.products.push('negative');
  const r = evaluateCorpus(c);
  assert.equal(r.status, 'NOT_ACCEPTED');
  assert.ok(r.issues.includes('Calibration leakage: positive'));
  assert.ok(r.issues.includes('Calibration leakage: negative'));
});

test('reused old artifacts, duplicate samples and unsupported labels are refused', () => {
  const c = corpus([makeCase('positive', 'warranted', 'warning'), makeCase('negative', 'benign', 'no-warning')]);
  const positive = c.cases[0]!, negative = c.cases[1]!;
  positive.sourceCommit = 'c'.repeat(40);
  assert.throws(() => evaluateCorpus(c), /Mixed or unpinned/);
  positive.sourceCommit = sourceCommit; negative.id = 'positive';
  assert.throws(() => evaluateCorpus(c), /Duplicate/);
  negative.id = 'negative'; negative.truth = 'guessed';
  assert.throws(() => evaluateCorpus(c), /Invalid truth/);
});

test('independence, rights and threshold approval cannot be replaced by good fixture metrics', () => {
  const c = corpus([makeCase('positive', 'warranted', 'warning'), makeCase('negative', 'benign', 'no-warning')]);
  c.provenance.independentGroundTruth = false; c.provenance.rightsCleared = false; c.provenance.thresholdApproval = '';
  const r = evaluateCorpus(c);
  assert.equal(r.status, 'NOT_ACCEPTED');
  assert.ok(r.issues.includes('Independent ground truth not attested'));
  assert.ok(r.issues.includes('Corpus rights not cleared'));
  assert.ok(r.issues.includes('Owner threshold approval missing'));
});

test('empty data and missing thresholds fail while the scoped approved corpus gate can pass', () => {
  const empty = evaluateCorpus(corpus([]));
  assert.equal(empty.status, 'NOT_ACCEPTED');
  assert.equal(empty.overall.worstCasePrecision.estimate, null);
  const c = corpus([makeCase('positive', 'warranted', 'warning'), makeCase('negative', 'benign', 'no-warning')]);
  assert.equal(evaluateCorpus(c).status, 'CORPUS_GATE_PASSED');
  assert.equal(evaluateCorpus({ ...c, thresholds: null }).status, 'NOT_ACCEPTED');
});
