import type { ProductSnapshot } from '../types/product';
import type { EvidenceSignal } from '../types/evidence';
import type { SavedList } from '../intelligence/user-lists';
import { compareProductIdentity } from './product-identity';

/** Imported identifiers retrieve leads; no allegation, alias merge or score follows from a list. */
export function importedProductLeads(current:ProductSnapshot,lists:SavedList[],now=Date.now()):EvidenceSignal[]{
  const evidence:EvidenceSignal[]=[];
  for(const row of lists.slice(0,5)){
    const list=row.current.list;if(Date.parse(list.expiresAt)<=now||!Number.isFinite(Date.parse(list.expiresAt))) continue;
    for(const lead of list.records.slice(0,500)){
      const identity=compareProductIdentity(current,{gtin:lead.gtin,brand:lead.brand,mpn:lead.mpn,specifications:lead.attributes});
      if(!identity.compatible||!identity.matches.length) continue;
      evidence.push({id:'IMPORTED_PRODUCT_LEAD',family:'provenance',severity:'info',confidence:.8,weight:0,
        title:`Local reference: ${lead.title}`,
        explanation:'Matching identifiers retrieve this user-added reference. The list and seller claims are not independently authenticated product facts. Confirm the exact variant and original record; no score or merchant ownership is inferred.',
        observedValue:[identity.matches.join(', '),...lead.entities.map(e=>`${e.role}: ${e.name} [${e.identifier??'no legal identifier'}] — ${e.sourceUrl} (${e.observedAt})`)].join(' • '),
        independentKey:`imported-lead:${list.id}:${lead.id}`,sourceKey:list.sourceUrl,
        provenance:{sourceUrl:lead.url,observedAt:list.publishedAt,method:`User-added inert list ${list.id}, version ${list.version}; license ${list.license}`}});
      if(evidence.length>=12) return evidence;
    }
  }return evidence;
}
