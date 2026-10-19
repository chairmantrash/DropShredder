import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// Repository tooling is JavaScript; no production import is added.
// @ts-expect-error no declaration file for research-only audit script
import {auditLegalObservations, publicObservationState} from '../scripts/audit-legal-observations.mjs';

const load = () => JSON.parse(readFileSync('intelligence/legal-observations-20261019.json', 'utf8'));
const find = (id: string) => load().observations.find((record: {id: string}) => record.id === id);

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
