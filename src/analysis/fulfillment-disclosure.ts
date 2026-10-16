import { normalizeCommerceCharacters } from '../languages/commerce-text';
import type { EvidenceSignal } from '../types/evidence';
import {publicEvidenceUrl} from '../security/public-url';

export interface FulfillmentDisclosure {
  model:'supplier-direct'|'factory-direct';quote:string;sourceUrl:string;observedAt:string;
}
export function validFulfillmentDisclosure(value:unknown):value is FulfillmentDisclosure{
  if(!value||typeof value!=='object')return false;const v=value as FulfillmentDisclosure;
  return ['supplier-direct','factory-direct'].includes(v.model)&&typeof v.quote==='string'&&v.quote.length<=240&&typeof v.sourceUrl==='string'&&Boolean(publicEvidenceUrl(v.sourceUrl))&&typeof v.observedAt==='string'&&Number.isFinite(Date.parse(v.observedAt));
}
/** Merchant-authored logistics disclosure, not a fraud/quality warning. */
export function fulfillmentDisclosure(pages:Array<{text:string;url:string}>,observedAt:string):FulfillmentDisclosure|undefined{
  for(const page of pages.slice(0,5)){
    const text=normalizeCommerceCharacters(page.text.slice(0,100_000));
    const patterns=[
      /\b(?:we|our orders|your order|orders|this (?:item|product))[^.;!?]{0,55}(?:ship(?:ped|s)?|dispatch(?:ed)?|fulfill(?:ed)?)[^.;!?]{0,35}(?:directly|direct)[^.;!?]{0,35}(?:suppliers?|manufacturers?|factories|factory)\b/gi,
      /\b(?:ship(?:ped|s)?|dispatch(?:ed)?|fulfill(?:ed)?)[^.;!?]{0,25}(?:directly|direct)[^.;!?]{0,30}(?:from|by)\s+(?:our\s+|the\s+|a\s+)?(?:suppliers?|manufacturers?|factories|factory)\b/gi,
    ];
    for(const pattern of patterns)for(const hit of text.matchAll(pattern)){
      const context=text.slice(Math.max(0,hit.index-30),hit.index+hit[0].length+20);
      if(/\b(?:not|never|cannot|do not|does not)\b|["“”]|(?:customers?\s+say|reviews?|quote|claims? that)/i.test(context))continue;
      return {model:/suppliers?/.test(hit[0].toLowerCase())?'supplier-direct':'factory-direct',quote:hit[0].slice(0,240),sourceUrl:page.url,observedAt};
    }
  }
  return undefined;
}
export function fulfillmentDisclosureEvidence(value:FulfillmentDisclosure|undefined):EvidenceSignal[]{
  return value?[{id:'SUPPLIER_DIRECT_DISPATCH_DISCLOSED',family:'fulfillment',severity:'info',confidence:.86,weight:0,
    title:value.model==='supplier-direct'?'Supplier-direct dispatch disclosed':'Factory-direct dispatch disclosed',
    explanation:'The merchant describes direct dispatch from a supplier or factory. This is a useful logistics claim, not evidence of deception, product quality or verified original manufacture.',
    observedValue:value.quote,independentKey:'merchant-dispatch-disclosure',sourceKey:'merchant-dispatch-disclosure',
    provenance:{sourceUrl:value.sourceUrl,observedAt:value.observedAt,method:'Bounded merchant-authored dispatch wording'}}]:[];
}
