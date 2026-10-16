import {commerceText,canonicalCommerceText} from '../languages/commerce-text';
import type { EvidenceSignal } from '../types/evidence';
export type SitePageKind='about'|'shipping'|'returns'|'contact'|'other';
export interface SiteTextPage {kind:SitePageKind;url:string;text:string}
export interface MerchantOriginClaims {businessLocation?:string;manufacture?:string;fulfillment?:string}
export interface MerchantOriginResult {evidence:EvidenceSignal[];disclosedJurisdictions:string[];claims:MerchantOriginClaims}

const COUNTRIES:Record<string,string[]>={
  'United States':['United States','United States of America','USA','U.S.A.','U.S.','US'],
  'United Kingdom':['United Kingdom','UK','U.K.'],
  'China':['China','PRC'], 'Hong Kong':['Hong Kong'],
  'South Korea':['South Korea','Republic of Korea'],
  Thailand:['Thailand'],Vietnam:['Vietnam'],India:['India'],Pakistan:['Pakistan'],Bangladesh:['Bangladesh'],
  Turkey:['Turkey','Türkiye'],Canada:['Canada'],Australia:['Australia'],Germany:['Germany'],France:['France'],
  Italy:['Italy'],Spain:['Spain'],Netherlands:['Netherlands'],Poland:['Poland'],Singapore:['Singapore'],
  Taiwan:['Taiwan'],Japan:['Japan'],Mexico:['Mexico'],Brazil:['Brazil'],Portugal:['Portugal'],
  Indonesia:['Indonesia'],Malaysia:['Malaysia'],
};
export function jurisdictionHits(text:string):string[] {
  const bounded=canonicalCommerceText(text);
  const out:string[]=[];
  for(const [country,aliases] of Object.entries(COUNTRIES)){
    const found=aliases.some(alias=>{
      // Uppercase-only short aliases avoid treating the pronoun 'us' as a location.
      const short=alias.replace(/\./g,'').length<=3;
      const escaped=alias.replace(/[.*+?^\$\{\}()|[\]\\]/g,'\\$&');
      return new RegExp('(?:^|[^A-Za-z])'+escaped+'(?=$|[^A-Za-z])',short?'':'i').test(bounded);
    });
    if(found) out.push(country);
  }
  return out;
}
export function sameJurisdiction(a:string,b:string):boolean {
  const left=jurisdictionHits(a),right=jurisdictionHits(b);
  if(left.length && right.length) return left.some(country=>right.includes(country));
  const normalize=(v:string)=>v.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const x=normalize(a),y=normalize(b);
  return Boolean(x && y && (x===y || x.includes(y) || y.includes(x)));
}
function extractClaim(text:string,patterns:RegExp[]):string|undefined {
  for(const pattern of patterns){
    const match=commerceText(text).match(pattern)?.original;
    if(match) return match.replace(/\s+/g,' ').trim().slice(0,240);
  }
}
export function analyzeMerchantOrigin(mainPageText:string,pages:SiteTextPage[]):MerchantOriginResult {
  const evidence:EvidenceSignal[]=[];
  const secondary=pages.slice(0,4).map(page=>page.text.slice(0,80_000)).join('\n');
  const main=mainPageText.slice(0,100_000),all=main+'\n'+secondary;
  const mainCountries=jurisdictionHits(main),secondaryCountries=jurisdictionHits(secondary);
  const allCountries=[...new Set([...mainCountries,...secondaryCountries])];
  const basedClaim=extractClaim(all,[
    /(?:we are|we're|company is|headquartered|based)\s+(?:in|out of)\s+[^.;!?\n]{2,100}/i,
    /(?:registered office|business address|company address)[:\s-]+[^.;!?\n]{3,180}/i,
  ]);
  const madeClaim=extractClaim(all,[
    /\b(?:China|United States|India|Bangladesh|France|Brazil|Portugal|Spain)\s+made in\b/i,
    /(?:made|handmade|manufactured|crafted|produced)\s+in\s+[^.;!?\n]{2,100}/i,
    /(?:made|handmade|crafted)\s+by\s+(?:local\s+)?[^.;!?\n]{3,100}(?:artisans?|makers?|workers?)/i,
  ]);
  const shipsClaim=extractClaim(all,[
    /\b(?:China|United States|India|Bangladesh|France|Brazil|Portugal|Spain)\s+ships from\b/i,
    /(?:ships?|shipping|fulfilled|orders?\s+ship)\s+(?:directly\s+)?from\s+[^.;!?\n]{2,100}/i,
  ]);
  if(allCountries.length) evidence.push({
    id:'MERCHANT_JURISDICTIONS_DISCLOSED',family:'identity',severity:'info',confidence:.9,weight:0,
    title:'Jurisdiction references found',
    explanation:'Country references are context, not verified factory locations. Business, manufacturing, shipping and return roles remain separate; geography alone carries no negative weight.',
    observedValue:allCountries.join(', '),independentKey:'merchant-jurisdictions',
  });
  if(!mainCountries.length && secondaryCountries.length) evidence.push({
    id:'MERCHANT_ORIGIN_BURIED_IN_SECONDARY_PAGES',family:'merchant',severity:'info',confidence:.76,weight:0,
    title:'Jurisdiction information appears in store policies',
    explanation:'The store discloses jurisdiction information on another page. A product page need not repeat a business address; this placement alone does not establish concealment.',
    observedValue:secondaryCountries.join(', '),independentKey:'merchant-origin-secondary-only',
  });
  const returns=pages.find(page=>page.kind==='returns')?.text.slice(0,80_000)??'';
  const returnClaim=extractClaim(returns,[
    /(?:return address|return destination)[:\s-]+[^.;!?\n]{3,180}/i,
    /(?:send|ship)\s+(?:your\s+)?returns?\s+to\s+[^.;!?\n]{3,180}/i,
  ]);
  const returnCountries=jurisdictionHits(returnClaim??'');
  const primaryCountries=[...new Set(jurisdictionHits(shipsClaim??basedClaim??''))];
  if(returnCountries.length && primaryCountries.length && !returnCountries.some(country=>primaryCountries.includes(country))){
    evidence.push({id:'RETURN_JURISDICTION_DIFFERS',family:'merchant',severity:'moderate',confidence:.8,weight:10,
      title:'Explicit return destination differs from business/shipping location',
      explanation:'An explicit return destination differs from the stated business or shipping location. This can affect return costs; it does not establish manufacturing origin or deceptive dropshipping.',
      observedValue:`Business/shipping: ${primaryCountries.join(', ')} • Returns: ${returnCountries.join(', ')}`,
      independentKey:'return-jurisdiction-differs'});
  }
  if(basedClaim || madeClaim || shipsClaim) evidence.push({
    id:'EXPLICIT_ORIGIN_CLAIMS',family:'claims',severity:'info',confidence:.9,weight:0,
    title:'Specific location/manufacturing claims can be checked',
    explanation:'These are the merchant’s claims, not independently verified facts. Keep business, manufacture and shipment claims separate when comparing later evidence.',
    observedValue:[basedClaim,madeClaim,shipsClaim].filter(Boolean).join(' • '),independentKey:'explicit-origin-claims',
  });
  return {evidence,disclosedJurisdictions:allCountries,claims:{businessLocation:basedClaim,manufacture:madeClaim,fulfillment:shipsClaim}};
}
