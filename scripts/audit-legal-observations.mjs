import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const DAY = 86_400_000;
const hosts = new Set(['www.ftc.gov', 'www.cpsc.gov', 'recalls-rappels.canada.ca',
  'competition-bureau.canada.ca', 'www.scc-csc.ca', 'sidof.segob.gob.mx',
  'www.justice.gov', 'www.gob.mx', 'www.canada.ca', 'ct-tc.gc.ca']);
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

// Research tooling only. Fresh public retrieval is not a complete-docket claim.
export function publicObservationState(record, asOf) {
  if (!validDate(asOf) || !validDate(record.refreshDueAt) || !validDate(record.sourceCheckedAt)) return 'uncertain';
  if (asOf < record.sourceCheckedAt) return 'uncertain';
  const interval = Date.parse(record.refreshDueAt) - Date.parse(record.sourceCheckedAt);
  if (!(interval > 0 && interval <= 7 * DAY)) return 'uncertain';
  if (asOf >= record.refreshDueAt) return 'stale';
  if (!Array.isArray(record.sources) || !record.sources.length) return 'unverified-body';
  // A new summary date must never launder an older or failed source lookup.
  let unverified = false;
  let stale = false;
  for (const source of record.sources) {
    if (!source || !validDate(source.checkedAt) || !validDate(source.lastAttemptAt)
      || source.checkedAt > source.lastAttemptAt || source.lastAttemptAt > asOf) return 'uncertain';
    if (source.retrieval !== 'page-retrieved' || source.lastSuccessfulBodyRetrievalAt === null) {
      unverified = true;
      continue;
    }
    if (!validDate(source.lastSuccessfulBodyRetrievalAt)
      || source.lastSuccessfulBodyRetrievalAt !== source.checkedAt) return 'uncertain';
    if (Date.parse(asOf) - Date.parse(source.lastSuccessfulBodyRetrievalAt) >= 7 * DAY) stale = true;
  }
  if (stale) return 'stale';
  if (unverified) return 'unverified-body';
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
    check(!/pending-allegations|proposed|redress|investigation-closed|withdrawn|hearing-scheduled/.test(record.documentStage)
      || record.meritsMisconductAdjudicationEstablished === false, fail('procedure or agreement is not adverse adjudication'));
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
        check(validDate(source.lastSuccessfulBodyRetrievalAt)
          && source.lastSuccessfulBodyRetrievalAt === source.checkedAt, fail('successful retrieval date'));
        check(Date.parse(record.refreshDueAt) <= Date.parse(source.checkedAt) + 7 * DAY,
          fail('record expiry cannot outlive oldest retrieved source'));
      } else {
        check(source.lastSuccessfulBodyRetrievalAt === null, fail('failed attempt cannot authenticate body'));
      }
    }
  }
  for (const source of ledger.sourceCoverageChecks ?? []) {
    check(validDate(source.attemptedAt) && source.attemptedAt <= ledger.date, 'coverage attempt date');
    if (source.publishedCoverageEnd) {
      check(validDate(source.publishedCoverageEnd) && source.publishedCoverageEnd <= source.attemptedAt,
        'published coverage cutoff cannot be a future access date');
    }
  }
  check(ids.size > 0, 'observations required');
  return errors;
}

export function summarizeFreshness(ledger, asOf) {
  if (!validDate(asOf)) throw new Error('A valid YYYY-MM-DD observation date is required');
  const counts = {asOf, fresh: 0, stale: 0, unverified: 0, uncertain: 0};
  for (const record of ledger.observations) {
    const state = publicObservationState(record, asOf);
    if (state === 'fresh-public-observation') counts.fresh++;
    else if (state === 'stale') counts.stale++;
    else if (state === 'unverified-body') counts.unverified++;
    else counts.uncertain++;
  }
  return counts;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ledger = JSON.parse(readFileSync(process.argv[2] ?? 'intelligence/legal-observations-20261019.json', 'utf8'));
  const errors = auditLegalObservations(ledger);
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else {
    console.log(`Metadata PASS: ${ledger.observations.length} research observations; snapshot ${ledger.date}; no runtime import or automatic risk weight`);
    // An explicit assessment date exposes expiration without rewriting historical receipts.
    console.log(JSON.stringify(summarizeFreshness(ledger, process.argv[3] ?? ledger.date)));
  }
}
