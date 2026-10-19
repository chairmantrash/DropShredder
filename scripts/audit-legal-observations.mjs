import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const DAY = 86_400_000;
const hosts = new Set(['www.ftc.gov', 'www.cpsc.gov', 'recalls-rappels.canada.ca',
  'competition-bureau.canada.ca', 'www.scc-csc.ca', 'sidof.segob.gob.mx',
  'www.justice.gov', 'www.gob.mx']);
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

// Research tooling only. Fresh public retrieval is not a complete-docket claim.
export function publicObservationState(record, asOf) {
  if (!validDate(asOf) || !validDate(record.refreshDueAt) || !validDate(record.sourceCheckedAt)) return 'uncertain';
  if (asOf < record.sourceCheckedAt) return 'uncertain';
  if (asOf >= record.refreshDueAt) return 'stale';
  if (!record.sources?.length || record.sources.some(source => !source.lastSuccessfulBodyRetrievalAt)) return 'unverified-body';
  return 'fresh-public-observation';
}

export function auditLegalObservations(ledger) {
  const errors = [];
  const check = (condition, message) => { if (!condition) errors.push(message); };
  check(ledger.version === 2 && validDate(ledger.date), 'version/date');
  check(ledger.policy?.runtimeImport === false && ledger.policy?.automaticRiskWeight === 0
    && ledger.policy?.fullDocketCoverage === false, 'research-only policy');
  const ids = new Set();
  for (const record of ledger.observations ?? []) {
    const fail = message => `${record.id}: ${message}`;
    check(typeof record.id === 'string' && !ids.has(record.id), fail('unique id'));
    ids.add(record.id);
    check(record.automaticRiskWeight === 0 && record.currentFullDocketVerified === false, fail('no automatic risk or full-docket assertion'));
    check(['US', 'CA', 'MX', 'US/CA'].includes(record.jurisdiction), fail('jurisdiction'));
    check(Array.isArray(record.subjects) && record.subjects.length > 0 && record.subjects.every(subject =>
      typeof subject.name === 'string' && subject.name.length > 0 && typeof subject.role === 'string'
      && typeof subject.captionIdentityChecked === 'boolean'), fail('party identity and role'));
    check(typeof record.scope === 'string' && record.scope.length > 0 && typeof record.currentStatusConfidence === 'string', fail('scope/confidence'));
    for (const field of ['eventDate', 'sourceCheckedAt', 'refreshDueAt', 'lastAttemptAt']) {
      check(validDate(record[field]), fail(field));
    }
    const interval = Date.parse(record.refreshDueAt) - Date.parse(record.sourceCheckedAt);
    check(interval > 0 && interval <= 7 * DAY, fail('seven-day maximum'));
    check(record.sourceCheckedAt <= ledger.date && record.lastAttemptAt <= ledger.date
      && record.eventDate <= ledger.date, fail('no future observation/event'));
    check(record.documentStage !== 'filed-complaint-pending-allegations'
      || record.meritsMisconductAdjudicationEstablished === false, fail('allegation is not adjudication'));
    check(!record.documentStage?.startsWith('entered-') || record.judgeEntryVerified !== false, fail('entry distinction'));
    const state = publicObservationState(record, ledger.date);
    check(record.freshnessState === state || (record.freshnessState === 'stale-inaccessible' && state === 'stale'), fail('freshness downgrade'));
    check(Array.isArray(record.sources) && record.sources.length > 0, fail('sources required'));
    for (const source of record.sources ?? []) {
      try {
        const url = new URL(source.url);
        check(url.protocol === 'https:' && hosts.has(url.hostname) && !url.username && !url.password
          && !url.port && !url.search && !url.hash, fail('public primary URL'));
      } catch { check(false, fail('source URL')); }
      check(validDate(source.checkedAt) && validDate(source.lastAttemptAt)
        && source.checkedAt <= source.lastAttemptAt && source.lastAttemptAt <= ledger.date, fail('source dates'));
      if (source.retrieval === 'page-retrieved') {
        check(source.lastSuccessfulBodyRetrievalAt === source.checkedAt, fail('successful retrieval date'));
      } else {
        check(source.lastSuccessfulBodyRetrievalAt === null, fail('failed attempt cannot authenticate body'));
      }
    }
  }
  check(ids.size > 0, 'observations required');
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ledger = JSON.parse(readFileSync(process.argv[2] ?? 'intelligence/legal-observations-20261019.json', 'utf8'));
  const errors = auditLegalObservations(ledger);
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log(`PASS: ${ledger.observations.length} research observations; no runtime import or automatic risk weight`);
}
