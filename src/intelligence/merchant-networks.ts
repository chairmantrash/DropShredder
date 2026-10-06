import type { EvidenceSignal } from '../types/evidence';

export type MerchantNetworkStatus='active'|'watch'|'retired';
export type MerchantNetworkType='sister-store'|'corporate-group'|'marketplace-ecosystem'|'white-label-platform';

export interface MerchantNetworkDefinition {
  id:string;
  name:string;
  networkType:MerchantNetworkType;
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
    networkType:'sister-store',
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
    networkType:'sister-store',
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
    networkType:'sister-store',
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
    networkType:'corporate-group',
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
    networkType:'white-label-platform',
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
  {
    id:'fullbeauty-brand-family',
    name:'FULLBEAUTY Brands family',
    networkType:'corporate-group',
    domains:['womanwithin.com','fullbeauty.com','jessicalondon.com','kingsize.com','brylanehome.com','onestopplus.com','catherines.com','roamans.com','ellos.us','juneandvie.com','swimsuitsforall.com','activeforall.com','shoesforall.com','intimatesforall.com','eloquii.com','shopcuup.com','shop.dia.com'],
    evidenceFamilies:['public-affiliation','shared-operator','shared-platform'],
    status:'active',
    reviewedAt:'2026-10-06',
    freshnessDays:120,
    notes:'FULLBEAUTY publicly lists these brands under one family and supports cross-brand gift-card/checkout relationships. This is a transparent corporate group, not a covert sister-store finding.',
    consumerRiskNotes:'BBB currently shows a large volume of FullBeauty complaints spanning product, delivery, service, billing and return/refund issues. Store-level complaint patterns should remain domain-specific when possible.',
    sources:[
      'https://www.fbbrands.com/company-profile/our-brands/',
      'https://www.brylanehome.com/c/privacy-policy.html',
      'https://www.jessicalondon.com/c/our-brands.html',
    ],
    consumerRiskSources:[
      'https://www.bbb.org/us/in/indianapolis/profile/catalog-shopping/full-beauty-brands-0382-1809/complaints',
    ],
  },
  {
    id:'techstyle-membership-fashion',
    name:'TechStyle / Fabletics-origin membership fashion group',
    networkType:'corporate-group',
    domains:['fabletics.com','justfab.com','shoedazzle.com','fabkids.com','savagex.com'],
    evidenceFamilies:['public-affiliation','shared-platform','shared-operator'],
    status:'watch',
    reviewedAt:'2026-10-06',
    freshnessDays:60,
    notes:'TechStyle historically built and serviced Fabletics, JustFab, ShoeDazzle, FabKids and Savage X Fenty on shared technology, supply-chain, fulfillment and customer-service infrastructure. Corporate structures have evolved, so re-validation is required before treating ownership as current across every brand.',
    consumerRiskNotes:'Current BBB complaint records for Fabletics show recurring membership-billing, cancellation, credit-expiration and return complaints. Those complaints must not automatically transfer to sister brands.',
    sources:[
      'https://www.linkedin.com/posts/fableticsos_weve-converted-the-techstyle-fashion-group-activity-6844301556020584448-gAfo',
      'https://downloads.regulations.gov/USTR-2019-0004-1797/attachment_1.pdf',
    ],
    consumerRiskSources:[
      'https://www.bbb.org/us/ca/el-segundo/profile/retail-sportswear/fabletics-1216-413899/complaints',
    ],
  },
  {
    id:'debenhams-fashion-group',
    name:'Debenhams Group / former boohoo brand portfolio',
    networkType:'corporate-group',
    domains:['debenhams.com','boohoo.com','boohooman.com','prettylittlething.com','karenmillen.com','coastfashion.com','dorothyperkins.com','oasisfashion.com','warehousefashion.com','wallis.co.uk','burton.co.uk'],
    evidenceFamilies:['regulatory-filing','public-affiliation','shared-operator'],
    status:'active',
    reviewedAt:'2026-10-06',
    freshnessDays:90,
    notes:'Debenhams Group annual reporting identifies a portfolio including boohoo, boohooMAN, PrettyLittleThing, Karen Millen and multiple acquired legacy labels including Coast, Dorothy Perkins, Oasis, Wallis, Burton and Warehouse.',
    consumerRiskNotes:'The UK CMA obtained formal undertakings from Boohoo over environmental marketing claims following a greenwashing investigation. This regulator evidence concerns Boohoo practices and should not automatically attach to every portfolio brand.',
    sources:[
      'https://www.debenhamsgroup.com/files/results-centre/2025/debenhams-group-annual-report-2025.pdf',
    ],
    consumerRiskSources:[
      'https://www.gov.uk/cma-cases/asos-boohoo-and-asda-greenwashing-investigation',
    ],
  },
  {
    id:'wayfair-brand-family',
    name:'Wayfair family of home brands',
    networkType:'corporate-group',
    domains:['wayfair.com','allmodern.com','birchlane.com','jossandmain.com','perigold.com'],
    evidenceFamilies:['public-affiliation','shared-platform','shared-operator'],
    status:'active',
    reviewedAt:'2026-10-06',
    freshnessDays:120,
    notes:'Wayfair publicly identifies AllModern, Birch Lane, Joss & Main and Perigold as its family of brands. This record is useful for furniture/catalog identity and cross-brand product-equivalence analysis, not as an accusation.',
    sources:[
      'https://www.wayfair.com/about.php',
      'https://www.wayfair.com/sca/professional/ideas-and-advice/interior-design/a-brand-for-every-project-joss-main-allmodern-birch-lane-T23876',
    ],
  },
  {
    id:'qvc-group-retail-family',
    name:'QVC Group retail family',
    networkType:'corporate-group',
    domains:['qvc.com','hsn.com','ballarddesigns.com','frontgate.com','garnethill.com','grandinroad.com'],
    evidenceFamilies:['public-affiliation','shared-operator','shared-platform'],
    status:'active',
    reviewedAt:'2026-10-06',
    freshnessDays:120,
    notes:'QVC Group publicly identifies QVC, HSN, Ballard Designs, Frontgate, Garnet Hill and Grandin Road as its six retail brands. Shared services include technology, logistics and distribution for the Cornerstone home brands.',
    sources:[
      'https://www.qvcgrp.com/newsroom/pressrelease/qurate-retail-officially-becomes-qvc-group/',
      'https://www.qvcgrp.com/cornerstonebrands/',
    ],
  },
  {
    id:'global-fashion-group',
    name:'Global Fashion Group regional marketplaces',
    networkType:'marketplace-ecosystem',
    domains:['theiconic.com.au','dafiti.com.br','zalora.com'],
    evidenceFamilies:['public-affiliation','shared-operator','shared-platform'],
    status:'active',
    reviewedAt:'2026-10-06',
    freshnessDays:120,
    notes:'Global Fashion Group publicly operates THE ICONIC, Dafiti and ZALORA across ANZ, Latin America and Southeast Asia. This is a transparent marketplace ecosystem useful for merchant/catalog provenance.',
    sources:['https://global-fashion-group.com/about/'],
  },
  {
    id:'shein-romwe',
    name:'SHEIN / ROMWE commerce network',
    networkType:'marketplace-ecosystem',
    domains:['shein.com','romwe.com'],
    evidenceFamilies:['public-affiliation','shared-operator','shared-platform'],
    status:'active',
    reviewedAt:'2026-10-06',
    freshnessDays:60,
    notes:'ROMWE is currently surfaced within SHEIN marketplace infrastructure and shares SHEIN-linked business/contact infrastructure. The relationship is useful for product-equivalence and marketplace provenance.',
    consumerRiskNotes:'European Commission proceedings have examined SHEIN regarding illegal products, dark patterns, trader traceability, recommender transparency and consumer-law compliance. These proceedings do not make every product unsafe.',
    sources:[
      'https://kr.shein.com/store/home?store_code=3143873479',
    ],
    consumerRiskSources:[
      'https://digital-strategy.ec.europa.eu/en/news/commission-requests-information-shein-illegal-products-and-its-recommender-system',
    ],
  },
  {
    id:'pdd-temu-pinduoduo',
    name:'PDD Holdings marketplace ecosystem',
    networkType:'marketplace-ecosystem',
    domains:['temu.com','pinduoduo.com'],
    evidenceFamilies:['regulatory-filing','shared-operator','shared-platform'],
    status:'active',
    reviewedAt:'2026-10-06',
    freshnessDays:90,
    notes:'PDD Holdings annual reports cover its marketplace businesses including Pinduoduo and Temu. This relationship is corporate/operator context, not a hidden sister-store warning.',
    consumerRiskNotes:'The European Commission fined Temu in 2026 under the DSA over failures to adequately assess systemic risks from illegal products; mystery-shopping evidence included safety failures among selected chargers and baby toys.',
    sources:['https://investor.pddholdings.com/financial-information/annual-reports'],
    consumerRiskSources:['https://digital-strategy.ec.europa.eu/en/news/commission-fines-temu-eu200-million-breaching-digital-services-act'],
  },
  {
    id:'alibaba-commerce-ecosystem',
    name:'Alibaba commerce marketplace ecosystem',
    networkType:'marketplace-ecosystem',
    domains:['alibaba.com','aliexpress.com','1688.com','taobao.com','tmall.com','lazada.com','trendyol.com','daraz.com'],
    evidenceFamilies:['regulatory-filing','public-affiliation','shared-operator'],
    status:'active',
    reviewedAt:'2026-10-06',
    freshnessDays:90,
    notes:'Alibaba Group operates multiple wholesale, retail and regional marketplace businesses. The ecosystem is especially relevant to DropShredder source-product and cross-market provenance tracing.',
    consumerRiskNotes:'The European Commission fined AliExpress in 2026 under the DSA over failures to assess/mitigate risks involving illegal, unsafe or counterfeit products. That finding is specific to AliExpress and does not transfer to every Alibaba marketplace.',
    sources:['https://www.alibabagroup.com/en-US/about-alibaba-businesses'],
    consumerRiskSources:['https://digital-strategy.ec.europa.eu/en/news/commission-fines-aliexpress-eu550-million-breaching-digital-services-act'],
  },
  {
    id:'aosom-house-brands',
    name:'Aosom home/furniture house-brand network',
    networkType:'corporate-group',
    domains:['aosom.com'],
    evidenceFamilies:['public-affiliation','shared-operator','shared-catalog'],
    status:'active',
    reviewedAt:'2026-10-06',
    freshnessDays:90,
    notes:'Aosom publicly states it owns nine brands including HOMCOM, Qaba, Vinsetto, Soozier, Kleankin, Durhand, Outsunny and PawHut. This is relevant to furniture/pet/home clone-product attribution even when the brands share one primary retail domain.',
    consumerRiskNotes:'BBB currently lists complaints involving delivery, product durability/quality, inventory transparency and customer-service issues. These are Aosom-level complaints and should not imply every house-brand product is defective.',
    sources:['https://www.aosom.com/page/about-us-home'],
    consumerRiskSources:['https://www.bbb.org/us/or/wilsonville/profile/online-retailer/aosom-llc-1296-22529970/complaints'],
  },
  {
    id:'viralstyle-platform',
    name:'ViralStyle campaign storefront platform',
    networkType:'white-label-platform',
    domains:['viralstyle.com'],
    evidenceFamilies:['shared-platform','shared-operator'],
    status:'watch',
    reviewedAt:'2026-10-06',
    freshnessDays:45,
    notes:'ViralStyle operates crowdfunded/custom apparel campaign storefront infrastructure. Platform presence alone does not establish the seller/campaign operator identity.',
    consumerRiskNotes:'BBB reports an ongoing pattern of delivery/product complaints and 46 complaints in the last three years as of the review date.',
    sources:['https://viralstyle.com/'],
    consumerRiskSources:['https://www.bbb.org/us/fl/tampa/profile/online-retailer/viral-style-llc-0653-90212358/complaints'],
  },
  {
    id:'spring-teespring-platform',
    name:'Spring / Teespring creator-commerce platform',
    networkType:'white-label-platform',
    domains:['teespring.com','spring.com'],
    evidenceFamilies:['shared-platform','shared-operator'],
    status:'watch',
    reviewedAt:'2026-10-06',
    freshnessDays:45,
    notes:'Spring/Teespring provides storefront, production and fulfillment for creator merchandise. A Spring-powered shop can therefore look like an independent merchant while production/fulfillment is centralized.',
    consumerRiskNotes:'Current Trustpilot results show substantial recent complaints involving non-delivery, support and creator payout delays. Platform-level complaints must not automatically transfer to every creator storefront.',
    sources:['https://www.teespring.com/'],
    consumerRiskSources:['https://www.trustpilot.com/review/www.teespring.com'],
  },
  {
    id:'moteefe-platform',
    name:'Moteefe creator-merchandise platform',
    networkType:'white-label-platform',
    domains:['moteefe.com'],
    evidenceFamilies:['shared-platform','shared-operator'],
    status:'watch',
    reviewedAt:'2026-10-06',
    freshnessDays:45,
    notes:'Moteefe provides creator/product campaign commerce and fulfillment. It is useful as a platform signature because many consumer-facing campaigns do not make the production operator obvious.',
    consumerRiskNotes:'Current Trustpilot results include a material one-star share and recent complaints around non-delivery, support and product/advertising mismatch.',
    sources:['https://www.moteefe.com/'],
    consumerRiskSources:['https://www.trustpilot.com/review/moteefe.com'],
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

export function merchantNetworkIsFresh(network:MerchantNetworkDefinition,now=new Date()):boolean{
  const reviewed=Date.parse(network.reviewedAt+'T00:00:00Z');
  if(!Number.isFinite(reviewed)) return false;
  return now.getTime()-reviewed <= network.freshnessDays*86_400_000;
}

export function merchantNetworkEvidence(domain:string,now=new Date()):EvidenceSignal[]{
  const network=merchantNetworkForDomain(domain);
  if(!network) return [];
  const fresh=merchantNetworkIsFresh(network,now);
  const hiddenLike=network.networkType==='sister-store';
  const activeAndFresh=network.status==='active' && fresh;
  const strongIdentity=hiddenLike && activeAndFresh;

  return [{
    id:'KNOWN_AFFILIATED_MERCHANT_NETWORK',
    family:'identity',
    severity:strongIdentity?'strong':activeAndFresh?'moderate':'info',
    confidence:strongIdentity?.95:activeAndFresh?.86:.72,
    weight:strongIdentity?24:activeAndFresh?10:0,
    title:hiddenLike?'Affiliated sister-store network detected':'Related commerce network detected',
    explanation:fresh
      ? 'DropShredder has multiple independent public linkage families connecting this storefront to other merchant domains. Affiliation itself is not fraud, and complaint evidence from one network member is never inherited by another without its own corroboration.'
      : 'This merchant-network record has exceeded its freshness window and requires re-verification. It is shown as historical/contextual identity evidence only until refreshed.',
    observedValue:`${network.name} • type: ${network.networkType} • ${network.domains.join(', ')} • status: ${network.status} • reviewed ${network.reviewedAt} • evidence: ${network.evidenceFamilies.join(', ')}`,
    independentKey:`merchant-network:${network.id}`,
  }];
}
