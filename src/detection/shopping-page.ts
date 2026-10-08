import {pageSafety} from '../security/page-safety';

export interface ShoppingPageFacts {
  url:string;
  title?:string;
  structuredProduct?:boolean;
  structuredOffer?:boolean;
  structuredArticle?:boolean;
  ogProduct?:boolean;
  purchaseAction?:boolean;
  visiblePrice?:boolean;
  productDetail?:boolean;
  focusedHero?:boolean;
  productCards?:number;
  hasSensitiveFields?:boolean;
}

export type PageKind='product'|'collection'|'general'|'sensitive'|'uncertain';
export interface PageClassification {
  kind:PageKind;
  showToast:boolean;
  confidence:'high'|'medium'|'low';
  reasons:string[];
}

/**
 * Precision > recall: failing to toast on an unusual legitimate product page
 * is safer than interrupting ordinary browsing or making claims about an article.
 * Every positive decision requires independent commerce AND product-page cues.
 */
export function classifyShoppingPage(f:ShoppingPageFacts):PageClassification {
  const no=(kind:PageKind,reason:string):PageClassification=>({
    kind,showToast:false,confidence:'low',reasons:[reason],
  });
  if(!pageSafety(f.url).allowed || f.hasSensitiveFields) return no('sensitive','Sensitive or unsupported page');
  let u:URL;
  try{u=new URL(f.url);}catch{return no('general','Invalid URL');}
  if(u.protocol!=='https:' && u.protocol!=='http:') return no('general','Not a web page');
  const path=u.pathname.toLowerCase().replace(/\/+$/,'')||'/';
  if(path==='/') return no('general','Store or website home page');
  const segments=path.split('/').filter(Boolean);
  const marketplaceDetail=/(?:^|\/)(?:dp|gp\/product)\/[a-z0-9]{10}(?:\/|$)/i.test(path)
    || /(?:^|\/)listing\/\d+(?:\/|$)/i.test(path)
    || /(?:^|\/)ip\/(?:[^/]+\/)?\d{7,}(?:\/|$)/i.test(path);
  const productPath=marketplaceDetail || segments.some((part,i)=>
    /^(?:products?|item|sku)$/.test(part) && i<segments.length-1 &&
    !/^(?:reviews?|search|categories|collections)$/.test(segments[i+1]||'')
  ) || /\/(?:p|pd)\/[a-z0-9][a-z0-9_-]{4,}/i.test(path);
  const collectionPath=/(?:^|\/)(?:search|s|collections?|categories|category|catalog|shop|stores|browse|results|sale|deals|clearance|promotions)(?:\/|$)/.test(path)
    || u.searchParams.has('search_query') || u.searchParams.has('searchTerm');
  const editorialPath=/(?:^|\/)(?:blog|blogs|news|articles?|stories|guides|tutorials|reviews|editorial|magazine)(?:\/|$)/.test(path);
  if(editorialPath && !marketplaceDetail) return no('general','Editorial page');
  if(collectionPath && !productPath) return no('collection','Collection or search page');
  if(f.structuredArticle && !productPath && !marketplaceDetail) return no('general','Article, not a sales listing');
  // Merchandising grids can contain one Product schema, prices and add-to-cart controls.
  if((f.productCards??0)>=8 && !productPath && !f.ogProduct) return no('collection','Several products on the page');

  const identity=Boolean(f.structuredProduct || f.ogProduct || productPath);
  const buying=Boolean(f.purchaseAction);
  const price=Boolean(f.visiblePrice || f.structuredOffer);
  const detail=Boolean(f.productDetail && f.title && f.title.trim().length>=4);
  const score=(f.structuredProduct?3:0)+(f.ogProduct?2:0)+(productPath?2:0)
    +(buying?3:0)+(price?2:0)+(detail?2:0);
  const reasons:string[]=[];
  if(f.structuredProduct) reasons.push('Single-product structured data');
  if(productPath) reasons.push('Product listing URL');
  if(buying) reasons.push('Visible purchase action');
  if(price) reasons.push('Price or offer detected');
  if(detail) reasons.push('Individual product details');
  // A storefront platform, product mention, ad or price alone NEVER qualifies.
  const high=score>=7 && buying && price && detail &&
    (identity || (f.focusedHero && (f.productCards??0)<8));
  if(high) return {kind:'product',showToast:true,confidence:'high',reasons};
  const plausible=score>=4 && (identity || buying);
  return {kind:plausible?'uncertain':'general',showToast:false,confidence:plausible?'medium':'low',reasons};
}
