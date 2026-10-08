import type { Contradiction, EvidenceSignal } from '../types/evidence';
import type { ExtractedClaim } from './claims';
import { sameJurisdiction } from './merchant-origin';

export interface DomainAgeObservation {
  registeredAt?:string;
  source:string;
}

export interface FulfillmentObservation {
  origin?:string;
  carrier?:string;
  routeText?:string;
  source:string;
}

export function businessAgeContradictions(
  claims:ExtractedClaim[],
  domain:DomainAgeObservation,
):Contradiction[] {
  const claim=claims.find(c=>c.kind==='business-age' && c.normalizedValue);
  if(!claim?.normalizedValue || !domain.registeredAt) return [];

  const claimedYear=Number(claim.normalizedValue);
  const registeredYear=new Date(domain.registeredAt).getUTCFullYear();
  if(!Number.isFinite(claimedYear) || !Number.isFinite(registeredYear)) return [];
  if(registeredYear<=claimedYear+1) return [];

  return [{
    id:'BUSINESS_AGE_CONFLICT',
    claim:claim.text,
    observation:`Domain registration observed in ${registeredYear} via ${domain.source}`,
    confidence:.88,
    explanation:'The store says it has been around longer than this website. It may have changed websites, so check before assuming the claim is false.',
    independentKey:'business-age-domain',
  }];
}

export function fulfillmentContradictions(
  claims:ExtractedClaim[],
  observation:FulfillmentObservation,
):Contradiction[] {
  const claim=claims.find(c=>c.kind==='ships-from' && c.normalizedValue);
  if(!claim?.normalizedValue || !observation.origin) return [];

  if(sameJurisdiction(claim.normalizedValue,observation.origin)) return [];

  return [{
    id:'FULFILLMENT_ORIGIN_CONFLICT',
    claim:claim.text,
    observation:[observation.origin,observation.carrier,observation.routeText].filter(Boolean).join(' • '),
    confidence:.82,
    explanation:'Observed fulfillment-origin evidence appears inconsistent with the seller\'s explicit shipping-origin claim. Carrier routing and third-party logistics can create legitimate exceptions, so corroboration is required.',
    independentKey:'fulfillment-origin-claim',
  }];
}

export function contradictionEvidence(items:Contradiction[]):EvidenceSignal[] {
  return items.map(item=>({
    id:item.id,
    family:item.id.includes('FULFILLMENT')?'fulfillment':'claims',
    severity:'strong',
    confidence:item.confidence,
    weight:24,
    title:'The seller’s story doesn’t line up',
    explanation:item.explanation,
    observedValue:`Seller says: ${item.claim} | We found: ${item.observation}`,
    independentKey:item.independentKey,
  }));
}
