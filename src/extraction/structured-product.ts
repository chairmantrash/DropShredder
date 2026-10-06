import type { ProductSnapshot } from '../types/product';

type Json = Record<string, unknown>;

function asRecord(value: unknown): Json | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Json : undefined;
}
function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  return [];
}
function firstString(value: unknown): string | undefined {
  return strings(value).find(Boolean);
}
function walk(value: unknown): Json[] {
  if (Array.isArray(value)) return value.flatMap(walk);
  const rec=asRecord(value);
  if (!rec) return [];
  const graph=Array.isArray(rec['@graph']) ? walk(rec['@graph']) : [];
  return [rec,...graph];
}
function isProduct(node: Json): boolean {
  const t=node['@type'];
  return t==='Product' || (Array.isArray(t) && t.includes('Product'));
}
function parsePrice(value: unknown): number | undefined {
  const n=typeof value==='number'?value:Number(String(value ?? '').replace(/[^0-9.,-]/g,'').replace(',','.'));
  return Number.isFinite(n) ? n : undefined;
}

export function extractStructuredProduct(): Partial<ProductSnapshot> {
  const nodes=[...document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')]
    .flatMap(script=>{
      try { return walk(JSON.parse(script.textContent || 'null')); } catch { return []; }
    });
  const product=nodes.find(isProduct);
  if (!product) return {};

  const offerCandidates=walk(product.offers).filter(x=>x['@type']==='Offer' || x.price || x.lowPrice);
  const offer=offerCandidates[0];
  const brand=asRecord(product.brand);
  const seller=asRecord(offer?.seller ?? product.seller);

  return {
    title:firstString(product.name),
    description:firstString(product.description),
    imageUrls:[...new Set(strings(product.image))],
    sku:firstString(product.sku),
    mpn:firstString(product.mpn),
    gtin:firstString(product.gtin ?? product.gtin13 ?? product.gtin12 ?? product.gtin14 ?? product.gtin8),
    brand:firstString(brand?.name ?? product.brand),
    seller:firstString(seller?.name ?? offer?.seller ?? product.seller),
    price:parsePrice(offer?.price ?? offer?.lowPrice),
    currency:firstString(offer?.priceCurrency),
  };
}
