import {canonicalCommerceText} from '../languages/commerce-text';
import type { EvidenceSignal } from '../types/evidence';
import type { ProductSnapshot } from '../types/product';
import { matchRegulatoryRecord, type RegulatoryRecord } from './regulatory-match';

export const SAFETY_REVIEWED_AT='2026-10-08';
/** Small reviewed subset, not a comprehensive/current recall database or brand blacklist. */
export const FOCUSED_SAFETY_RECORDS:RegulatoryRecord[]=[
  ...['A1647','A1652','A1257','A1681','A1689'].map(model=>({
    authority:'CPSC' as const,recordId:'25-466',brand:'Anker',model,
    title:'Anker power banks',recalledAt:'2025-09-18',requiresOfficialSerialCheck:true,
    url:'https://www.cpsc.gov/Recalls/2025/Anker-Power-Banks-Recalled-Due-to-Fire-and-Burn-Hazards-Manufactured-by-Anker-Innovations-1',
  })),
  {authority:'CPSC',recordId:'26-199',brand:'Frigidaire',model:'EFMIS121',
    title:'Frigidaire-brand minifridges',recalledAt:'2026-01-15',
    serialRanges:[{prefix:'A',start:'2001',end:'2310'}],requiredAttributes:{color:['red'],retailer:['Target']},
    url:'https://www.cpsc.gov/Recalls/2026/Curtis-International-Expands-Recall-of-Frigidaire-brand-Minifridges-Due-to-Fire-and-Burn-Hazards'},
];

export function focusedSafetyEvidence(product:ProductSnapshot):EvidenceSignal[] {
  const title=canonicalCommerceText(product.title??'',1000);
  if(/\b(?:case|cover|sleeve|stand|replacement|cable|adapter)\b/i.test(title)) return [];
  const out:EvidenceSignal[]=[],seen=new Set<string>();
  for(const record of FOCUSED_SAFETY_RECORDS){
    if(seen.has(record.recordId)) continue;
    if(record.brand==='Anker' && !/\b(?:power\s*bank|portable charger)\b/i.test(title)) continue;
    if(record.brand==='Frigidaire' && !/\b(?:mini\s*fridge|mini refrigerator)\b/i.test(title)) continue;
    const titleTokens=title.toLowerCase().split(/[^a-z0-9_-]+/);
    const brand=product.brand || (titleTokens.includes(record.brand!.toLowerCase())?record.brand:undefined);
    // Exact bounded token fallback. A shared prefix/suffixed model is not the notice's model.
    const model=product.mpn || title.split(/[^a-z0-9_-]+/i).find(token=>token.toLowerCase()===record.model?.toLowerCase());
    const match=matchRegulatoryRecord({brand,model,title,attributes:product.specifications},record);
    if(!match || match.match==='candidate-title' || match.coverage==='excluded') continue;
    seen.add(record.recordId);
    out.push({id:'OFFICIAL_SAFETY_SCOPE_CHECK',family:'safety',severity:'info',confidence:match.confidence,weight:0,
      title:'This model appears in an official recall notice — check unit coverage',
      explanation:'The listed brand/model matches a reviewed CPSC notice. A model match does not establish that this unit is affected. Confirm the notice’s serial, color, seller and purchase requirements using the official source. This packaged subset is incomplete; no match is not a safety clearance.',
      observedValue:`CPSC ${record.recordId} • ${record.brand} ${record.model} • ${match.reasons.join('; ')} • ${record.url} • source reviewed ${SAFETY_REVIEWED_AT}`,
      independentKey:'safety-notice:'+record.recordId,sourceKey:'CPSC:'+record.recordId,
      provenance:{sourceUrl:record.url,observedAt:SAFETY_REVIEWED_AT,method:'packaged official notice / exact brand-model candidate'},
    });
  }
  return out;
}
