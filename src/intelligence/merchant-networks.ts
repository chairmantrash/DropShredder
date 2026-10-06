import type { EvidenceSignal } from '../types/evidence';

export type MerchantNetworkStatus='active'|'watch'|'retired';

export interface MerchantNetworkDefinition {
  id:string;
  name:string;
  domains:string[];
  evidenceFamilies:Array<
    'public-affiliation'|'shared-address'|'shared-operator'|'cross-domain-reference'|
    'shared-catalog'|'shared-platform'|'regulatory-filing'
  >;
  status:MerchantNetworkStatus;
  reviewedAt:string;
  freshnessDays:number;
  notes:string;
  consumerRiskNotes?:string;
  sources:string[];
  consumerRiskSources?:string[];
}

export const MERCHANT_NETWORKS:MerchantNetworkDefinition[]=[
  {
    id:'harempants-suredesign',
    name:'HaremPants / Sure Design affiliated merchant network',
    domains:[
      'harempants.com',
      'suredesigntshirts.com',
      'suredesignwholesale.com',
      'surecannabisdesigns.com',
      'mysterybuddha.com',
    ],
    evidenceFamilies:['public-affiliation','shared-address','cross-domain-reference','shared-catalog'],
    status:'active',
    reviewedAt:'2026-10-06',
    freshnessDays:120,
    notes:'Public evidence links HaremPants and Sure Design operations. LinkedIn lists affiliated pages; Sure Design and HaremPants share a Reno mailing address in public sources; Sure Design pages contain harempants.com references; exact product SKUs and copy overlap across the retail domains.',
    sources:[
      'https://www.linkedin.com/showcase/harem-pants/',
      'https://www.suredesigntshirts.com/pages/contact-us',
      'https://www.suredesigntshirts.com/pages/track-shipment',
      'https://www.suredesigntshirts.com/products/unisex-triangles-harem-pants-in-black',
      'https://www.harempants.com/products/triangles-womens-harem-pants-in-black',
    ],
  },
  {
    id:'chicv-current-fashion-network',
    name:'ChicV current fashion-store network',
    domains:['justfashionnow.com','noracora.com','stylewe.com'],
    evidenceFamilies:['shared-operator','shared-address','public-affiliation'],
    status:'active',
    reviewedAt:'2026-10-06',
    freshnessDays:60,
    notes:'Current store terms independently identify ChicV UK Limited and ChicV International Holding Limited as operators of JustFashionNow, Noracora and StyleWe, using the same UK/Hong Kong legal identities and addresses.',
    consumerRiskNotes:'Current BBB records show unresolved/unanswered product, delivery and billing complaints for JustFashionNow and Noracora; ChicV also has persistent public complaints around support, refunds and mismatched goods. Complaint evidence is store-specific and must not automatically transfer to every network member.',
    sources:[
      'https://www.justfashionnow.com/information/terms-and-conditions',
      'https://noracora.com/information/terms',
      'https://www.stylewe.com/information/terms',
      'https://trademarks.justia.com/owners/chicv-international-holding-limited-4889837/',
    ],
    consumerRiskSources:[
      'https://www.bbb.org/us/ny/jamaica/profile/online-retailer/justfashionnow-0121-87157959',
      'https://www.bbb.org/us/ny/new-york/profile/online-retailer/noracora-0121-87155743/complaints',
      'https://www.trustpilot.com/review/chicv.com',
    ],
  },
  {
    id:'hongkong-yuzhen-fashion-network',
    name:'Hongkong Yuzhen fashion network',
    domains:['modlily.com','rotita.com','rosewe.com'],
    evidenceFamilies:['shared-operator','shared-address','shared-catalog'],
    status:'active',
    reviewedAt:'2026-10-06',
    freshnessDays:60,
    notes:'Modlily, Rotita and Rosewe currently identify Hongkong Yuzhen E-Commerce Co., Limited, company number 66491738, at the same Kowloon address. Current pages also expose cross-brand implementation leakage such as Modlily signup text referencing Rosewe emails.',
    consumerRiskNotes:'Current public complaint sources document return/refund, delivery, product-quality and advertising concerns. Rotita also has a BBB advertising-review alert. These findings remain domain-specific unless corroborated across the network.',
    sources:[
      'https://www.modlily.com/who-is-modlily-a343.html',
      'https://www.modlily.com/terms-of-use-a92.html',
      'https://m.rotita.com/OagTL/terms-of-use-a92.html',
      'https://www.rosewe.com/en/about-us-a35.html',
      'https://www.modlily.com/Underwire/flow.php',
    ],
    consumerRiskSources:[
      'https://www.bbb.org/us/az/scottsdale/profile/online-shopping/molylily-1126-1000074082/complaints',
      'https://www.bbb.org/us/nj/cedar-grove/profile/online-retailer/rotita-0221-90189365',
      'https://www.trustpilot.com/review/rosewe.com',
    ],
  },
  {
    id:'lightinthebox-brand-matrix',
    name:'LightInTheBox / Ador / ezbuy corporate commerce network',
    domains:['lightinthebox.com','ador.com','ezbuy.sg'],
    evidenceFamilies:['regulatory-filing','shared-operator','shared-platform'],
    status:'active',
    reviewedAt:'2026-10-06',
    freshnessDays:90,
    notes:'LightInTheBox Holding Co., Ltd. states in its 2025 SEC annual report that it operates primarily through lightinthebox.com, ador.com and ezbuy.sg on a common back-end platform with centralized inventory management. Its subsidiaries span Singapore, Hong Kong, PRC, the U.S. and Netherlands.',
    consumerRiskNotes:'BBB currently flags a pattern of complaints for LightInTheBox, including product, delivery, return and advertising issues. This does not mean Ador or ezbuy inherit the same complaint record; network ownership and store-level complaint evidence remain separate.',
    sources:[
      'https://www.sec.gov/Archives/edgar/data/1523836/000110465926038848/litb-20251231x20f.htm',
      'https://www.sec.gov/Archives/edgar/data/1523836/000110465926038848/litb-20251231xex8d1.htm',
      'https://ir.ador.com/',
    ],
    consumerRiskSources:[
      'https://www.bbb.org/us/or/portland/profile/online-retailer/light-in-the-box-1296-22959195/complaints',
    ],
  },
  {
    id:'gearlaunch-white-label-network',
    name:'GearLaunch white-label storefront network',
    domains:['gearlaunch.com','alwaysnavy.com'],
    evidenceFamilies:['shared-operator','public-affiliation','shared-platform'],
    status:'watch',
    reviewedAt:'2026-10-06',
    freshnessDays:45,
    notes:'GearLaunch remains an active print-on-demand/fulfillment platform. BBB currently lists Gear Launch, Inc. alternate names including Maven Things, Merry Fami, Always Navy, Coolest Tees, DSA Styles, Find Your Tee, Tees Palace and Pay On Tee, plus several associated websites. Only currently verifiable domains should be promoted to active matching.',
    consumerRiskNotes:'BBB currently rates Gear Launch, Inc. D and reports 66 complaints in the last three years, including product, delivery and billing issues. Because GearLaunch also serves independent sellers, platform presence alone must never transfer complaint risk to an unrelated seller storefront.',
    sources:[
      'https://www.gearlaunch.com/platform',
      'https://www.bbb.org/us/ut/salt-lake-city/profile/online-retailer/gear-launch-inc-1126-90026613',
      'https://alwaysnavy.com/',
    ],
    consumerRiskSources:[
      'https://www.bbb.org/us/ut/salt-lake-city/profile/online-retailer/gear-launch-inc-1126-90026613/complaints',
    ],
  },
];

function normalize(domain:string):string{
  return domain.toLowerCase().replace(/^www\./,'');
}

export function merchantNetworkForDomain(domain:string):MerchantNetworkDefinition|undefined{
  const target=normalize(domain);
  return MERCHANT_NETWORKS.find(network=>
    network.status!=='retired' &&
    network.domains.some(member=>target===member || target.endsWith('.'+member))
  );
}

export function merchantNetworkEvidence(domain:string):EvidenceSignal[]{
  const network=merchantNetworkForDomain(domain);
  if(!network) return [];

  return [{
    id:'KNOWN_AFFILIATED_MERCHANT_NETWORK',
    family:'identity',
    severity:network.status==='active'?'strong':'moderate',
    confidence:network.status==='active'?.95:.78,
    weight:network.status==='active'?24:10,
    title:'Affiliated merchant network detected',
    explanation:'DropShredder has multiple independent public linkage families connecting this storefront to other merchant domains. Affiliation itself is not fraud, and complaint evidence from one network member is never inherited by another without its own corroboration.',
    observedValue:`${network.name} • ${network.domains.join(', ')} • status: ${network.status} • reviewed ${network.reviewedAt} • evidence: ${network.evidenceFamilies.join(', ')}`,
    independentKey:`merchant-network:${network.id}`,
  }];
}
