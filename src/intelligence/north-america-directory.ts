import data from '../../intelligence/north-america-commerce-20261010.json';
import {publicEvidenceUrl} from '../security/public-url';
export const NORTH_AMERICA_DIRECTORY=data.outlets;
export const NORTH_AMERICA_RELATIONSHIPS=data.relationships;
export function regionalRecordFresh(row:{reviewedAt:string;freshnessDays:number},now=new Date()):boolean {
  const age=now.getTime()-Date.parse(row.reviewedAt+'T00:00:00Z');
  return Number.isFinite(age)&&age>=0&&age<=row.freshnessDays*86_400_000;
}
export function validateRegionalDirectory():boolean {
  const ids=new Set(NORTH_AMERICA_DIRECTORY.map(r=>r.id));
  return ids.size===NORTH_AMERICA_DIRECTORY.length&&NORTH_AMERICA_DIRECTORY.every(r=>
    publicEvidenceUrl(r.sourceUrl)===r.sourceUrl&&r.countries.every(c=>['US','CA','MX'].includes(c))&&r.summary&&r.limit&&r.freshnessDays>=30&&r.freshnessDays<=180&&Number.isFinite(Date.parse(r.reviewedAt+'T00:00:00Z')))
    &&NORTH_AMERICA_RELATIONSHIPS.every(e=>ids.has(e.fromId)&&ids.has(e.toId)&&e.riskWeight===0&&publicEvidenceUrl(e.sourceUrl)===e.sourceUrl);
}
