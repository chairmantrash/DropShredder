import { normalizeCommerceCharacters, localizedNegation } from '../languages/commerce-text';
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
  if(!Number.isFinite(Date.parse(observedAt)))return undefined;
  for(const page of pages.slice(0,5)){
    const sourceUrl=publicEvidenceUrl(page.url);if(!sourceUrl)continue;
    const text=normalizeCommerceCharacters(page.text.slice(0,100_000));
    const patterns=[
      /\b(?:ship(?:ped|s)?|dispatch(?:ed|es)?|fulfill(?:ed|s)?)[^.;!?]{0,55}\b(?:directly|direct)\b[^.;!?]{0,45}\b(?:from|by)\s+(?:(?:our|the|a|partner)\s+){0,2}(?:suppliers?|vendors?|manufacturers?|factories|factory)\b/gi,
      /\b(?:(?:our|the|a)\s+)?(?:suppliers?|vendors?|manufacturers?|factories|factory)\b[^.;!?]{0,30}\b(?:ship(?:ped|s)?|dispatch(?:ed|es)?|fulfill(?:ed|s)?)[^.;!?]{0,75}\b(?:directly|direct)\b/gi,
    ];
    for(const pattern of patterns)for(const hit of text.matchAll(pattern)){
      // Assess the dispatch clause, not an unrelated sentence (e.g. no pickup
      // or no tracking emails). A supplier-to-retailer stock delivery does not
      // describe direct dispatch to this store's customers.
      const start=hit.index,end=start+hit[0].length;
      const before=text.slice(Math.max(0,start-180),start).split(/[.;!?。！？]/).at(-1)!;
      const after=text.slice(end,end+180).split(/[.;!。！]/)[0]!;
      const clause=before+hit[0]+after;
      if(localizedNegation(before)||localizedNegation(hit[0].split(/\bdirect(?:ly)?\b/i)[0]!)||
        /\b(?:don|doesn|didn|can|won|isn|aren)['’]t\s+(?:(?:ever|be|being|always)\s+)?(?:ship(?:ped|s)?|dispatch(?:ed|es)?|fulfill(?:ed|s)?)\b/i.test(before+hit[0])||
        /\?|["“”]|(?:^|\s)[‘'](?=\S)|\b(?:customers?\s+(?:say|said|wrote)|reviews?|quote|claims? that|means|defined as|for example|if|would|could|might|plan(?:s|ned)?\s+to|intend\s+to|hope\s+to)\b/i.test(clause)||
        /\b(?:to|into)\s+(?:(?:our|your|the|a|their)\s+)?(?:own\s+)?(?:warehouses?|distribution\s+cent(?:er|re)s?|retail\s+stores?)\b/i.test(clause))continue;
      // Reversed subject needs a consumer destination; "supplier ships
      // directly" alone leaves the recipient unresolved.
      if(pattern===patterns[1]&&!/\b(?:to\s+(?:you|customers?|buyers?)|your\s+(?:orders?|door|address))\b/i.test(clause))continue;
      return {model:/\b(?:suppliers?|vendors?)\b/i.test(hit[0])?'supplier-direct':'factory-direct',quote:hit[0].slice(0,240),sourceUrl,observedAt};
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
