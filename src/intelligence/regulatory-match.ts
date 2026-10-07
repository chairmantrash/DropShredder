export type RegulatoryAuthority='CPSC'|'FDA'|'NHTSA';

export interface RegulatoryRecord {
  authority:RegulatoryAuthority;
  recordId:string;
  title:string;
  url:string;
  gtins?:string[];
  brand?:string;
  model?:string;
  recalledAt?:string;
  summary?:string;
}

export interface RegulatoryProduct {
  gtin?:string;
  brand?:string;
  model?:string;
  title?:string;
}

export interface RegulatoryMatch {
  record:RegulatoryRecord;
  match:'exact-identifier'|'brand-model'|'candidate-title';
  confidence:number;
  actionable:boolean;
}

const id=(v:string|undefined)=>(v??'').normalize('NFKC').toLowerCase().replace(/[^a-z0-9]/g,'');
const words=(v:string|undefined)=>new Set((v??'').normalize('NFKC').toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>=4));
const overlap=(a:Set<string>,b:Set<string>)=>{
  if(!a.size||!b.size)return 0;
  let n=0;for(const x of a)if(b.has(x))n++;
  return n/Math.max(a.size,b.size);
};

export function matchRegulatoryRecord(product:RegulatoryProduct,record:RegulatoryRecord):RegulatoryMatch|undefined {
  const gtin=id(product.gtin);
  if(gtin&&record.gtins?.some(value=>id(value)===gtin)) return {record,match:'exact-identifier',confidence:1,actionable:true};
  if(id(product.brand)&&id(product.model)&&id(product.brand)===id(record.brand)&&id(product.model)===id(record.model)){
    return {record,match:'brand-model',confidence:.94,actionable:true};
  }
  const similarity=overlap(words(product.title),words(record.title));
  if(similarity>=.65) return {record,match:'candidate-title',confidence:Math.min(.79,similarity),actionable:false};
  return undefined;
}
