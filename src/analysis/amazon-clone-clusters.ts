import type { EvidenceSignal } from '../types/evidence';

export interface AmazonSearchCard {
  asin:string;
  title:string;
  imageUrl?:string;
  brandCandidate?:string;
  seller?:string;
  price?:number;
}

export interface AmazonCloneCluster {
  familyKey:string;
  asins:string[];
  brands:string[];
  titles:string[];
  prices:number[];
}

const AMAZON_IMAGE_HOST=/^(?:m\.media-amazon|images(?:-na)?\.ssl-images-amazon|images-amazon)\./i;

export function normalizeAmazonImageFamily(url:string|undefined):string|undefined{
  if(!url) return undefined;
  try{
    const parsed=new URL(url);
    if(!AMAZON_IMAGE_HOST.test(parsed.hostname)) return undefined;
    const match=parsed.pathname.match(/\/images\/I\/([^/.]{8,})/i);
    if(match?.[1]) return match[1].toUpperCase();
    const file=parsed.pathname.split('/').pop()?.replace(/\._[^.]+_\./,'.') ?? '';
    const id=file.split('.')[0];
    return id && id.length>=8?id.toUpperCase():undefined;
  }catch{return undefined;}
}

function brandCandidate(title:string):string|undefined{
  const cleaned=title.replace(/^Sponsored\s*/i,'').trim();
  const token=cleaned.split(/\s+/)[0]?.replace(/[^\p{L}\p{N}&'-]/gu,'');
  if(!token || token.length<2) return undefined;
  return token;
}

export function clusterAmazonSearchCards(cards:AmazonSearchCard[]):AmazonCloneCluster[]{
  const families=new Map<string,AmazonSearchCard[]>();
  for(const card of cards){
    const key=normalizeAmazonImageFamily(card.imageUrl);
    if(!key) continue;
    const enriched={...card,brandCandidate:card.brandCandidate ?? brandCandidate(card.title)};
    const list=families.get(key) ?? [];
    list.push(enriched);
    families.set(key,list);
  }

  const clusters:AmazonCloneCluster[]=[];
  for(const [familyKey,items] of families){
    const asins=[...new Set(items.map(i=>i.asin).filter(Boolean))];
    if(asins.length<2) continue;
    const brands=[...new Set(items.map(i=>i.brandCandidate).filter((v):v is string=>Boolean(v)).map(v=>v.toLowerCase()))];
    const titles=[...new Set(items.map(i=>i.title).filter(Boolean))];
    const prices=items.map(i=>i.price).filter((v):v is number=>typeof v==='number'&&Number.isFinite(v));
    clusters.push({familyKey,asins,brands,titles,prices});
  }
  return clusters.sort((a,b)=>b.asins.length-a.asins.length);
}

export function amazonCloneClusterEvidence(cards:AmazonSearchCard[]):EvidenceSignal[]{
  const clusters=clusterAmazonSearchCards(cards);
  if(!clusters.length) return [];

  const strongest=clusters[0]!;
  const distinctBrands=strongest.brands.length;
  const distinctAsins=strongest.asins.length;
  const spread=strongest.prices.length>=2
    ? Math.max(...strongest.prices)-Math.min(...strongest.prices)
    : 0;

  const crossBrand=distinctBrands>=2;
  const largeFamily=distinctAsins>=4;
  const severity=crossBrand&&largeFamily?'strong':'moderate';

  return [{
    id:'AMAZON_COMMODITY_CLONE_CLUSTER',
    family:'provenance',
    severity,
    confidence:crossBrand?.9:.76,
    weight:severity==='strong'?22:11,
    title:'Amazon has several look-alike versions of this product',
    explanation:crossBrand
      ? 'Several Amazon listings under different apparent brands use the same main product image. They may be private-label versions of the same underlying item or closely related listings. This still does not tell us who originally made it.'
      : 'Several Amazon listings reuse the same main product image. They may be legitimate variations or duplicate versions, so compare the brands, sellers and specifications before assuming they are identical.',
    observedValue:`${distinctAsins} ASINs • ${distinctBrands || 'unknown'} apparent brand(s)${spread>0?` • visible price spread $${spread.toFixed(2)}`:''}`,
    independentKey:`amazon-clone:${strongest.familyKey}`,
  }];
}
