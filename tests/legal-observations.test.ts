import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// Repository tooling is JavaScript; no production import is added.
// @ts-expect-error no declaration file for research-only audit script
import {auditLegalObservations, publicObservationState, summarizeFreshness} from '../scripts/audit-legal-observations.mjs';

const load = () => JSON.parse(readFileSync('intelligence/legal-observations-20261019.json', 'utf8'));
const find = (id: string) => load().observations.find((record: {id: string}) => record.id === id);

test('current refresh validates and failed Mexican body attempts keep original clocks', () => {
  const ledger = JSON.parse(readFileSync('intelligence/legal-observations-20261026.json', 'utf8'));
  assert.deepEqual(auditLegalObservations(ledger), []);
  assert.deepEqual(summarizeFreshness(ledger, '2026-10-26'), {asOf: '2026-10-26', fresh: 20, stale: 2, unverified: 0, uncertain: 0});
  for (const record of ledger.observations.filter((r: {id: string}) => r.id.startsWith('mexico-ford'))) {
    assert.ok(record.sourceCheckedAt < '2026-10-26');
    assert.equal(record.lastAttemptAt, '2026-10-26');
  }
});
test('historical metadata success cannot hide current expiry', () => {
  assert.equal(summarizeFreshness(load(), '2026-10-26').fresh, 0);
  assert.throws(() => summarizeFreshness(load(), '2026-02-31'));
});
test('identifier-less recall stays product scoped and new complaint remains allegations', () => {
  const ledger = JSON.parse(readFileSync('intelligence/legal-observations-20261026.json', 'utf8'));
  const recall = ledger.observations.find((r: {id: string}) => r.id === 'us-costway-convertible-highchair-recall');
  assert.deepEqual(recall.models, []);
  assert.equal(recall.subjects[0].role, 'retailer-dba-Costway');
  const complaint = ledger.observations.find((r: {id: string}) => r.id === 'us-govassist-passport-complaint');
  assert.equal(complaint.meritsMisconductAdjudicationEstablished, false);
  assert.equal(complaint.documentStage, 'filed-complaint-pending-allegations');
});

test('dated legal ledger passes public-source, identity, date, scope and neutral-weight checks', () => {
  assert.deepEqual(auditLegalObservations(load()), []);
});
test('refresh expires on due date and invalid/future observations stay uncertain', () => {
  const record = find('us-reps-bots-complaint');
  assert.equal(publicObservationState(record, '2026-10-25'), 'fresh-public-observation');
  assert.equal(publicObservationState(record, '2026-10-26'), 'stale');
  assert.equal(publicObservationState(record, '2026-10-18'), 'uncertain');
  assert.equal(publicObservationState(record, '2026-02-31'), 'uncertain');
});
test('failed body rechecks neither reset the old clock nor authenticate a new lead', () => {
  const old = find('mexico-ford-recall-lead');
  assert.equal(old.sourceCheckedAt, '2026-10-12');
  assert.equal(old.lastAttemptAt, '2026-10-19');
  assert.equal(publicObservationState(old, '2026-10-19'), 'stale');
  assert.equal(publicObservationState(find('mexico-ford-camera-recall-lead'), '2026-10-19'), 'unverified-body');
});
test('metadata audit rejects false freshness, automatic weighting and allegation laundering', () => {
  for (const field of ['freshnessState', 'automaticRiskWeight', 'meritsMisconductAdjudicationEstablished']) {
    const ledger = load();
    const record = ledger.observations.find((entry: {id: string}) => entry.id === 'us-reps-bots-complaint');
    record[field] = field === 'freshnessState' ? 'stale' : field === 'automaticRiskWeight' ? 10 : true;
    assert.ok(auditLegalObservations(ledger).length > 0);
  }
  const ledger = load(); ledger.observations[0].refreshDueAt = '2026-10-27';
  assert.ok(auditLegalObservations(ledger).length > 0);
});
test('metadata audit rejects lookalike hosts, query credentials and impossible source dates', () => {
  for (const url of ['https://www.ftc.gov.attacker.example/case', 'https://www.ftc.gov/case?key=secret', 'http://www.ftc.gov/case']) {
    const ledger = load(); ledger.observations[0].sources[0].url = url;
    assert.ok(auditLegalObservations(ledger).length > 0);
  }
  const ledger = load(); ledger.observations[0].sources[0].checkedAt = '2026-02-31';
  assert.ok(auditLegalObservations(ledger).length > 0);
});
test('procedural closure, redress, proposed orders and distinct entity labels remain separate', () => {
  assert.equal(find('canada-scc-42425').documentStage, 'withdrawn-leave-application-file-closed');
  assert.equal(find('canada-scc-42425').meritsMisconductAdjudicationEstablished, false);
  for (const id of ['us-goat-shipping-redress', 'us-walmart-money-transfer-redress']) {
    assert.equal(find(id).judgeEntryVerified, false);
    assert.equal(find(id).meritsMisconductAdjudicationEstablished, false);
  }
  const gildan = find('us-gildan-ss-closed-inquiry');
  assert.equal(gildan.documentStage, 'investigation-closed-after-contract-amendment');
  assert.ok(gildan.subjects.every((subject: {captionIdentityChecked: boolean}) => !subject.captionIdentityChecked));
});
test('cross-border recall retains one event family and jurisdiction-specific model sets', () => {
  const recall = find('us-ca-dr-power-recall');
  assert.equal(recall.sharedEventFamily, 'dr-power-trimmers-20261008');
  assert.equal(recall.modelsByJurisdiction.US.length, 8);
  assert.equal(recall.modelsByJurisdiction.CA.length, 3);
  assert.ok(!recall.modelsByJurisdiction.CA.includes('T4X1076DMNR'));
});

test('oldest successful source expires even when record summary was redated', () => {
  const record = find('us-reps-bots-complaint');
  Object.assign(record.sources[0], {checkedAt: '2026-10-18', lastSuccessfulBodyRetrievalAt: '2026-10-18'});
  assert.equal(publicObservationState(record, '2026-10-24'), 'fresh-public-observation');
  assert.equal(publicObservationState(record, '2026-10-25'), 'stale');
  const ledger = load(); ledger.observations = [record];
  assert.ok(auditLegalObservations(ledger).some((error: string) => error.includes('oldest retrieved source')));
});
test('invalid success dates and failed retrieval strings cannot authenticate a source body', () => {
  for (const date of ['2026-02-31', '2026-10-21', 'not-a-date']) {
    const record = find('us-reps-bots-complaint');
    record.sources[0].lastSuccessfulBodyRetrievalAt = date;
    assert.equal(publicObservationState(record, '2026-10-20'), 'uncertain');
  }
  const record = find('us-reps-bots-complaint');
  record.sources[0].retrieval = 'body-fetch-error-search-excerpt-only';
  assert.equal(publicObservationState(record, '2026-10-20'), 'unverified-body');
  const ledger = load(); ledger.observations = [record];
  assert.ok(auditLegalObservations(ledger).length > 0);
});
test('proposed settlement and closure metadata cannot become adverse merits findings', () => {
  for (const id of ['ftc-greenway', 'us-goat-shipping-redress', 'us-gildan-ss-closed-inquiry', 'canada-scc-42425']) {
    const ledger = load();
    ledger.observations.find((record: {id: string}) => record.id === id).meritsMisconductAdjudicationEstablished = true;
    assert.ok(auditLegalObservations(ledger).length > 0);
  }
});
test('database publication cutoff is separate from its retrieval date', () => {
  const ledger = load();
  ledger.sourceCoverageChecks.find((source: {publishedCoverageEnd?: string}) => source.publishedCoverageEnd).publishedCoverageEnd = '2026-10-20';
  assert.ok(auditLegalObservations(ledger).length > 0);
});
test('additive supplement validates without refreshing or duplicating earlier observations', () => {
  const supplement = JSON.parse(readFileSync('intelligence/legal-observations-20261020.json', 'utf8'));
  assert.deepEqual(auditLegalObservations(supplement), []);
  assert.equal(supplement.previousSnapshot, 'intelligence/legal-observations-20261019.json');
  const previousIds = new Set(load().observations.map((record: {id: string}) => record.id));
  assert.ok(supplement.observations.every((record: {id: string}) => !previousIds.has(record.id)));
  assert.equal(publicObservationState(find('us-reps-bots-complaint'), '2026-10-26'), 'stale');
});
test('manufacturing antitrust complaints and scheduled hearings stay outside adverse merits findings', () => {
  const supplement = JSON.parse(readFileSync('intelligence/legal-observations-20261020.json', 'utf8'));
  const playpower = supplement.observations.find((record: {id: string}) => record.id === 'us-playpower-burke-merger-complaint');
  assert.equal(playpower.category, 'other');
  assert.equal(playpower.subjects.filter((subject: {role: string}) => subject.role === 'defendant').length, 10);
  for (const record of supplement.observations) {
    const modified = {...supplement, observations: [{...record, meritsMisconductAdjudicationEstablished: true}]};
    assert.ok(auditLegalObservations(modified).length > 0);
  }
});
