import references from '../../intelligence/brand-references.json';
import {normalizeCommerceCharacters,localizedNegation} from '../languages/commerce-text';
import type {ProductSnapshot} from '../types/product';
import type {EvidenceSignal} from '../types/evidence';

const compact=(s:string)=>normalizeCommerceCharacters(s).toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const official=/\b(?:official|oficial|offiziell\w*|officiel(?:le)?|ufficiale|offici[eë]le)\b|官方|公式|رسمي|رسمية|आधिकारिक|অফিসিয়াল/iu;
const role=/\b(?:store|shop|website|site|tienda|boutique|negozio|winkel|webseite|online[- ]?shop)\b|商店|官网|公式サイト|متجر|दुकान|স্টোর/iu;

/** An incomplete primary-reference directory can flag a claim for verification, never prove counterfeit goods. */
export function brandAffiliationEvidence(product:ProductSnapshot):EvidenceSignal[]{
  const host=product.domain.toLowerCase().replace(/^www\./,'');
  const identities=(product.merchantIdentity??[]).slice(0,4).map(s=>normalizeCommerceCharacters(s.slice(0,300)));
  const reference=references.find(ref=>ref.aliases.some(alias=>{
    const key=compact(alias),escaped=alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const boundary=new RegExp('(?:^|[^\\p{L}\\p{N}])'+escaped+'(?=$|[^\\p{L}\\p{N}])','iu');
    return key.length>=4&&identities.some(s=>boundary.test(s)||(compact(host.split('.')[0]!).startsWith(key)&&compact(s).includes(key)));
  }));
  if(!reference)return [];
  const age=Date.parse(product.capturedAt)-Date.parse(reference.reviewedAt);
  if(!Number.isFinite(age)||age<0||age>365*86_400_000)return [];
  const aliasKeys=reference.aliases.map(compact);
  const officialHost=reference.knownDomains.some(d=>host===d||host.endsWith('.'+d));
  if(officialHost)return [{id:'REVIEWED_BRAND_DOMAIN_MATCH',family:'identity',severity:'info',confidence:.94,weight:0,
    title:'Website matches a reviewed brand domain',explanation:'This host matches a primary brand-website reference. This is domain context, not a guarantee of this product, checkout or seller performance.',
    observedValue:host,independentKey:'brand-affiliation:'+host,referenceUrls:[reference.sourceUrl],
    provenance:{sourceUrl:product.url,observedAt:product.capturedAt,method:'Local exact host/subdomain match against dated primary website references'}}];
  const claim=identities.find(s=>official.test(s)&&!localizedNegation(s)&&!/["“”]|\b(?:unofficial|unaffiliated|licensed|retailer|reseller|review|reported|fake|scam|jersey)\b/i.test(s)
    && (role.test(s)||aliasKeys.some(k=>compact(host.split('.')[0]!).startsWith(k))));
  if(!claim)return [];
  return [{id:'OFFICIAL_STORE_CLAIM_UNVERIFIED',family:'claims',severity:'moderate',confidence:.82,weight:12,
    title:'Check this official-store claim',
    explanation:'The website describes its store as official, but its host does not match our reviewed primary brand domains. The directory is incomplete: an authorized regional retailer may exist. Check the brand’s own site before trusting the affiliation; this does not prove fraud or counterfeits.',
    observedValue:claim,independentKey:'brand-affiliation:'+host,sourceKey:'merchant-brand-affiliation',correlationKeys:['merchant-brand-affiliation:'+host],
    referenceUrls:[reference.sourceUrl],provenance:{sourceUrl:product.url,observedAt:product.capturedAt,method:'Merchant site-identity wording versus dated, partial primary website references'}}];
}
