import type { EvidenceSignal } from '../types/evidence';

export interface MerchantNetworkDefinition {
  id:string;
  name:string;
  domains:string[];
  evidenceFamilies:Array<'public-affiliation'|'shared-address'|'cross-domain-reference'|'shared-catalog'>;
  notes:string;
  reviewedAt:string;
  sources:string[];
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
    notes:'Public evidence links HaremPants and Sure Design operations. LinkedIn lists affiliated pages; Sure Design and HaremPants share a Reno mailing address in public sources; Sure Design pages contain harempants.com references; exact product SKUs and copy overlap across the retail domains.',
    reviewedAt:'2026-10-06',
    sources:[
      'https://www.linkedin.com/showcase/harem-pants/',
      'https://www.suredesigntshirts.com/pages/contact-us',
      'https://www.suredesigntshirts.com/pages/track-shipment',
      'https://www.suredesigntshirts.com/products/unisex-triangles-harem-pants-in-black',
      'https://www.harempants.com/products/triangles-womens-harem-pants-in-black',
    ],
  },
];

function normalize(domain:string):string{
  return domain.toLowerCase().replace(/^www\./,'');
}

export function merchantNetworkForDomain(domain:string):MerchantNetworkDefinition|undefined{
  const target=normalize(domain);
  return MERCHANT_NETWORKS.find(network=>
    network.domains.some(member=>target===member || target.endsWith('.'+member))
  );
}

export function merchantNetworkEvidence(domain:string):EvidenceSignal[]{
  const network=merchantNetworkForDomain(domain);
  if(!network) return [];

  return [{
    id:'KNOWN_AFFILIATED_MERCHANT_NETWORK',
    family:'identity',
    severity:'strong',
    confidence:.95,
    weight:24,
    title:'Affiliated merchant network detected',
    explanation:'DropShredder has multiple independent public linkage families connecting this storefront to other merchant domains. Affiliation itself is not fraud, but it is important identity context when brands appear independent or package/fulfillment evidence crosses between them.',
    observedValue:`${network.name} • ${network.domains.join(', ')} • evidence: ${network.evidenceFamilies.join(', ')}`,
    independentKey:`merchant-network:${network.id}`,
  }];
}
