import type {ProductSnapshot} from '../types/product';
import type {SiteTextPage} from './merchant-origin';
import {normalizeGtin} from './product-identity';
import {publicEvidenceUrl, redactEvidenceText} from '../security/public-url';

export const ORIGIN_STAGES=['materials','components','processing','assembly','packaging','seller','dispatch','destination'] as const;
export type OriginStage=typeof ORIGIN_STAGES[number];
export type OriginStatus='UNKNOWN'|'CLAIMED'|'PARTIAL'|'DOCUMENTED'|'OUTSIDE_REGION'|'CONFLICTING';
export interface OriginClaim {stage:OriginStage;quote:string;sourceUrl:string;scope:'listing'|'store'}
export interface OriginDocument {
  stage:OriginStage;countries:string[];coverage:'complete'|'partial';
  kind:'bill-of-materials'|'audit'|'manufacturing-record'|'entity-record'|'carrier-pickup'|'delivery-record'|'claim'|'label'|'trade-certificate';
  sourceUrl:string;observedAt:string;expiresAt:string;detail:string;
}
export interface OriginDossier {
  schemaVersion:1;listingUrl:string;seller:string;
  identity:{gtin?:string;brand?:string;mpn?:string;variantId:string;specifications:Record<string,string>};
  documents:OriginDocument[];
}
export interface NorthAmericaAssessment {
  scope:'US-CA-MX';status:OriginStatus;reviewedByUser:boolean;assessedAt:string;
  claims:OriginClaim[];stages:Array<{stage:OriginStage;status:OriginStatus;countries:string[];sources:string[]}>;
  reason:string;
}
const DAYS=86_400_000;
const eligible:Record<OriginStage,OriginDocument['kind'][]>={
  materials:['bill-of-materials','audit'],components:['bill-of-materials','audit'],
  processing:['manufacturing-record','audit'],assembly:['manufacturing-record','audit'],
  packaging:['bill-of-materials','audit'],seller:['entity-record','audit'],
  dispatch:['carrier-pickup','audit'],destination:['delivery-record','audit'],
};
const kinds=[...new Set(Object.values(eligible).flat()),'claim','label','trade-certificate'];
const regional=(country:string)=>['US','CA','MX'].includes(country);
const text=(v:unknown,max=200):v is string=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
const object=(v:unknown):v is Record<string,unknown>=>Boolean(v&&typeof v==='object'&&!Array.isArray(v));
const date=(v:unknown):v is string=>text(v,40)&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().replace('.000Z','Z')===v.replace('.000Z','Z');
const exactText=(v:string|undefined)=>v?.normalize('NFKC').trim().toLowerCase();

/** Schema validation is not source authentication. A JSON field cannot grant reviewed status. */
export function parseOriginDossier(input:string):OriginDossier {
  if(input.length>50_000) throw Error('Origin file must be at most 50 KB.');
  const x:unknown=JSON.parse(input);
  if(!object(x)||x.schemaVersion!==1||!text(x.listingUrl,2048)||publicEvidenceUrl(x.listingUrl)!==x.listingUrl||!text(x.seller)||!object(x.identity)||!Array.isArray(x.documents)||x.documents.length<1||x.documents.length>64) throw Error('Invalid origin file.');
  const i=x.identity;
  if(typeof i.variantId!=='string'||i.variantId.length>200||!object(i.specifications)||Object.keys(i.specifications).length>40) throw Error('Invalid product identity.');
  if(i.gtin!==undefined&&(!text(i.gtin,40)||!normalizeGtin(i.gtin))) throw Error('Invalid product identity.');
  if(i.brand!==undefined&&!text(i.brand)||i.mpn!==undefined&&!text(i.mpn)||!i.gtin&&!(i.brand&&i.mpn)) throw Error('Invalid product identity.');
  const specifications:Record<string,string>={};
  for(const [k,v] of Object.entries(i.specifications)){if(!text(k,100)||!text(v,200)||['__proto__','constructor','prototype'].includes(k)) throw Error('Invalid product identity.');specifications[k]=v;}
  const documents:OriginDocument[]=x.documents.map(d=>{
    if(!object(d)||!ORIGIN_STAGES.includes(d.stage as OriginStage)||!['complete','partial'].includes(String(d.coverage))||!kinds.includes(String(d.kind))||!Array.isArray(d.countries)||d.countries.length<1||d.countries.length>12||!d.countries.every(c=>typeof c==='string'&&/^[A-Z]{2}$/.test(c))||!text(d.sourceUrl,2048)||publicEvidenceUrl(d.sourceUrl)!==d.sourceUrl||!date(d.observedAt)||!date(d.expiresAt)||!text(d.detail,1000)) throw Error('Invalid origin document.');
    return {stage:d.stage as OriginStage,countries:[...new Set(d.countries as string[])],coverage:d.coverage as OriginDocument['coverage'],kind:d.kind as OriginDocument['kind'],sourceUrl:d.sourceUrl,observedAt:d.observedAt,expiresAt:d.expiresAt,detail:redactEvidenceText(d.detail,1000)};
  });
  return {schemaVersion:1,listingUrl:x.listingUrl,seller:x.seller,identity:{gtin:i.gtin as string|undefined,brand:i.brand as string|undefined,mpn:i.mpn as string|undefined,variantId:i.variantId,specifications},documents};
}

export function originDossierMatches(product:ProductSnapshot,d:OriginDossier):boolean {
  // The exact listing, explicit seller and selected variant are essential on mixed marketplaces.
  if(publicEvidenceUrl(product.url)!==d.listingUrl||!product.seller||exactText(product.seller)!==exactText(d.seller)||(product.variantId??'')!==d.identity.variantId) return false;
  const p=product,i=d.identity;
  const pg=normalizeGtin(p.gtin),dg=normalizeGtin(i.gtin);
  if(pg&&dg&&pg!==dg) return false;
  for(const k of ['brand','mpn'] as const) if(p[k]&&i[k]&&exactText(p[k])!==exactText(i[k])) return false;
  const exact=Boolean(pg&&dg&&pg===dg)||Boolean(p.brand&&i.brand&&p.mpn&&i.mpn&&exactText(p.brand)===exactText(i.brand)&&exactText(p.mpn)===exactText(i.mpn));
  if(!exact) return false;
  const keys=new Set([...Object.keys(p.specifications??{}),...Object.keys(i.specifications)]);
  for(const k of keys) if(exactText(p.specifications?.[k])!==exactText(i.specifications[k])) return false;
  return true;
}

/** Finite phrase capture only. Original wording/qualifiers remain visible; no truth inferred. */
export function listingOriginClaims(product:ProductSnapshot,pageText:string,pages:SiteTextPage[]):OriginClaim[] {
  const patterns:Array<[OriginStage,RegExp]>=[
    ['assembly',/(?:made in|product of|assembled in|hecho en|fabricado en|ensamblado en|fabriqu[ée] au|fabriqu[ée] en|assembl[ée] au|produit du)\s+[^\n.;!?]{2,120}/giu],
    ['dispatch',/(?:ships? from|shipped from|env[ií]os? desde|enviado desde|exp[ée]di[ée] (?:depuis|du|de))\s+[^\n.;!?]{2,120}/giu],
    ['seller',/(?:seller (?:is )?based in|company is based in|business address|empresa ubicada en|sede en|si[èe]ge social)\s*[:\s]+[^\n.;!?]{2,120}/giu],
  ];
  const claims:OriginClaim[]=[];
  for(const page of [{text:pageText.slice(0,100_000),url:product.url,scope:'listing' as const},...pages.slice(0,4).map(p=>({...p,text:p.text.slice(0,80_000),scope:'store' as const}))]){
    const url=publicEvidenceUrl(page.url);if(!url) continue;
    for(const [stage,re] of patterns){re.lastIndex=0;let m:RegExpExecArray|null;let count=0;
      while(count++<8&&(m=re.exec(page.text))) claims.push({stage,quote:redactEvidenceText(m[0],150),sourceUrl:url,scope:page.scope});
    }
  }
  return claims.slice(0,40);
}

export function assessNorthAmerica(product:ProductSnapshot,claims:OriginClaim[]=[],dossier?:OriginDossier,reviewedByUser=false,now=new Date()):NorthAmericaAssessment {
  const match=Boolean(dossier&&originDossierMatches(product,dossier));
  const reviewed=Boolean(match&&reviewedByUser);
  const fresh=(d:OriginDocument)=>{const observed=Date.parse(d.observedAt),expires=Date.parse(d.expiresAt);return observed<=now.getTime()&&now.getTime()-observed<=180*DAYS&&expires>now.getTime()&&expires>observed&&expires-observed<=180*DAYS;};
  const stages=ORIGIN_STAGES.map(stage=>{
    const records=match?dossier!.documents.filter(d=>d.stage===stage&&fresh(d)):[];
    const reviewedRecords=reviewed?records.filter(d=>eligible[stage].includes(d.kind)):[];
    const supported=reviewedRecords.filter(d=>d.coverage==='complete');
    const countries=[...new Set(reviewedRecords.flatMap(d=>d.countries))];
    const inside=supported.some(d=>d.countries.every(regional)),outside=reviewedRecords.some(d=>d.countries.some(c=>!regional(c)));
    const status:OriginStatus=inside&&outside?'CONFLICTING':outside?'OUTSIDE_REGION':supported.length?'DOCUMENTED':records.length?'PARTIAL':claims.some(c=>c.stage===stage)?'CLAIMED':'UNKNOWN';
    return {stage,status,countries,sources:[...new Set(records.map(d=>d.sourceUrl))].slice(0,8)};
  });
  const status:OriginStatus=stages.some(s=>s.status==='CONFLICTING')?'CONFLICTING':stages.some(s=>s.status==='OUTSIDE_REGION')?'OUTSIDE_REGION':stages.every(s=>s.status==='DOCUMENTED')?'DOCUMENTED':stages.some(s=>s.status==='DOCUMENTED'||s.status==='PARTIAL')?'PARTIAL':claims.length?'CLAIMED':'UNKNOWN';
  return {scope:'US-CA-MX',status,reviewedByUser:reviewed,assessedAt:now.toISOString(),claims:claims.slice(0,40),stages,
    reason:dossier&&!match?'The origin file does not match this exact listing, seller and selected product.':status==='DOCUMENTED'?'All eight stages are covered by user-reviewed documents for this product. Source authenticity and completeness are not independently certified by DropShredder.':'Incomplete, expired or conflicting evidence cannot establish an entirely North American product and sale.'};
}

export function validOriginAssessment(x:unknown):x is NorthAmericaAssessment {
  if(!object(x)||x.scope!=='US-CA-MX'||!['UNKNOWN','CLAIMED','PARTIAL','DOCUMENTED','OUTSIDE_REGION','CONFLICTING'].includes(String(x.status))||typeof x.reviewedByUser!=='boolean'||!date(x.assessedAt)||!text(x.reason,1000)||!Array.isArray(x.claims)||x.claims.length>40||!Array.isArray(x.stages)||x.stages.length!==8) return false;
  if(x.status==='DOCUMENTED'&&(!x.reviewedByUser||!x.stages.every(s=>object(s)&&s.status==='DOCUMENTED'&&Array.isArray(s.countries)&&s.countries.length>0&&s.countries.every(c=>typeof c==='string'&&regional(c))&&Array.isArray(s.sources)&&s.sources.length>0)))return false;
  return x.stages.every((s,n)=>object(s)&&s.stage===ORIGIN_STAGES[n]&&['UNKNOWN','CLAIMED','PARTIAL','DOCUMENTED','OUTSIDE_REGION','CONFLICTING'].includes(String(s.status))&&Array.isArray(s.countries)&&s.countries.length<=768&&s.countries.every(c=>typeof c==='string'&&/^[A-Z]{2}$/.test(c))&&Array.isArray(s.sources)&&s.sources.length<=8&&s.sources.every(u=>typeof u==='string'&&publicEvidenceUrl(u)===u))&&x.claims.every(c=>object(c)&&ORIGIN_STAGES.includes(c.stage as OriginStage)&&text(c.quote,150)&&typeof c.sourceUrl==='string'&&publicEvidenceUrl(c.sourceUrl)===c.sourceUrl&&['store','listing'].includes(String(c.scope)));
}
