import {commerceText} from '../languages/commerce-text';
import type { ProductSnapshot } from '../types/product';
import type { EvidenceSignal } from '../types/evidence';

export interface CertificationClaim {
  standard:string;rawClaim:string;rawIdentifier?:string;
  subject:'component'|'finished-product'|'unspecified';
  status:'claim-only';lookupUrl:string;
}
const ISSUERS=[
  {standard:'OEKO-TEX',pattern:/\bOEKO[- ]TEX\b/i,url:'https://www.oeko-tex.com/en/label-check'},
  {standard:'GOTS',pattern:/\bGOTS\b/i,url:'https://global-standards.org/suppliers/certified-suppliers'},
  {standard:'UL',pattern:/\bUL\s+(?:listed|certified|recognized)\b/i,url:'https://productiq.ulprospector.com/'},
  {standard:'Intertek',pattern:/\b(?:ETL\s+listed|Intertek\s+(?:listed|verified|certified))\b/i,url:'https://www.intertek.com/directories/'},
  {standard:'USB-IF',pattern:/\bUSB[- ]IF\s+certified\b/i,url:'https://www.usb.org/products'},
  {standard:'FDA cosmetic registration',pattern:/\bFDA(?:[- ]issued)?\s+(?:cosmetic\s+)?(?:facility\s+)?registration\s+certificates?\b/i,
    url:'https://www.fda.gov/cosmetics/cosmetics-news-events/fda-clarifies-it-does-not-provide-certificates-or-other-documents-verify-compliance-cosmetic-product'},
] as const;

export function extractCertificationClaims(product:ProductSnapshot):CertificationClaim[] {
  // Restrict scope to product metadata; unrelated footer badges must not certify the item.
  const text=[product.title?.slice(0,1000),product.description?.slice(0,7000)].filter(Boolean).join('\n');
  const matching=commerceText(text,9000);
  return ISSUERS.flatMap(issuer=>{
    const match=issuer.pattern.exec(matching.text);
    if(!match) return [];
    if(issuer.standard==='FDA cosmetic registration' && !/\b(?:cosmetic|skin|serum|lipstick|moisturi[sz]er|beauty|face\s+cream)\b/i.test(matching.text)) return [];
    const excerpt=matching.text.slice(Math.max(0,match.index-80),match.index+250);
    const rawIdentifier=/(?:certificate|label|licen[cs]e)(?:\s+(?:number|no\.?))?\s*[:#]\s*([A-Za-z0-9][A-Za-z0-9.\/-]{2,60})/i.exec(excerpt)?.[1];
    const subject=/\b(?:fabric|thread|button|zipper|component|material)\b/i.test(excerpt)?'component':
      /\b(?:whole|finished|entire)\s+(?:product|garment|item)\b/i.test(excerpt)?'finished-product':'unspecified';
    return [{standard:issuer.standard,rawClaim:matching.original(Math.max(0,match.index-80),330).trim(),rawIdentifier,subject,status:'claim-only' as const,lookupUrl:issuer.url}];
  });
}

export function certificationClaimEvidence(product:ProductSnapshot):EvidenceSignal[] {
  return extractCertificationClaims(product).map(claim=>({
    id:'CERTIFICATION_SCOPE_UNVERIFIED',family:'safety',severity:'info',confidence:.9,weight:0,
    title:claim.standard+' claim needs scope verification',
    explanation:claim.standard==='FDA cosmetic registration'
      ? 'FDA says it does not issue cosmetic facility-registration or product-listing certificates. Registration/listing is not approval. This does not address distinct cosmetic export certificates or establish product harm.'
      : 'A certification mention is a seller claim, not a verified item. Check the exact issuer, identifier, subject, model and current scope. A component or company certificate may not cover the finished item; missing lookup results remain unresolved. This does not establish material composition, durability or manufacturing origin.',
    observedValue:`${claim.rawClaim} • subject: ${claim.subject} • status: ${claim.status}${claim.rawIdentifier?' • exact identifier: '+claim.rawIdentifier:''} • official lookup: ${claim.lookupUrl}`,
    independentKey:'certificate-claim:'+claim.standard,
    provenance:{sourceUrl:product.url.split(/[?#]/)[0]!,observedAt:product.capturedAt,method:'bounded product metadata / unverified certificate-claim extraction'},
  }));
}
