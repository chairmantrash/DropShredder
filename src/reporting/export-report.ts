import { pageSafety } from '../security/page-safety';
import type { DropShredderReport } from '../types/report';
import { publicEvidenceUrl, redactEvidenceText } from '../security/public-url';
import {validOriginAssessment} from '../analysis/north-america-origin';

const optionalText=(value:unknown)=>value===undefined || typeof value==='string';
const score=(value:unknown)=>value===null || (typeof value==='number' && Number.isFinite(value) && value>=0 && value<=100);
const risk=(value:unknown)=>typeof value==='string' && ['unknown','low','moderate','high'].includes(value);

export function readPanelReport(value:string):DropShredderReport|undefined {
  if(!value || value.length>2_000_000) return undefined;
  try{
    const p=JSON.parse(value) as DropShredderReport;
    if(p.version!==1 || !p.product || !publicEvidenceUrl(p.product.url) || !pageSafety(p.product.url).allowed || !p.verdict || !Array.isArray(p.evidence) || p.evidence.length>2000) return undefined;
    if(typeof p.product.title!=='string' || ![p.product.brand,p.product.mpn,p.product.gtin,p.product.capturedAt].every(optionalText)) return undefined;
    if(p.northAmerica!==undefined&&!validOriginAssessment(p.northAmerica)) return undefined;
    const v=p.verdict;
    if(!score(v.massResellLikelihood) || !score(v.dropshipLikelihood) || ![v.deceptionRisk,v.merchantRisk,v.manipulationRisk,v.fulfillmentRisk].every(risk) || typeof v.reason!=='string' || typeof v.severeWarningAllowed!=='boolean') return undefined;
    if(!p.evidence.every(e=>e && typeof e==='object' && typeof e.id==='string' && typeof e.title==='string' && typeof e.explanation==='string' && ['info','weak','moderate','strong','direct'].includes(e.severity)
      && ['provenance','fulfillment','pricing','scarcity','reviews','merchant','catalog','technology','identity','claims','quality','safety'].includes(e.family))) return undefined;
    return p;
  }catch{return undefined;}
}
/** Deliberate allowlist: no images, raw reviews, raw contact records, specifications or full page text. */
export function exportCurrentReport(report:DropShredderReport) {
  const p=report.product,v=report.verdict;
  return {schemaVersion:1,exportedAt:new Date().toISOString(),
    product:{url:publicEvidenceUrl(p.url),title:redactEvidenceText(p.title,300),brand:redactEvidenceText(p.brand,100),
      model:redactEvidenceText(p.mpn,100),gtin:redactEvidenceText(p.gtin,40),capturedAt:redactEvidenceText(p.capturedAt,40)},
    verdict:{massResellEvidenceScore:v.massResellLikelihood,dropshipEvidenceScore:v.dropshipLikelihood,
      deceptionRisk:v.deceptionRisk,merchantRisk:v.merchantRisk,manipulationRisk:v.manipulationRisk,
      fulfillmentRisk:v.fulfillmentRisk,severeWarningAllowed:v.severeWarningAllowed,reason:redactEvidenceText(v.reason)},
    northAmerica:validOriginAssessment(report.northAmerica)?{scope:report.northAmerica.scope,status:report.northAmerica.status,reviewedByUser:report.northAmerica.reviewedByUser,assessedAt:report.northAmerica.assessedAt,
      stages:report.northAmerica.stages.map(s=>({...s,sources:s.sources.map(publicEvidenceUrl)})),
      claims:report.northAmerica.claims.map(c=>({...c,quote:redactEvidenceText(c.quote,150),sourceUrl:publicEvidenceUrl(c.sourceUrl)})),
      limitation:'User-reviewed source coverage; no independent source authentication, product certification, quality verdict or legal-origin ruling.',reason:redactEvidenceText(report.northAmerica.reason,1000)}:undefined,
    evidence:report.evidence.slice(0,300).map(e=>({id:redactEvidenceText(e.id,100),family:e.family,severity:e.severity,
      title:redactEvidenceText(e.title,300),explanation:redactEvidenceText(e.explanation),observedValue:redactEvidenceText(e.observedValue),
      sourceUrl:publicEvidenceUrl(e.provenance?.sourceUrl),observedAt:redactEvidenceText(e.provenance?.observedAt,40),
      method:redactEvidenceText(e.provenance?.method,150)})),
    scope:{totalEvidence:report.evidence.length,exportedEvidence:Math.min(report.evidence.length,300),
      scores:'Heuristic evidence scores, not calibrated probabilities.',excluded:'Raw reviews, images, merchant raw contact records, product specifications and page text.'}};
}
