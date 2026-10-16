import sources from '../../intelligence/standing-sources-20261010.json';
import {publicEvidenceUrl} from '../security/public-url';
export const STANDING_SOURCES=sources.sources;
export const STANDING_DIMENSIONS=['identity','consumer','enforcement','trade','sustainability','litigation','product'] as const;
export type StandingDimension=typeof STANDING_DIMENSIONS[number];
export type StandingRating='NOT_REVIEWED'|'INSUFFICIENT'|'FAVORABLE'|'MIXED'|'ADVERSE_RECORD';
export interface StandingTarget {legalName:string;domain:string;role:'merchant'|'manufacturer'|'shipper';listingUrl:string}
export interface StandingRecord {
 sourceId:string;sourceUrl:string;recordId:string;subjectName:string;subjectDomain:string;
 dimension:StandingDimension;outcome:string;observedAt:string;eventDate:string;detail:string;
 grade?:string;accredited?:boolean;scope:string;
 case?:{court:string;jurisdiction:string;partyRole:'defendant'|'respondent'|'plaintiff';category:'consumer-sale'|'product-safety'|'shipping-service'|'other'};
}
export interface StandingDossier {version:1;target:StandingTarget;records:StandingRecord[]}
export interface StandingAssessment {
 rating:StandingRating;reviewedByUser:boolean;target:StandingTarget;assessedAt:string;
 dimensions:Array<{dimension:StandingDimension;records:StandingRecord[]}>;
 currentRecords:number;excludedRecords:number;publisherFamilies:number;
}
const normalize=(s:string)=>s.trim().normalize('NFC').toLocaleLowerCase('en-US');
const text=(v:unknown,max=500):v is string=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&!/[\u0000-\u001f\u007f]/u.test(v);
function domain(v:unknown):v is string {
 return typeof v==='string'&&v.length<=253&&publicEvidenceUrl('https://'+v+'/')==='https://'+v+'/'&&new URL('https://'+v).hostname===v;
}
function date(v:unknown):v is string {return typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;}
function target(v:unknown):v is StandingTarget {
 if(!v||typeof v!=='object')return false;const t=v as StandingTarget;
 return text(t.legalName,200)&&domain(t.domain)&&['merchant','manufacturer','shipper'].includes(t.role)&&publicEvidenceUrl(t.listingUrl)===t.listingUrl;
}
function sourceFor(r:StandingRecord){return STANDING_SOURCES.find(s=>s.id===r.sourceId);}
function validRecord(v:unknown):v is StandingRecord {
 if(!v||typeof v!=='object')return false;const r=v as StandingRecord,s=sourceFor(r);
 if(!s||s.linkOnly||!text(r.sourceUrl,4096)||publicEvidenceUrl(r.sourceUrl)!==r.sourceUrl||!text(r.recordId,120)||!text(r.subjectName,200)||!domain(r.subjectDomain)||!date(r.observedAt)||!date(r.eventDate)||!text(r.detail,1000)||!text(r.scope,500))return false;
 if(r.dimension==='litigation'&&(!r.case||!text(r.case.court,200)||!text(r.case.jurisdiction,120)||!['defendant','respondent','plaintiff'].includes(r.case.partyRole)||!['consumer-sale','product-safety','shipping-service','other'].includes(r.case.category)))return false;
 const host=new URL(r.sourceUrl).hostname;
 return s.hosts.some(h=>host===h||host.endsWith('.'+h))&&s.dimensions.includes(r.dimension)&&s.outcomes.includes(r.outcome)
  &&(r.grade===undefined||text(r.grade,30))&&(r.accredited===undefined||typeof r.accredited==='boolean');
}
export function parseStandingDossier(input:string):StandingDossier {
 if(input.length>40_000)throw Error('Invalid standing dossier');const v=JSON.parse(input) as StandingDossier;
 if(!v||v.version!==1||!target(v.target)||!Array.isArray(v.records)||v.records.length>32||!v.records.every(validRecord))throw Error('Invalid standing dossier');
 // Copy only documented fields: JSON review/verified/rating assertions never pass through.
 return {version:1,target:{legalName:v.target.legalName,domain:v.target.domain,role:v.target.role,listingUrl:v.target.listingUrl},records:v.records.map(r=>({sourceId:r.sourceId,sourceUrl:r.sourceUrl,recordId:r.recordId,subjectName:r.subjectName,subjectDomain:r.subjectDomain,dimension:r.dimension,outcome:r.outcome,observedAt:r.observedAt,eventDate:r.eventDate,detail:r.detail,scope:r.scope,...(r.grade===undefined?{}:{grade:r.grade}),...(r.accredited===undefined?{}:{accredited:r.accredited}),...(r.dimension==='litigation'&&r.case?{case:{court:r.case.court,jurisdiction:r.case.jurisdiction,partyRole:r.case.partyRole,category:r.case.category}}:{})}))};
}
export function assessBusinessStanding(t:StandingTarget,dossier?:StandingDossier,reviewed=false,now=new Date()):StandingAssessment {
 const empty=():StandingAssessment=>({rating:reviewed?'INSUFFICIENT':'NOT_REVIEWED',reviewedByUser:reviewed,target:{...t},assessedAt:now.toISOString(),dimensions:STANDING_DIMENSIONS.map(dimension=>({dimension,records:[]})),currentRecords:0,excludedRecords:dossier?.records.length??0,publisherFamilies:0});
 const result=empty();
 if(!target(t)||!dossier||!target(dossier.target)||normalize(t.legalName)!==normalize(dossier.target.legalName)||t.domain!==dossier.target.domain||t.role!==dossier.target.role||t.listingUrl!==dossier.target.listingUrl)return result;
 const seen=new Set<string>();const records=dossier.records.filter(r=>{
  if(!validRecord(r)||normalize(r.subjectName)!==normalize(t.legalName)||r.subjectDomain!==t.domain)return false;
  const observed=Date.parse(r.observedAt+'T00:00:00Z'),age=now.getTime()-observed;
  if(age<0||age>sourceFor(r)!.freshnessDays*86_400_000||Date.parse(r.eventDate+'T00:00:00Z')>observed)return false;
  const key=JSON.stringify(r);
  if(seen.has(key))return false;seen.add(key);return true;
 });
 // A later observation/outcome of the same publisher record supersedes its old
 // snapshot. Equal-date contradictory snapshots stay visible and unresolved.
 const latest=records.filter(r=>!records.some(other=>other.recordId===r.recordId&&other.dimension===r.dimension&&(other.sourceId===r.sourceId||(r.dimension==='litigation'&&sourceFor(other)?.publisherFamily===sourceFor(r)?.publisherFamily&&other.case?.court===r.case?.court&&other.case?.jurisdiction===r.case?.jurisdiction))&&
  (other.observedAt>r.observedAt||(other.observedAt===r.observedAt&&other.eventDate>r.eventDate))));
 result.dimensions=STANDING_DIMENSIONS.map(dimension=>({dimension,records:latest.filter(r=>r.dimension===dimension)}));
 result.currentRecords=latest.length;result.excludedRecords=dossier.records.length-latest.length;
 result.publisherFamilies=new Set(latest.map(r=>sourceFor(r)!.publisherFamily)).size;
 if(!reviewed)return result;
 const favorable=latest.filter(r=>r.dimension==='consumer'&&r.sourceId==='bbb'&&r.outcome==='rating'&&/^(?:A[+-]?|B[+-]?)$/.test(r.grade??''));
 const identity=latest.filter(r=>r.dimension==='identity'&&r.outcome==='active-entity');
 const positive=favorable.some(f=>identity.some(i=>sourceFor(i)!.publisherFamily!==sourceFor(f)!.publisherFamily));
 // Litigation is context only for relevant defendant/respondent records. A case
 // against a different party, a plaintiff victory or unrelated IP dispute is not adverse.
 const cases=latest.filter(r=>r.dimension==='litigation'&&r.case?.partyRole!=='plaintiff'&&r.case?.category!=='other');
 const adverse=cases.some(r=>r.outcome==='final-adverse-judgment')||latest.some(r=>(r.dimension==='enforcement'&&['final-order','active-restriction','finding'].includes(r.outcome))||(r.sourceId==='bbb'&&r.dimension==='consumer'&&r.outcome==='rating'&&/^(?:D[+-]?|F)$/.test(r.grade??'')));
 const conflict=latest.some(r=>latest.some(other=>r!==other&&r.sourceId===other.sourceId&&r.recordId===other.recordId&&r.dimension===other.dimension&&(r.outcome!==other.outcome||r.grade!==other.grade)));
 const pending=cases.some(r=>['pending','appealed'].includes(r.outcome))||latest.some(r=>['allegation','warning','unresolved-pattern'].includes(r.outcome));
 result.rating=conflict?'MIXED':adverse?(positive?'MIXED':'ADVERSE_RECORD'):pending?'MIXED':positive?'FAVORABLE':'INSUFFICIENT';
 return result;
}
export function validateStandingSources():boolean {
 const ids=new Set(STANDING_SOURCES.map(s=>s.id));
 return ids.size===STANDING_SOURCES.length&&STANDING_SOURCES.every(s=>s.publisherFamily&&s.hosts.length&&s.hosts.every(domain)&&publicEvidenceUrl(s.url)===s.url&&date(s.reviewedAt)&&s.freshnessDays>=7&&s.freshnessDays<=90&&s.dimensions.every(d=>STANDING_DIMENSIONS.includes(d as StandingDimension))&&s.summary&&s.limit&&s.access&&(!s.linkOnly||s.outcomes.length===0));
}
