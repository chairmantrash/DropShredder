import type { EvidenceSignal } from '../types/evidence';

export interface ReturnPolicyFinding {
  id:string;
  severity:'info'|'weak'|'moderate'|'strong';
  confidence:number;
  title:string;
  explanation:string;
  observedValue:string;
  independentKey:string;
}

const patterns=[
  {
    id:'INTERNATIONAL_RETURN_AT_CUSTOMER_COST',
    severity:'moderate' as const,
    confidence:.76,
    regex:/customer.{0,40}(?:responsible|pays?).{0,80}(?:international|overseas).{0,30}return|return.{0,80}(?:international|overseas).{0,40}(?:customer|buyer).{0,30}(?:responsible|pays?)/i,
    title:'Customer-paid international return detected',
    explanation:'The policy appears to require the customer to pay international return shipping. This can make low-value imported goods effectively non-returnable.',
    key:'return-international-cost',
  },
  {
    id:'RETURN_ADDRESS_AFTER_CONTACT',
    severity:'moderate' as const,
    confidence:.72,
    regex:/(?:contact|email).{0,80}(?:return address|return instructions)|return address.{0,80}(?:provided|sent).{0,50}(?:after|once).{0,30}(?:contact|email)/i,
    title:'Return address withheld until contact',
    explanation:'The merchant does not appear to publish a return destination up front. This can create friction and makes fulfillment geography harder to evaluate.',
    key:'return-address-withheld',
  },
  {
    id:'RESTOCKING_FEE',
    severity:'weak' as const,
    confidence:.7,
    regex:/(?:restocking fee.{0,20}(\d{1,2})\s*%|(\d{1,2})\s*%.{0,20}restocking fee)/i,
    title:'Restocking fee detected',
    explanation:'A restocking fee may materially reduce refund value. This is a policy-friction signal, not evidence of dropshipping by itself.',
    key:'return-restocking-fee',
  },
  {
    id:'VERY_SHORT_RETURN_WINDOW',
    severity:'moderate' as const,
    confidence:.78,
    regex:/\b([1-7])\s*(?:calendar\s+|business\s+)?days?\b.{0,40}(?:return|refund)|(?:return|refund).{0,40}\b([1-7])\s*(?:calendar\s+|business\s+)?days?\b/i,
    title:'Very short return window',
    explanation:'The visible policy appears to provide seven days or less for returns/refunds. This can be especially burdensome for delayed imported goods.',
    key:'return-short-window',
  },
  {
    id:'FINAL_SALE_BROAD',
    severity:'weak' as const,
    confidence:.64,
    regex:/(?:all sales are final|no returns? or exchanges?|non[- ]returnable)/i,
    title:'Broad final-sale/no-return language',
    explanation:'Broad no-return language may materially limit consumer recourse. Legitimate categories can have valid exclusions, so context matters.',
    key:'return-final-sale',
  },
  {
    id:'REFUND_AFTER_WAREHOUSE_RECEIPT',
    severity:'weak' as const,
    confidence:.66,
    regex:/refund.{0,80}(?:after|once).{0,50}(?:warehouse|return center|facility).{0,30}(?:receive|received|inspect)/i,
    title:'Refund contingent on warehouse receipt/inspection',
    explanation:'Refund timing depends on return-center receipt or inspection. This is common commerce practice, but can compound friction when return logistics are opaque.',
    key:'return-warehouse-receipt',
  }
];

export function analyzeReturnPolicy(text:string):EvidenceSignal[]{
  const normalized=text.replace(/\s+/g,' ').slice(0,100000);
  const out:EvidenceSignal[]=[];

  for(const p of patterns){
    const match=normalized.match(p.regex);
    if(!match) continue;
    let severity=p.severity;
    let weight=severity==='moderate'?9:severity==='weak'?4:0;

    if(p.id==='RESTOCKING_FEE'){
      const pct=Number(match[0].match(/(\d{1,2})\s*%/)?.[1]);
      if(Number.isFinite(pct) && pct>=20){
        severity='moderate';
        weight=8;
      }
    }

    out.push({
      id:p.id,
      family:'merchant',
      severity,
      confidence:p.confidence,
      weight,
      title:p.title,
      explanation:p.explanation,
      observedValue:match[0].slice(0,220),
      independentKey:p.key,
    });
  }

  return out;
}
