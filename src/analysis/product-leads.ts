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

import { localVectorSimilarity, lexicalOverlap } from './local-vectors';

/** Unscored candidates for deliberate user-added product references, never supplier attribution. */
export function approximateImportedProductLeads(current:ProductSnapshot,lists:SavedList[],now=Date.now()):EvidenceSignal[]{
  if(!current.title || current.title.length<18) return [];
  const entries:Array<{title:string;url:string;listId:string;score:number}>=[];
  for(const row of lists.slice(0,5)){
    const list=row.current.list;
    if(!Number.isFinite(Date.parse(list.expiresAt))||Date.parse(list.expiresAt)<=now) continue;
    for(const lead of list.records.slice(0,500)){
      const identity=compareProductIdentity(current,{gtin:lead.gtin,brand:lead.brand,mpn:lead.mpn,specifications:lead.attributes});
      if(!identity.compatible || identity.matches.length) continue;
      const overlap=lexicalOverlap(current.title,lead.title);
      if(overlap<.75) continue;
      const score=localVectorSimilarity(current.title,lead.title);
      if(score<.87) continue;
      entries.push({title:lead.title,url:lead.url,listId:list.id,score});
    }
  }
  return entries.sort((a,b)=>b.score-a.score).slice(0,5).map(lead=>({
    id:'LOCAL_TEXT_SIMILARITY_LEAD',family:'identity',severity:'info',confidence:.6,weight:0,
    title:'Similar product title in a user-supplied reference',
    explanation:'Local lexical feature-hash similarity suggests a possible comparison target. It does not establish matching product identity, common manufacturer, ownership, supply chain, original listing, fraud or copying direction.',
    observedValue:`${lead.title} • local title similarity ${Math.round(lead.score*100)}% (not probability) • ${lead.url}`,
    independentKey:`local-lexical:${lead.listId}:${lead.url}`,
    provenance:{sourceUrl:lead.url,observedAt:new Date(now).toISOString(),method:'local feature hashing and exact token overlap; imported reference; no external query'},
  }));
}

/** Exact reference graph; roles are never conflated into shared store ownership. */
export function importedEntityRoleGraph(current:ProductSnapshot,lists:SavedList[],now=Date.now()):EvidenceSignal[]{
  const edges=new Map<string,{role:'manufacturer'|'importer'|'seller';name:string;identifier?:string;sourceUrl:string;observedAt:string;count:number}>();
  for(const row of lists.slice(0,5)){
    if(Date.parse(row.current.list.expiresAt)<=now) continue;
    for(const lead of row.current.list.records.slice(0,500)){
      const m=compareProductIdentity(current,{gtin:lead.gtin,brand:lead.brand,mpn:lead.mpn,specifications:lead.attributes});
      if(!m.matches.length||!m.compatible) continue;
      for(const entity of lead.entities.slice(0,6)){
        // Authority comes from the independent source record, not a display
        // name or a cross-role alias guess; grouping is exact per role/source.
        const key=[entity.role,entity.identifier??'',entity.name,entity.sourceUrl].join('\0');
        const existing=edges.get(key);
        if(existing)existing.count++;
        else edges.set(key,{...entity,count:1});
      }
    }
  }
  const selected=[...edges.values()].slice(0,12);
  return selected.length?[{
    id:'IMPORTED_ENTITY_ROLE_GRAPH',family:'identity',severity:'info',confidence:.7,weight:0,
    title:'Sourced manufacturer, importer and seller roles in local reference records',
    explanation:'These are separate asserted roles from user-added, versioned reference records. Identical names are not proof of identical legal entities, beneficial ownership, factory location or a supply relationship. Verify each original record.',
    observedValue:selected.map(x=>`${x.role}: ${x.name}${x.identifier?' ['+x.identifier+']':''} — ${x.sourceUrl} (${x.observedAt})`).join(' • '),
    independentKey:'local-reference:entity-role-graph',
  }]:[];
}
