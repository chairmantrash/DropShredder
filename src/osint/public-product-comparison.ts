import type {ProductSnapshot} from '../types/product';
import type {EvidenceSignal} from '../types/evidence';
import {publicEvidenceUrl} from '../security/public-url';
import {pageSafety} from '../security/page-safety';
import {compareProductListings} from '../analysis/product-comparison';
import {normalizeGtin} from '../analysis/product-identity';

type Node=Record<string,unknown>;
const record=(v:unknown):Node|undefined=>v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Node:undefined;
const text=(v:unknown):string|undefined=>typeof v==='string'&&v.trim()&&v.length<=500?v.trim():undefined;
const values=(v:unknown):unknown[]=>Array.isArray(v)?v:v===undefined?[]:[v];
const type=(n:Node,t:string)=>values(n['@type']).some(v=>v===t||v===`https://schema.org/${t}`||v===`http://schema.org/${t}`);
const name=(v:unknown)=>text(v)??text(record(v)?.name);

/** Only path-addressed, public HTTPS product pages. Never silently remove a variant or secret query. */
export function comparisonUrl(value:string):string|undefined{
  const raw=value.trim(),safe=publicEvidenceUrl(raw);
  if(!safe||!pageSafety(safe).allowed)return undefined;
  const url=new URL(raw);
  if(url.search||url.hash||url.pathname==='/'||/%(?:2f|5c|25)/i.test(url.pathname))return undefined;
  return safe;
}
function boundUrl(value:unknown,base:string):string|undefined{
  const raw=text(value);if(!raw)return undefined;
  try{return comparisonUrl(new URL(raw,base).href);}catch{return undefined;}
}

/** Parse data only: no DOM, script execution, remote images, markup insertion or secondary requests. */
export function productFromPublicHtml(html:string,url:string,capturedAt:string):ProductSnapshot|undefined{
  if(!comparisonUrl(url)||html.length>1_000_000||!Number.isFinite(Date.parse(capturedAt)))return undefined;
  const nodes:Node[]=[];let budget=0;
  const walk=(value:unknown,depth=0):void=>{
    if(depth>12||++budget>1200)throw new Error('Public product data exceeded the work limit.');
    if(Array.isArray(value)){for(const child of value)walk(child,depth+1);return;}
    const n=record(value);if(!n)return;nodes.push(n);
    // Do not treat item lists, recommendations, reviews or arbitrary nested objects as the main product.
    for(const key of ['@graph','hasVariant'])if(n[key])walk(n[key],depth+1);
  };
  // HTML raw-text script bodies are read as data; comments and other raw-text containers are skipped.
  const tags=/<!--[\s\S]*?-->|<(style|textarea|template|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>|<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  let count=0;
  for(const m of html.matchAll(tags)){
    if(m[2]===undefined||!/(?:^|\s)type\s*=\s*(?:"application\/ld\+json"|'application\/ld\+json')(?=\s|$)/i.test(m[2]))continue;
    if(++count>32||m[3]!.length>250_000)throw new Error('Public product data exceeded the work limit.');
    let data:unknown;try{data=JSON.parse(m[3]!);}catch{continue;}walk(data);
  }
  const products=nodes.filter(n=>type(n,'Product'));
  const productUrl=(p:Node)=>{
    if(text(p.url))return boundUrl(p.url,url);
    const id=text(p['@id']);
    // Fragment-only graph IDs do not address a listing. Never erase a variant fragment.
    if(!id||!(/^(?:https?:\/\/|\/)/.test(id)))return undefined;
    return boundUrl(id.replace(/#product$/i,''),url);
  };
  const offers=(p:Node)=>values(p.offers).map(record).filter((n):n is Node=>Boolean(n)&&type(n!,'Offer'));
  const explicit=(p:Node)=>productUrl(p)===url||offers(p).some(o=>boundUrl(o.url,url)===url);
  const bound=products.filter(explicit);
  for(const key of ['sku','mpn','color','size','material']){
    if(new Set(bound.map(p=>text(p[key])?.normalize('NFKC').toLowerCase()).filter(Boolean)).size>1)return undefined;
  }
  const declaredGtins=bound.flatMap(p=>[p.gtin,p.gtin8,p.gtin12,p.gtin13,p.gtin14].map(text).filter((v):v is string=>Boolean(v)));
  if(declaredGtins.length>1)consistentGtin(declaredGtins);
  // A lightweight graph reference must not shadow the explicitly addressed main Product.
  const addressed=bound.filter(p=>boundUrl(p.url,url)===url||offers(p).some(o=>boundUrl(o.url,url)===url));
  const selected=[...new Map((addressed.length?addressed:bound).map(p=>[JSON.stringify(p),p])).values()];
  // Unbound singleton data can describe a recommendation; require an exact Product/Offer URL.
  if(selected.length!==1)return undefined;
  const p=selected[0]!,ownUrl=productUrl(p);
  if(text(p.url)&&ownUrl!==url)return undefined;
  const allOffers=offers(p),selectedOffers=allOffers.filter(o=>boundUrl(o.url,url)===url);
  const offer=selectedOffers.length===1?selectedOffers[0]:allOffers.length===1&&!text(allOffers[0]?.url)&&ownUrl===url?allOffers[0]:undefined;
  // A multi-offer product with no unique selected offer may still supply product identity, never its price.
  const rawPrice=offer?.price,price=typeof rawPrice==='number'?rawPrice:typeof rawPrice==='string'&&/^\d+(?:\.\d+)?$/.test(rawPrice)?Number(rawPrice):undefined;
  const currency=text(offer?.priceCurrency)?.toUpperCase();
  const specs:Record<string,string>={};
  for(const key of ['color','size','material','capacity']){const value=text(p[key]);if(value)specs[key]=value;}
  for(const v of values(p.additionalProperty).slice(0,40)){
    const n=record(v),key=text(n?.name),value=text(n?.value);if(key&&value&&!Object.hasOwn(specs,key))specs[key]=value;
  }
  const gtins=[p.gtin,p.gtin8,p.gtin12,p.gtin13,p.gtin14].map(text).filter((v):v is string=>Boolean(v));
  // Conflicting identifier declarations must not be resolved by arbitrary field order.
  const {hostname}=new URL(url);
  return {url,domain:hostname,title:text(p.name),brand:name(p.brand),sku:text(p.sku),mpn:text(p.mpn),
    gtin:gtins.length===1?gtins[0]:gtins.length?consistentGtin(gtins):undefined,
    price:price!==undefined&&Number.isFinite(price)&&price>=0&&currency&&/^[A-Z]{3}$/.test(currency)?price:undefined,
    currency:price!==undefined&&Number.isFinite(price)&&price>=0&&currency&&/^[A-Z]{3}$/.test(currency)?currency:undefined,
    imageUrls:[],jsonLdProductCount:products.length,capturedAt,claims:[],pageSignals:[],specifications:specs,
    extraction:{method:'jsonld',structuredIdentityResolved:true,offerResolved:Boolean(offer)}};
}
function consistentGtin(values:string[]):string|undefined{
  const normalized=values.map(normalizeGtin);
  if(normalized.some(v=>!v)||new Set(normalized).size!==1)throw new Error('Public product identifiers conflict.');
  return values[0];
}

export async function fetchPublicProduct(value:string,signal:AbortSignal,request:typeof fetch=globalThis.fetch):Promise<ProductSnapshot>{
  const url=comparisonUrl(value);if(!url)throw new Error('Use a public HTTPS product URL without a query or fragment.');
  signal.throwIfAborted();
  const response=await request(url,{signal,credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',cache:'no-store',headers:{accept:'text/html'}});
  if(!response.ok)throw new Error(`Public product request failed: HTTP ${response.status}`);
  if(response.redirected||(response.url&&response.url!==url)||!/^text\/html(?:;|$)/i.test(response.headers.get('content-type')??'')||!response.body)throw new Error('No readable public product HTML.');
  if(Number(response.headers.get('content-length')??0)>1_000_000)throw new Error('Public product page exceeded the size limit.');
  const reader=response.body.getReader(),decoder=new TextDecoder();let html='',bytes=0;
  try{while(true){signal.throwIfAborted();const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;
    if(bytes>1_000_000)throw new Error('Public product page exceeded the size limit.');html+=decoder.decode(value,{stream:true});}html+=decoder.decode();
  }finally{void reader.cancel().catch(()=>{});}
  signal.throwIfAborted();
  const product=productFromPublicHtml(html,url,new Date().toISOString());
  if(!product)throw new Error('No unambiguous product bound to this URL.');
  return product;
}

export function publicComparisonEvidence(current:ProductSnapshot,other:ProductSnapshot):EvidenceSignal{
  const match=compareProductListings(current,other);
  return {id:'PUBLIC_PRODUCT_COMPARISON',family:'provenance',severity:'info',confidence:match.matched?.85:.5,weight:0,
    title:match.conflicts.length?'Product details conflict':match.matched?'Matching product identifiers found':'Product identity remains unconfirmed',
    explanation:'A user-requested public listing comparison. A matching product, price difference or observation date does not establish supplier direction, publication order, dropshipping or deception.',
    observedValue:[other.title,match.conflicts.join(', '),match.matchedIdentifiers.join(', '),
      other.price!==undefined?`${other.price} ${other.currency}`:undefined].filter(Boolean).join(' • '),
    independentKey:'public-comparison:'+other.url,sourceKey:other.url,
    provenance:{sourceUrl:other.url,observedAt:other.capturedAt,method:'Bounded public JSON-LD Product/Offer URL binding; typed identity comparison'}};
}
