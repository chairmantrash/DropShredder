import type {ProductSnapshot} from '../types/product';
import {compareProductIdentity} from './product-identity';
import {canonicalCommerceText} from '../languages/commerce-text';

// A store-local SKU, title, material or cached canonical string is not a global identity.
// Numeric specifications corroborate identity/images; they never identify a product alone.
const TECHNICAL_KEYS=new Set(['wattage','power','voltage','weight','length','width','height','depth','capacity','frequency','resolution']);
function technicalSpecs(product:ProductSnapshot):Map<string,string>{
  return new Map(Object.entries(product.specifications??{}).slice(0,50).flatMap(([key,value])=>{
    const name=canonicalCommerceText(key,80).toLowerCase().trim();
    const text=canonicalCommerceText(value,160).toLowerCase().replace(/\s+/g,'').trim();
    return TECHNICAL_KEYS.has(name)&&/\d/.test(text)?[[name,text] as [string,string]]:[];
  }));
}
export function compareProductListings(current:ProductSnapshot,other:ProductSnapshot){
  const identity=compareProductIdentity(current,other),left=technicalSpecs(current),right=technicalSpecs(other);
  const conflictingSpecs=[...left].filter(([key,value])=>right.has(key)&&right.get(key)!==value).map(([key])=>key);
  const conflicts=[...identity.conflicts,...conflictingSpecs.map(key=>`Different ${key}`)];
  const matchingSpecs=[...left].filter(([key,value])=>right.get(key)===value).map(([key])=>key);
  const hashes=new Set((other.imageFingerprints??[]).slice(0,30).map(x=>x.sha256).filter(Boolean));
  const matchingHashes=[...new Set((current.imageFingerprints??[]).slice(0,30).map(x=>x.sha256).filter(x=>Boolean(x)&&hashes.has(x)))];
  const identifierMatch=identity.matches.length>0,imageMatch=matchingHashes.length>0;
  return {compatible:!conflicts.length,conflicts,identifierMatch,matchedIdentifiers:identity.matches,imageMatch,
    technicalFingerprintMatch:!conflicts.length&&matchingSpecs.length>=3,
    matchedSpecifications:matchingSpecs,matchingHashes,
    matched:!conflicts.length&&(identifierMatch||imageMatch)};
}
