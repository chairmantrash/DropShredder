import type { ProductSnapshot } from '../types/product';
import type { EvidenceSignal } from '../types/evidence';

export const POLICY_REVIEWED_AT='2026-10-08';
export const MARKETPLACE_POLICIES=[
  {id:'etsy',domain:'etsy.com',name:'Etsy',
    url:'https://help.etsy.com/hc/en-us/articles/23948763872151-Does-Etsy-Allow-Drop-Shipping-or-Reselling',
    context:'Etsy permits qualifying supplies, vintage and original-design or personalized production arrangements. Match the actual category, design claim and partner disclosure before alleging prohibited reselling. A production partner or generic partner descriptor is not a warning by itself.'},
  {id:'ebay',domain:'ebay.com',name:'eBay',
    url:'https://www.ebay.com/help/selling/listings/dropshipping?id=4176',
    context:'eBay permits wholesale-supplier fulfillment but prohibits post-sale retail purchases shipped directly to the buyer. Similar prices, images or an Amazon box do not establish transaction timing or that sourcing relationship.'},
  {id:'tiktok-us',domain:'tiktok.com',name:'TikTok Shop — US policy context',
    url:'https://seller-us.tiktok.com/university/essay?knowledge_id=7131013343053575',
    context:'The reviewed US packaging policy permits third-party fulfillment with inventory ownership and prohibits direct retailer-to-customer purchases. Confirm the shop’s market before applying this rule; a tiktok.com URL does not establish US jurisdiction.'},
  {id:'wayfair',domain:'wayfair.com',name:'Wayfair',
    url:'https://sell.wayfair.com/start-beginners-guide',
    context:'Wayfair describes dropshipping as normal supplier fulfillment. Compare exact supplier part, dimensions, materials and variant rather than interpreting different retail names or third-party delivery as deception.'},
  {id:'depop',domain:'depop.com',name:'Depop',
    url:'https://depophelp.zendesk.com/hc/en-gb/articles/22499808769553-Dropshipping-Policy',
    context:'Depop prohibits catalogue dropshipping but permits qualifying seller-designed handmade or print-on-demand goods with original photos and production/shipping disclosures. Shared stock imagery is a candidate to investigate, not proof of inventory ownership.'},
  {id:'mercari-us',domain:'mercari.com',name:'Mercari — US policy context',
    url:'https://www.mercari.com/us/help_center/topics/listing/policies/prohibited-conduct/',
    context:'Mercari’s reviewed US rules prohibit items outside possession, third-party shipping and stock/unowned photos. Confirm the US market before applying them; Japan rules and cross-border services need separate treatment.'},
] as const;

export function marketplacePolicyEvidence(product:ProductSnapshot):EvidenceSignal[] {
  let host:string;
  try{host=new URL(product.url).hostname.toLowerCase().replace(/\.$/,'');}catch{return [];}
  const policy=MARKETPLACE_POLICIES.find(item=>host===item.domain || host.endsWith('.'+item.domain));
  if(!policy) return [];
  return [{id:'MARKETPLACE_POLICY_CONTEXT',family:'claims',severity:'info',confidence:1,weight:0,
    title:policy.name+' sourcing rules',explanation:policy.context,
    observedValue:`Policy reviewed ${POLICY_REVIEWED_AT} • ${policy.url}`,
    independentKey:'marketplace-policy:'+policy.id,sourceKey:'platform-policy:'+policy.id,
    provenance:{sourceUrl:policy.url,observedAt:POLICY_REVIEWED_AT,method:'packaged policy context; not an item-compliance determination'},
  }];
}
