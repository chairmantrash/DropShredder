import { normalizeGtin, normalizeProductIdentifier } from '../analysis/product-identity';

export type RegulatoryAuthority='CPSC'|'FDA'|'NHTSA';
export interface RegulatoryRecord {
  authority:RegulatoryAuthority;recordId:string;title:string;url:string;
  gtins?:string[];brand?:string;model?:string;recalledAt?:string;summary?:string;
  serials?:string[];
  serialRanges?:Array<{prefix:string;start:string;end:string}>;
  requiresOfficialSerialCheck?:boolean;
  requiredAttributes?:Record<string,string[]>;
  excludedModels?:string[];
}
export interface RegulatoryProduct {
  gtin?:string;brand?:string;model?:string;title?:string;serial?:string;
  attributes?:Record<string,string>;
}
export interface RegulatoryMatch {
  record:RegulatoryRecord;
  match:'exact-identifier'|'brand-model'|'candidate-title';
  confidence:number;actionable:boolean;
  coverage:'matched'|'unresolved'|'excluded';
  reasons:string[];
}
const id=normalizeProductIdentifier;
const words=(value:string|undefined)=>new Set((value??'').slice(0,4000).normalize('NFKC').toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>=4));
function overlap(a:Set<string>,b:Set<string>){
  let n=0;for(const x of a)if(b.has(x))n++;
  return a.size&&b.size?n/Math.max(a.size,b.size):0;
}
function scope(product:RegulatoryProduct,record:RegulatoryRecord):{coverage:RegulatoryMatch['coverage'];reasons:string[]} {
  const reasons:string[]=[],unknown:string[]=[],excluded:string[]=[];
  if(product.model && record.excludedModels?.slice(0,100).some(model=>id(model)===id(product.model))) excluded.push('Model explicitly excluded');
  if(product.brand && record.brand && id(product.brand)!==id(record.brand)) excluded.push('Brand conflicts');
  if(product.model && record.model && id(product.model)!==id(record.model)) excluded.push('Model conflicts');
  for(const [key,values] of Object.entries(record.requiredAttributes??{}).slice(0,20)){
    const value=product.attributes?.[key];
    if(!value) unknown.push(key+' not observed');
    else if(!values.slice(0,100).some(expected=>id(expected)===id(value))) excluded.push(key+' outside notice scope');
  }
  if(record.serials?.length || record.serialRanges?.length){
    if(!product.serial) unknown.push('Serial number not observed');
    else {
      // Serial lookup is exact and case-sensitive; never infer OCR confusables or numeric coercion.
      const serial=product.serial.trim();
      const listed=record.serials?.slice(0,500).includes(serial);
      const ranged=record.serialRanges?.slice(0,100).some(range=>{
        const suffix=serial.startsWith(range.prefix)?serial.slice(range.prefix.length):'';
        return /^\d+$/.test(suffix) && /^\d+$/.test(range.start) && /^\d+$/.test(range.end) &&
          suffix.length===range.start.length && suffix.length===range.end.length &&
          suffix>=range.start && suffix<=range.end;
      });
      if(!listed && !ranged) excluded.push('Serial number outside notice scope');
    }
  }
  if(record.requiresOfficialSerialCheck) unknown.push('Official serial verification required');
  reasons.push(...excluded,...unknown);
  return {coverage:excluded.length?'excluded':unknown.length?'unresolved':'matched',reasons};
}
export function matchRegulatoryRecord(product:RegulatoryProduct,record:RegulatoryRecord):RegulatoryMatch|undefined {
  const gtin=normalizeGtin(product.gtin);
  const exact=Boolean(gtin && record.gtins?.slice(0,100).some(value=>normalizeGtin(value)===gtin));
  const model=Boolean(id(product.brand)&&id(product.model)&&id(product.brand)===id(record.brand)&&id(product.model)===id(record.model));
  if(exact || model){
    const coverage=scope(product,record);
    return {record,match:exact?'exact-identifier':'brand-model',confidence:exact?1:.94,
      actionable:coverage.coverage==='matched',...coverage};
  }
  const similarity=overlap(words(product.title),words(record.title));
  if(similarity>=.65) return {record,match:'candidate-title',confidence:Math.min(.79,similarity),actionable:false,
    coverage:'unresolved',reasons:['Title similarity is not product identity']};
  return undefined;
}
