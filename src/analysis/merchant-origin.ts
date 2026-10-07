import type { EvidenceSignal } from '../types/evidence';

export type SitePageKind='about'|'shipping'|'returns'|'contact'|'other';

export interface SiteTextPage {
  kind:SitePageKind;
  url:string;
  text:string;
}

export interface MerchantOriginClaims {
  businessLocation?:string;
  manufacture?:string;
  fulfillment?:string;
}

export interface MerchantOriginResult {
  evidence:EvidenceSignal[];
  disclosedJurisdictions:string[];
  claims:MerchantOriginClaims;
}

const COUNTRIES=[
  'China','Hong Kong','Thailand','Vietnam','India','Pakistan','Bangladesh','Turkey','United States','USA',
  'United Kingdom','UK','Canada','Australia','Germany','France','Italy','Spain','Netherlands','Poland',
  'Singapore','Taiwan','South Korea','Korea','Japan','Mexico','Brazil','Portugal','Indonesia','Malaysia'
];

function countryHits(text:string):string[]{
  const out:string[]=[];
  for(const country of COUNTRIES){
    const pattern=new RegExp(`\\b${country.replace(/[.*+?^$\\{\\}()|[\\]\\\\]/g,'\\$&')}\\b`,'i');
    if(pattern.test(text)) out.push(country==='USA'?'United States':country==='UK'?'United Kingdom':country);
  }
  return [...new Set(out)];
}

function extractClaim(text:string,patterns:RegExp[]):string|undefined{
  for(const pattern of patterns){
    const match=text.match(pattern);
    if(match?.[0]) return match[0].replace(/\s+/g,' ').trim().slice(0,240);
  }
  return undefined;
}

export function analyzeMerchantOrigin(mainPageText:string,pages:SiteTextPage[]):MerchantOriginResult{
  const evidence:EvidenceSignal[]=[];
  const allSecondary=pages.map(p=>p.text).join(' ');
  const mainCountries=countryHits(mainPageText);
  const secondaryCountries=countryHits(allSecondary);
  const allCountries=[...new Set([...mainCountries,...secondaryCountries])];

  const basedClaim=extractClaim(allSecondary,[
    /(?:we are|we're|company is|headquartered|based)\s+(?:in|out of)\s+[A-Za-z][A-Za-z .,'-]{2,80}/i,
    /(?:registered office|business address|company address)[:\s-]+[^\n]{3,180}/i,
  ]);
  const madeClaim=extractClaim(allSecondary,[
    /(?:made|handmade|manufactured|crafted|produced)\s+in\s+[A-Za-z][A-Za-z .,'-]{2,80}/i,
    /(?:made|handmade|crafted)\s+by\s+(?:local\s+)?[^.]{3,100}(?:artisans?|makers?|workers?)/i,
  ]);
  const shipsClaim=extractClaim(allSecondary,[
    /(?:ships?|shipping|fulfilled|orders?\s+ship)\s+(?:directly\s+)?from\s+[A-Za-z][A-Za-z .,'-]{2,80}/i,
  ]);

  if(allCountries.length){
    evidence.push({
      id:'MERCHANT_JURISDICTIONS_DISCLOSED',family:'identity',severity:'info',confidence:.9,weight:0,
      title:'Merchant / fulfillment jurisdictions disclosed',
      explanation:'Country or jurisdiction references were found in the store\'s own About, Shipping, Returns, Contact, or shopping pages. Geography alone carries no negative weight.',
      observedValue:allCountries.join(', '),independentKey:'merchant-jurisdictions',
    });
  }

  if(mainCountries.length===0 && secondaryCountries.length>0){
    evidence.push({
      id:'MERCHANT_ORIGIN_BURIED_IN_SECONDARY_PAGES',family:'merchant',severity:'moderate',confidence:.76,weight:9,
      title:'Merchant geography is disclosed away from the shopping page',
      explanation:'The shopping page did not expose a merchant jurisdiction, while secondary About/Shipping/Returns/Contact pages did. This is a transparency signal, not a nationality penalty.',
      observedValue:secondaryCountries.join(', '),independentKey:'merchant-origin-secondary-only',
    });
  }

  const returnsPage=pages.find(p=>p.kind==='returns');
  const returnCountries=returnsPage?countryHits(returnsPage.text):[];
  const aboutShippingCountries=pages
    .filter(p=>p.kind==='about'||p.kind==='shipping')
    .flatMap(p=>countryHits(p.text));
  const primaryCountries=[...new Set(aboutShippingCountries)];

  if(returnCountries.length && primaryCountries.length && returnCountries.some(c=>!primaryCountries.includes(c))){
    evidence.push({
      id:'RETURN_JURISDICTION_DIFFERS',family:'merchant',severity:'moderate',confidence:.8,weight:10,
      title:'Return destination differs from merchant/fulfillment jurisdiction',
      explanation:'The store\'s return-policy jurisdiction differs from its About/Shipping jurisdiction. Cross-border returns can materially increase cost and friction even when the arrangement is legitimate.',
      observedValue:`Merchant/shipping: ${primaryCountries.join(', ')} • Returns: ${returnCountries.join(', ')}`,
      independentKey:'return-jurisdiction-differs',
    });
  }

  if(basedClaim || madeClaim || shipsClaim){
    evidence.push({
      id:'EXPLICIT_ORIGIN_CLAIMS',family:'claims',severity:'info',confidence:.9,weight:0,
      title:'Specific origin/manufacturing claims are verifiable',
      explanation:'The merchant makes concrete location or manufacturing claims. DropShredder can compare future package, tracking, supplier, and product evidence against these statements.',
      observedValue:[basedClaim,madeClaim,shipsClaim].filter(Boolean).join(' • '),
      independentKey:'explicit-origin-claims',
    });
  }

  return {
    evidence,
    disclosedJurisdictions:allCountries,
    claims:{businessLocation:basedClaim,manufacture:madeClaim,fulfillment:shipsClaim},
  };
}
