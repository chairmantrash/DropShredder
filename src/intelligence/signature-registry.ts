export type SignatureStatus='active'|'stale'|'retired';
export type SignatureKind='script'|'selector'|'global'|'meta'|'cookie'|'header'|'xhr'|'html';

export interface TechnologySignature {
  id:string;
  technology:string;
  category:string;
  kind:SignatureKind;
  pattern:string;
  sourceUrl:string;
  firstVerified:string;
  lastVerified:string;
  status:SignatureStatus;
  confidence:number;
  defaultWeight:0;
  notes?:string;
}

export interface SignatureRegistry {
  schemaVersion:1;
  updatedAt:string;
  signatures:TechnologySignature[];
}

export function signatureAgeDays(signature:TechnologySignature,now=Date.now()):number {
  const verified=Date.parse(signature.lastVerified);
  if(!Number.isFinite(verified)) return Number.POSITIVE_INFINITY;
  return Math.max(0,Math.floor((now-verified)/86400000));
}

export function effectiveSignatureStatus(signature:TechnologySignature,now=Date.now()):SignatureStatus {
  if(signature.status==='retired') return 'retired';
  return signatureAgeDays(signature,now)>180 ? 'stale' : signature.status;
}

export function activeSignatures(registry:SignatureRegistry,now=Date.now()):TechnologySignature[] {
  return registry.signatures.filter(signature=>effectiveSignatureStatus(signature,now)==='active');
}

export function validateRegistry(registry:SignatureRegistry):string[] {
  const errors:string[]=[];
  const ids=new Set<string>();
  for(const signature of registry.signatures){
    if(ids.has(signature.id)) errors.push(`Duplicate signature id: ${signature.id}`);
    ids.add(signature.id);
    if(!signature.sourceUrl.startsWith('http')) errors.push(`Missing public provenance URL: ${signature.id}`);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(signature.lastVerified)) errors.push(`Invalid lastVerified: ${signature.id}`);
    if(signature.defaultWeight!==0) errors.push(`Technology signature must default to zero weight: ${signature.id}`);
  }
  return errors;
}
