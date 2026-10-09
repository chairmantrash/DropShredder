import type { EvidenceSignal } from '../types/evidence';
import type { ProductSnapshot } from '../types/product';

export interface EtsyAdapterResult {
  productPatch: Partial<ProductSnapshot>;
  evidence: EvidenceSignal[];
  claims: string[];
}

const HANDMADE_PATTERNS = [
  /handmade/i,
  /made\s+by\s+(?:me|us|our\s+shop)/i,
  /crafted\s+by\s+(?:me|us|our\s+team)/i,
  /our\s+workshop/i,
];

const PRODUCTION_PARTNER_PATTERNS = [
  /production partner/i,
  /printed by/i,
  /manufactured by/i,
  /made with help from/i,
];

export function analyzeEtsyPage(pageText: string): EtsyAdapterResult {
  const claims: string[] = [];
  const evidence: EvidenceSignal[] = [];

  if (HANDMADE_PATTERNS.some(pattern => pattern.test(pageText))) {
    claims.push('seller-handmade-or-maker-claim');
    evidence.push({
      id:'ETSY_HANDMADE_CLAIM',
      family:'claims',
      severity:'info',
      confidence:.8,
      weight:0,
      title:'Handmade/maker claim detected',
      explanation:'The listing appears to make a handmade or maker-origin claim. This is not negative evidence by itself; it becomes important only if independent upstream evidence contradicts the claim.',
      observedValue:'Handmade/maker-language present',
      independentKey:'etsy-maker-claim',
    });
  }

  if (PRODUCTION_PARTNER_PATTERNS.some(pattern => pattern.test(pageText))) {
    claims.push('production-partner-disclosure');
    evidence.push({
      id:'ETSY_PRODUCTION_PARTNER_DISCLOSURE',
      family:'claims',
      severity:'info',
      confidence:.75,
      weight:0,
      title:'Production-partner disclosure language detected',
      explanation:'Etsy permits disclosed production partners for qualifying original designs. Production-partner use is informational and is not evidence of prohibited dropshipping by itself.',
      observedValue:'Production-partner language present',
      independentKey:'etsy-production-partner',
    });
  }

  return {
    productPatch:{claims},
    evidence,
    claims,
  };
}

export function isEtsyDomain(domain:string):boolean{return /(^|\.)etsy\.com$/i.test(domain);}
