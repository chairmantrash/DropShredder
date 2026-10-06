import type { ProductSnapshot } from '../types/product';

export function extractBasicPageSnapshot(): ProductSnapshot {
  const meta = (selector: string): string | undefined =>
    document.querySelector<HTMLMetaElement>(selector)?.content?.trim() || undefined;

  const canonicalUrl =
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || undefined;

  const jsonLdProductCount = [...document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')]
    .flatMap((node) => {
      try {
        const parsed = JSON.parse(node.textContent || 'null');
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [];
      }
    })
    .filter((item) => {
      if (!item || typeof item !== 'object') return false;
      const type = (item as Record<string, unknown>)['@type'];
      return type === 'Product' || (Array.isArray(type) && type.includes('Product'));
    }).length;

  const imageUrls = [...document.images]
    .map((img) => img.currentSrc || img.src)
    .filter(Boolean)
    .slice(0, 25);

  return {
    url: location.href,
    domain: location.hostname,
    title: meta('meta[property="og:title"]') || document.title?.trim() || undefined,
    description:
      meta('meta[property="og:description"]') ||
      meta('meta[name="description"]'),
    canonicalUrl,
    imageUrls: [...new Set(imageUrls)],
    jsonLdProductCount,
    capturedAt: new Date().toISOString(),
    claims: [],
    pageSignals: [],
  };
}
