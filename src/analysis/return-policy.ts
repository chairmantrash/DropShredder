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
    title:'You may have to pay to ship returns overseas',
    explanation:'The return policy appears to make you pay international return postage. On a cheaper item, that can make returning it barely worth the cost.',
    key:'return-international-cost',
  },
  {
    id:'RETURN_ADDRESS_AFTER_CONTACT',
    severity:'info' as const,
    confidence:.72,
    regex:/(?:contact|email).{0,80}(?:return address|return instructions)|return address.{0,80}(?:provided|sent).{0,50}(?:after|once).{0,30}(?:contact|email)/i,
    title:'Contact is required for return instructions',
    explanation:'The store appears to make you contact them before revealing where a return has to go. Contact/RMA procedures are common; this alone does not establish hidden costs or wrongdoing.',
    key:'return-address-withheld',
  },
  {
    id:'RESTOCKING_FEE',
    severity:'weak' as const,
    confidence:.7,
    regex:/(?:restocking fee.{0,20}(\d{1,2})\s*%|(\d{1,2})\s*%.{0,20}restocking fee)/i,
    title:'Returning it may cost you a restocking fee',
    explanation:'The policy appears to deduct a restocking fee from some returns. That can shrink your refund, but it does not tell us whether the item is dropshipped.',
    key:'return-restocking-fee',
  },
  {
    id:'VERY_SHORT_RETURN_WINDOW',
    severity:'moderate' as const,
    confidence:.78,
    regex:/\breturns?\s+(?:items?\s+)?within\s+([1-7])\s*(?:calendar\s+|business\s+)?days?\b|(?:returns?\s+(?:must be (?:requested|initiated|made)|accepted)|(?:request|initiate|start|make)\s+(?:a\s+)?return|return\s+(?:window|period))[^.;!?]{0,35}\b([1-7])\s*(?:calendar\s+|business\s+)?days?\b|\b([1-7])[- ]day\s+return\s+(?:window|period)|\b(?:have|within)\s+([1-7])\s*(?:calendar\s+|business\s+)?days?\s+to\s+(?:request\s+(?:a\s+)?)?return\b/i,
    title:'Very short return window',
    explanation:'The policy appears to give you seven days or less to return the item. That is a tight window, especially if delivery is slow.',
    key:'return-short-window',
  },
  {
    id:'FINAL_SALE_BROAD',
    severity:'weak' as const,
    confidence:.64,
    regex:/(?:all sales are final|no returns? or exchanges?|non[- ]returnable)/i,
    title:'The store may not take it back',
    explanation:'The policy uses broad final-sale or no-return language. Some products have legitimate exclusions, so check whether it actually applies to what you’re buying.',
    key:'return-final-sale',
  },
  {
    id:'REFUND_AFTER_WAREHOUSE_RECEIPT',
    severity:'info' as const,
    confidence:.66,
    regex:/refund.{0,80}(?:after|once).{0,50}(?:warehouse|return center|facility).{0,30}(?:receive|received|inspect)/i,
    title:'Your refund waits on the warehouse',
    explanation:'The store says your refund waits until a warehouse receives or inspects the return. That’s common, but it can become a headache when the return destination is unclear or far away.',
    key:'return-warehouse-receipt',
  }
];

export function analyzeReturnPolicy(text:string):EvidenceSignal[]{
  const normalized=text.slice(0,100000).replace(/\s+/g,' ');
  const out:EvidenceSignal[]=[];

  for(const p of patterns){
    const match=normalized.match(p.regex);
    if(!match) continue;
    const before=normalized.slice(Math.max(0,(match.index??0)-30),match.index);
    if(/\b(?:no|not|never|without|do not|does not|will not)\s+(?:a\s+|any\s+|charge\s+|pay\s+|have\s+|need\s+)?$/i.test(before)) continue;
    if(p.id==='INTERNATIONAL_RETURN_AT_CUSTOMER_COST' && /\bnot\s+(?:responsible|required)|\b(?:will|do)\s+not\s+pay/i.test(match[0])) continue;
    let severity:EvidenceSignal['severity']=p.severity;
    let weight=severity==='moderate'?9:severity==='weak'?4:0;

    if(p.id==='RESTOCKING_FEE'){
      const pct=Number(match[0].match(/(\d{1,2})\s*%/)?.[1]);
      if(pct===0) continue;
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
      sourceKey:'return-policy-observation',
    });
  }

  return out;
}
