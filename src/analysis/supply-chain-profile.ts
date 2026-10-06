import type { SiteTextPage } from './merchant-origin';

export type SupplyChainRole='merchant'|'manufacture'|'fulfillment'|'returns'|'payment';
export type SupplyChainClass='unknown'|'us-origin-claimed'|'mixed-us-international'|'predominantly-international'|'known-chain-entirely-international';

export interface SupplyChainNode {
  role:SupplyChainRole;
  country?:string;
  detail?:string;
  confidence:number;
  source:string;
}

export interface SupplyChainProfile {
  classification:SupplyChainClass;
  label:string;
  preferenceNote:string;
  nodes:SupplyChainNode[];
  paymentProcessors:string[];
  paymentJurisdictionKnown:boolean;
  paymentChainLabel:string;
}

const COUNTRY_ALIASES:Record<string,string[]>={
  'United States':['United States','USA','U.S.','US'],
  'China':['China','PRC'],
  'Hong Kong':['Hong Kong'],
  'Thailand':['Thailand'],
  'Vietnam':['Vietnam'],
  'India':['India'],
  'Pakistan':['Pakistan'],
  'Bangladesh':['Bangladesh'],
  'Turkey':['Turkey','Türkiye'],
  'United Kingdom':['United Kingdom','UK','U.K.'],
  'Canada':['Canada'],
  'Australia':['Australia'],
  'Germany':['Germany'],
  'France':['France'],
  'Italy':['Italy'],
  'Spain':['Spain'],
  'Netherlands':['Netherlands'],
  'Poland':['Poland'],
  'Singapore':['Singapore'],
  'Taiwan':['Taiwan'],
  'South Korea':['South Korea','Korea'],
  'Japan':['Japan'],
  'Mexico':['Mexico'],
  'Brazil':['Brazil'],
  'Portugal':['Portugal'],
  'Indonesia':['Indonesia'],
  'Malaysia':['Malaysia'],
};

function escape(value:string):string{return value.replace(/[.*+?^$\{\}()|[\]\\]/g,'\\$&');}

function countryFromText(text:string):string|undefined{
  for(const [canonical,aliases] of Object.entries(COUNTRY_ALIASES)){
    if(aliases.some(alias=>new RegExp(`\\b${escape(alias)}\\b`,'i').test(text))) return canonical;
  }
  return undefined;
}

function matchedPhrase(text:string,patterns:RegExp[]):{phrase:string;country?:string}|undefined{
  for(const pattern of patterns){
    const m=text.match(pattern);
    if(m?.[0]) return {phrase:m[0].replace(/\s+/g,' ').trim().slice(0,240),country:countryFromText(m[0])};
  }
  return undefined;
}

export function detectPaymentProcessors(input:{scripts:string[];html:string}):string[]{
  const haystack=(input.scripts.join(' ')+' '+input.html).toLowerCase();
  const defs:[string,string[]][]=[
    ['PayPal',['paypal.com/sdk','paypalobjects.com']],
    ['Stripe',['js.stripe.com','stripe.com/v3']],
    ['Adyen',['adyen.com','adyenpayments.com']],
    ['Checkout.com',['checkout.com','framesv2.min.js']],
    ['Airwallex',['airwallex.com']],
    ['Shop Pay',['shop.app/pay','shopify_payments']],
    ['Klarna',['klarna.com']],
    ['Afterpay/Clearpay',['afterpay.com','clearpay.co.uk']],
    ['Apple Pay',['apple-pay','applepay']],
    ['Google Pay',['google-pay','googlepay']],
  ];
  return defs.filter(([,needles])=>needles.some(n=>haystack.includes(n))).map(([name])=>name);
}

export function buildSupplyChainProfile(input:{
  mainPageText:string;
  pages:SiteTextPage[];
  paymentProcessors?:string[];
}):SupplyChainProfile{
  const nodes:SupplyChainNode[]=[];
  const about=input.pages.filter(p=>p.kind==='about'||p.kind==='contact').map(p=>p.text).join(' ');
  const shipping=input.pages.filter(p=>p.kind==='shipping').map(p=>p.text).join(' ');
  const returns=input.pages.filter(p=>p.kind==='returns').map(p=>p.text).join(' ');
  const all=[input.mainPageText,about,shipping,returns].join(' ');

  const merchant=matchedPhrase(about,[
    /(?:we are|we're|company is|headquartered|based)\s+(?:in|out of)\s+[^.]{2,120}/i,
    /(?:registered office|business address|company address)[:\s-]+[^.]{2,180}/i,
  ]);
  if(merchant) nodes.push({role:'merchant',country:merchant.country,detail:merchant.phrase,confidence:.82,source:'About/Contact'});

  const manufacture=matchedPhrase(all,[
    /(?:made|manufactured|produced|crafted|handmade)\s+in\s+[^.]{2,100}/i,
    /(?:manufactured|produced)\s+by\s+[^.]{2,120}/i,
  ]);
  if(manufacture) nodes.push({role:'manufacture',country:manufacture.country,detail:manufacture.phrase,confidence:.8,source:'Merchant claim'});

  const fulfillment=matchedPhrase(shipping||all,[
    /(?:orders?\s+)?(?:ship|ships|shipped|shipping|fulfilled)\s+(?:directly\s+)?from\s+[^.]{2,100}/i,
    /(?:warehouse|fulfillment center)\s+(?:is|located)?\s*(?:in|at)\s+[^.]{2,100}/i,
  ]);
  if(fulfillment) nodes.push({role:'fulfillment',country:fulfillment.country,detail:fulfillment.phrase,confidence:.78,source:'Shipping policy'});

  const returnCountry=countryFromText(returns);
  if(returnCountry) nodes.push({role:'returns',country:returnCountry,detail:'Return policy/address references '+returnCountry,confidence:.84,source:'Return policy'});

  const paymentProcessors=input.paymentProcessors ?? [];
  for(const processor of paymentProcessors){
    nodes.push({role:'payment',detail:processor+' detected; merchant banking jurisdiction not established',confidence:.95,source:'Checkout technology'});
  }

  const material=nodes.filter(n=>n.role!=='payment'&&Boolean(n.country));
  const us=material.filter(n=>n.country==='United States').length;
  const foreign=material.filter(n=>n.country && n.country!=='United States').length;
  const manufactureNode=material.find(n=>n.role==='manufacture');

  let classification:SupplyChainClass='unknown';
  let label='SUPPLY CHAIN ORIGIN: UNKNOWN';

  if(manufactureNode?.country==='United States'){
    classification=foreign>0?'mixed-us-international':'us-origin-claimed';
    label=foreign>0?'SUPPLY CHAIN: MIXED U.S. / INTERNATIONAL':'U.S. MANUFACTURE CLAIMED';
  }else if(foreign>=3 && us===0){
    classification='known-chain-entirely-international';
    label='KNOWN COMMERCE CHAIN: ENTIRELY INTERNATIONAL';
  }else if(foreign>=2 && us===0){
    classification='predominantly-international';
    label='COMMERCE CHAIN: PREDOMINANTLY INTERNATIONAL';
  }else if(foreign>0 && us>0){
    classification='mixed-us-international';
    label='SUPPLY CHAIN: MIXED U.S. / INTERNATIONAL';
  }else if(foreign>0){
    classification='predominantly-international';
    label='COMMERCE CHAIN: INTERNATIONAL EVIDENCE FOUND';
  }

  const preferenceNote=classification==='us-origin-claimed'
    ? 'The merchant claims U.S. manufacture. DropShredder has not independently verified the FTC “all or virtually all” standard.'
    : classification==='mixed-us-international'
      ? 'This does not appear to be an entirely U.S. supply chain. “Ships from USA” or a U.S. business address does not establish U.S. manufacture.'
      : classification==='predominantly-international'||classification==='known-chain-entirely-international'
        ? 'For shoppers prioritizing Made in America products, the identified commerce chain is primarily or entirely outside the United States.'
        : 'There is not enough origin evidence to determine whether this product meets a Made in USA preference.';

  const merchantNode=material.find(n=>n.role==='merchant');
  const paymentChainLabel=merchantNode?.country
    ? merchantNode.country==='United States'
      ? 'U.S. MERCHANT ENTITY CLAIMED • BANK JURISDICTION UNVERIFIED'
      : `INTERNATIONAL MERCHANT/PAYEE ENTITY: ${merchantNode.country} • BANK JURISDICTION UNVERIFIED`
    : paymentProcessors.length
      ? `PAYMENT PROCESSOR(S): ${paymentProcessors.join(', ')} • BANK JURISDICTION UNVERIFIED`
      : 'PAYMENT / BANKING JURISDICTION: UNKNOWN';

  return {
    classification,label,preferenceNote,nodes,
    paymentProcessors,
    paymentJurisdictionKnown:false,
    paymentChainLabel,
  };
}
