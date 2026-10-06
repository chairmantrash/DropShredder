export interface ProductSnapshot {
  url: string;
  domain: string;
  canonicalUrl?: string;
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  brand?: string;
  seller?: string;
  sku?: string;
  mpn?: string;
  gtin?: string;
  asin?: string;
  imageUrls: string[];
  jsonLdProductCount: number;
  capturedAt: string;
  shippingText?: string;
  claims: string[];
  pageSignals: string[];
  technicalFingerprint?: string;
  specifications?: Record<string,string>;
}
