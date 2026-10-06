import type { DropShredderReport } from '../types/report';
import type { DropShredderFeatureSettings } from '../settings/features';

export interface DiagnosticPageSnapshot {
  url:string;
  scriptSources:string[];
  imageUrls:string[];
  siteLinkKinds:string[];
  catalog:{cardCount:number;saleCardCount:number};
  hostedReviewCount?:number;
  visibleReviewCount:number;
  jsonLdProductCount:number;
}

export interface DiagnosticBundle {
  schemaVersion:1;
  generatedAt:string;
  extension:{version:string;manifestVersion:number};
  browser:{userAgent:string;language:string};
  scan:{durationMs:number;domain:string;pageUrl:string};
  settings:DropShredderFeatureSettings;
  coverage:{
    detectedPlatforms:string[];
    paymentProcessors:string[];
    pageSignals:string[];
    siteLinkKinds:string[];
    productIdentifiers:string[];
    jsonLdProductCount:number;
    catalogCardCount:number;
    catalogSaleCardCount:number;
    visibleReviewCount:number;
    hostedReviewCount?:number;
  };
  discovery:{
    scriptHosts:string[];
    imageHosts:string[];
    unknownScriptHosts:string[];
    notes:string[];
  };
  result:{
    verdict:DropShredderReport['verdict'];
    supplyChain?:DropShredderReport['supplyChain'];
    evidenceIds:string[];
    contradictionIds:string[];
  };
}

function safeUrl(value:string):string{
  try{
    const url=new URL(value);
    return url.origin+url.pathname;
  }catch{
    return value.slice(0,300);
  }
}

function hosts(values:string[]):string[]{
  const out=new Set<string>();
  for(const value of values){
    try{out.add(new URL(value).hostname.toLowerCase().replace(/^www\./,''));}catch{}
  }
  return [...out].sort();
}

const COMMON_NON_COMMERCE_HOSTS=[
  'google.com','googletagmanager.com','google-analytics.com','gstatic.com','doubleclick.net',
  'facebook.net','facebook.com','instagram.com','tiktok.com','youtube.com','cloudflare.com',
  'cloudflareinsights.com','sentry.io','newrelic.com','hotjar.com','clarity.ms'
];

function likelyUnknownCommerceHosts(scriptHosts:string[],detectedPlatforms:string[]):string[]{
  const knownWords=[
    ...detectedPlatforms,
    'shopify','woocommerce','bigcommerce','magento','adobe','shopline','shoplazza','shopbase',
    'wix','ecwid','squarespace','prestashop','opencart','shift4shop','demandware',
    'stripe','paypal','adyen','klarna','afterpay','clearpay','airwallex'
  ].map(x=>x.toLowerCase());

  return scriptHosts.filter(host=>
    !COMMON_NON_COMMERCE_HOSTS.some(common=>host===common||host.endsWith('.'+common)) &&
    !knownWords.some(word=>host.includes(word))
  ).slice(0,40);
}

export function buildDiagnosticBundle(input:{
  report:DropShredderReport;
  page:DiagnosticPageSnapshot;
  settings:DropShredderFeatureSettings;
  detectedPlatforms:string[];
  paymentProcessors:string[];
  durationMs:number;
  extensionVersion:string;
  userAgent:string;
  language:string;
}):DiagnosticBundle{
  const product=input.report.product;
  const scriptHosts=hosts(input.page.scriptSources);
  const imageHosts=hosts(input.page.imageUrls);
  const productIdentifiers=[
    product.gtin&&`gtin:${product.gtin}`,
    product.mpn&&`mpn:${product.mpn}`,
    product.sku&&`sku:${product.sku}`,
    product.asin&&`asin:${product.asin}`,
  ].filter((v):v is string=>Boolean(v));

  const notes:string[]=[];
  if(!input.detectedPlatforms.length) notes.push('No bundled commerce platform matched; inspect unknown script/image hosts.');
  if(!productIdentifiers.length) notes.push('No stable GTIN/MPN/SKU/ASIN recovered.');
  if(!input.page.siteLinkKinds.includes('about')) notes.push('No same-site About link discovered.');
  if(!input.page.siteLinkKinds.includes('shipping')) notes.push('No same-site Shipping link discovered.');
  if(!input.page.siteLinkKinds.includes('returns')) notes.push('No same-site Returns/Refund link discovered.');
  if(input.page.jsonLdProductCount===0) notes.push('No Product JSON-LD recovered.');
  if(input.report.evidence.length===0) notes.push('Scanner produced no evidence signals.');

  return {
    schemaVersion:1,
    generatedAt:new Date().toISOString(),
    extension:{version:input.extensionVersion,manifestVersion:3},
    browser:{userAgent:input.userAgent,language:input.language},
    scan:{
      durationMs:Math.round(input.durationMs),
      domain:product.domain,
      pageUrl:safeUrl(input.page.url),
    },
    settings:input.settings,
    coverage:{
      detectedPlatforms:input.detectedPlatforms,
      paymentProcessors:input.paymentProcessors,
      pageSignals:[...product.pageSignals],
      siteLinkKinds:[...new Set(input.page.siteLinkKinds)].sort(),
      productIdentifiers,
      jsonLdProductCount:input.page.jsonLdProductCount,
      catalogCardCount:input.page.catalog.cardCount,
      catalogSaleCardCount:input.page.catalog.saleCardCount,
      visibleReviewCount:input.page.visibleReviewCount,
      hostedReviewCount:input.page.hostedReviewCount,
    },
    discovery:{
      scriptHosts,
      imageHosts,
      unknownScriptHosts:likelyUnknownCommerceHosts(scriptHosts,input.detectedPlatforms),
      notes,
    },
    result:{
      verdict:input.report.verdict,
      supplyChain:input.report.supplyChain,
      evidenceIds:input.report.evidence.map(e=>e.id),
      contradictionIds:input.report.contradictions.map(c=>c.id),
    },
  };
}

export function diagnosticFilename(domain:string,generatedAt:string):string{
  const stamp=generatedAt.replace(/[:.]/g,'-');
  const safeDomain=domain.replace(/[^a-z0-9.-]/gi,'_');
  return `dropshredder-diagnostic-${safeDomain}-${stamp}.json`;
}
