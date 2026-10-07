import type { ProductSnapshot } from '../types/product';
import type { ReviewSnapshot } from '../types/review';
import type { CatalogSnapshot } from '../analysis/catalog-signals';
import type { HostedReviewSummary } from '../reputation/review-discrepancy';
import type { AmazonSearchCard } from '../analysis/amazon-clone-clusters';

export interface PageScanResult {
  product:ProductSnapshot;
  pageText:string;
  reviews:ReviewSnapshot[];
  siteLinks:Array<{kind:'about'|'shipping'|'returns'|'contact';url:string}>;
  catalog:CatalogSnapshot;
  hostedReviews?:HostedReviewSummary;
  scriptSources:string[];
  htmlSignature:string;
  amazonSearchCards:AmazonSearchCard[];
}

/**
 * Runs inside Chrome's ISOLATED extension world.
 * Keep this function self-contained: chrome.scripting serializes the function body.
 */
export function extractPageScan():PageScanResult {

        const meta=(selector:string):string|undefined =>
          document.querySelector<HTMLMetaElement>(selector)?.content?.trim() || undefined;
        const canonical=document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || undefined;

        const jsonNodes: Record<string, unknown>[]=[];
        const walk=(value:unknown):void=>{
          if (Array.isArray(value)) { value.forEach(walk); return; }
          if (!value || typeof value!=='object') return;
          const record=value as Record<string,unknown>;
          jsonNodes.push(record);
          if (Array.isArray(record['@graph'])) walk(record['@graph']);
        };
        for (const script of document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')) {
          try { walk(JSON.parse(script.textContent || 'null')); } catch {}
        }
        const product=jsonNodes.find(node=>{
          const t=node['@type'];
          return t==='Product' || (Array.isArray(t) && t.includes('Product'));
        });
        const asRecord=(v:unknown):Record<string,unknown>|undefined =>
          v && typeof v==='object' && !Array.isArray(v) ? v as Record<string,unknown> : undefined;
        const first=(v:unknown):string|undefined=>{
          if (typeof v==='string') return v.trim() || undefined;
          if (Array.isArray(v)) return v.find(x=>typeof x==='string') as string|undefined;
          return undefined;
        };
        const offer=asRecord(Array.isArray(product?.offers)?product?.offers[0]:product?.offers);
        const brand=asRecord(product?.brand);
        const seller=asRecord(offer?.seller ?? product?.seller);
        const aggregateNode=asRecord(product?.aggregateRating)
          ?? asRecord(jsonNodes.find(node=>Boolean(node.aggregateRating))?.aggregateRating);
        const hostedRating=Number(aggregateNode?.ratingValue) || undefined;
        const hostedReviewCount=Number(aggregateNode?.reviewCount ?? aggregateNode?.ratingCount) || undefined;
        const imageValue=product?.image;
        const structuredImages=Array.isArray(imageValue)
          ? imageValue.filter((x):x is string=>typeof x==='string')
          : typeof imageValue==='string'?[imageValue]:[];
        const pageImages:string[]=[];
        for(let i=0;i<Math.min(document.images.length,200);i++){
          const image=document.images.item(i);
          const src=image?.currentSrc || image?.src;
          if(src) pageImages.push(src);
        }
        const scriptSources:string[]=[];
        for(let i=0;i<Math.min(document.scripts.length,300);i++){
          const src=document.scripts.item(i)?.src;
          if(src) scriptSources.push(src);
        }
        const amazonAsin=/(?:\/dp\/|\/gp\/product\/)([A-Z0-9]{10})(?:[/?]|$)/i.exec(location.pathname)?.[1]?.toUpperCase();
        const amazonSeller=(
          document.querySelector<HTMLElement>('#sellerProfileTriggerId')?.innerText
          || document.querySelector<HTMLElement>('#merchant-info a')?.innerText
          || document.querySelector<HTMLElement>('#tabular-buybox-truncate-1 .a-truncate-full')?.innerText
          || ''
        ).replace(/\s+/g,' ').trim() || undefined;

        const additionalProperties=Array.isArray(product?.additionalProperty)
          ? product?.additionalProperty
          : product?.additionalProperty ? [product.additionalProperty] : [];
        const specifications:Record<string,string>={};
        for(const entry of additionalProperties){
          const record=asRecord(entry);
          const name=first(record?.name);
          const value=first(record?.value);
          if(name && value && Object.keys(specifications).length<40) specifications[name]=value;
        }

        const pageText=(document.body?.innerText || '').slice(0,120000);
        const shippingMatch=pageText.match(/(?:shipping|delivery)[^\n]{0,100}(?:\d+\s*(?:-|to|–)\s*\d+\s+(?:business\s+)?days)/i);

        const classifyLink=(a:HTMLAnchorElement):'about'|'shipping'|'returns'|'contact'|undefined=>{
          const haystack=(a.pathname+' '+(a.innerText||'')).toLowerCase();
          if(/about|our story|who we are/.test(haystack)) return 'about';
          if(/shipping|delivery/.test(haystack)) return 'shipping';
          if(/return|refund|exchange/.test(haystack)) return 'returns';
          if(/contact/.test(haystack)) return 'contact';
          return undefined;
        };
        const siteLinks=[...document.querySelectorAll<HTMLAnchorElement>('a[href]')]
          .map(a=>{
            try{
              const url=new URL(a.href,location.href);
              const kind=classifyLink(a);
              return url.origin===location.origin && kind ? {kind,url:url.href} : undefined;
            }catch{return undefined;}
          })
          .filter((v):v is {kind:'about'|'shipping'|'returns'|'contact';url:string}=>Boolean(v))
          .filter((v,i,arr)=>arr.findIndex(x=>x.kind===v.kind)===i)
          .slice(0,4);

        const cardSelectors=[
          '[class*="product-card"]','[class*="product_card"]','[class*="product-item"]',
          '[class*="product_item"]','[data-product-id]','li[class*="product"]'
        ];
        const cards=[...new Set(cardSelectors.flatMap(selector=>[...document.querySelectorAll<HTMLElement>(selector)]))]
          .filter(card=>card.innerText.trim().length>0)
          .slice(0,200);
        const saleCards=cards.filter(card=>
          Boolean(card.querySelector('del,s,[class*="compare"],[class*="was-price"],[class*="sale-price"]'))
          || /\b(?:sale|save\s+\d+%|\d+%\s+off)\b/i.test(card.innerText)
        );
        const catalog={cardCount:cards.length,saleCardCount:saleCards.length};

        const amazonSearchCards:AmazonSearchCard[]=[...document.querySelectorAll<HTMLElement>('[data-component-type="s-search-result"][data-asin], [data-asin].s-result-item')]
          .slice(0,160)
          .map(card=>{
            const asin=(card.dataset.asin || '').trim().toUpperCase();
            const title=(card.querySelector<HTMLElement>('h2, [data-cy="title-recipe"] h2')?.innerText || '').replace(/\s+/g,' ').trim();
            const image=card.querySelector<HTMLImageElement>('img.s-image, img[data-image-latency]');
            const priceText=card.querySelector<HTMLElement>('.a-price .a-offscreen')?.innerText || '';
            const price=Number(priceText.replace(/[^0-9.]/g,'')) || undefined;
            return {
              asin,
              title,
              imageUrl:image?.currentSrc || image?.src,
              price,
            };
          })
          .filter(card=>/^[A-Z0-9]{10}$/.test(card.asin) && Boolean(card.title));

        const reviews=[...document.querySelectorAll<HTMLElement>('[data-hook="review"]')]
          .slice(0,80)
          .map((review,index)=>{
            const text=(selector:string)=>(review.querySelector<HTMLElement>(selector)?.innerText || '').replace(/\s+/g,' ').trim();
            const ratingText=text('[data-hook="review-star-rating"], [data-hook="cmps-review-star-rating"]');
            const ratingMatch=ratingText.match(/([1-5](?:\.\d)?)/);
            return {
              id:review.id || `visible-review-${index}`,
              platform:'amazon',
              rating:ratingMatch ? Number(ratingMatch[1]) : undefined,
              title:text('[data-hook="review-title"]'),
              body:text('[data-hook="review-body"], [data-hook="reviewText"], [data-hook="reviewRichContentContainer"]'),
              date:text('[data-hook="review-date"]') || undefined,
              verified:Boolean(review.querySelector('[data-hook="avp-badge"]')),
              helpfulCount:Number((text('[data-hook="helpful-vote-statement"]').match(/\d+/)?.[0])) || undefined,
              reviewerName:text('.a-profile-name') || undefined,
            };
          })
          .filter(review=>review.body);

        return {
          product:{
            url:location.href,
            domain:location.hostname,
            canonicalUrl:canonical,
            title:first(product?.name) || meta('meta[property="og:title"]') || document.title?.trim() || undefined,
            description:first(product?.description) || meta('meta[property="og:description"]') || meta('meta[name="description"]'),
            price:Number(offer?.price) || undefined,
            currency:first(offer?.priceCurrency),
            brand:first(brand?.name ?? product?.brand),
            seller:first(seller?.name ?? offer?.seller ?? product?.seller) || amazonSeller,
            sku:first(product?.sku),
            asin:amazonAsin,
            mpn:first(product?.mpn),
            gtin:first(product?.gtin ?? product?.gtin13 ?? product?.gtin12 ?? product?.gtin14 ?? product?.gtin8),
            imageUrls:[...new Set([...structuredImages,...pageImages])].slice(0,30),
            jsonLdProductCount:jsonNodes.filter(node=>{
              const t=node['@type'];
              return t==='Product' || (Array.isArray(t) && t.includes('Product'));
            }).length,
            capturedAt:new Date().toISOString(),
            shippingText:shippingMatch?.[0],
            claims:[],
            specifications,
            pageSignals:[
              ...(('Shopify' in window || [...document.scripts].some(s=>s.src.includes('cdn.shopify.com')) || document.querySelector('link[href*="cdn.shopify.com"]'))
                ? ['platform:shopify'] : []),
              ...((document.body?.classList.contains('woocommerce') || [...document.scripts].some(s=>/wc-(?:cart|checkout|add-to-cart)/i.test(s.src)))
                ? ['platform:woocommerce'] : []),
              ...(([...document.scripts].some(s=>s.src.includes('bigcommerce.com')) || document.querySelector('[data-content-region]'))
                ? ['platform:bigcommerce'] : []),
              ...((document.querySelector('script[src*="requirejs"], script[src*="/static/version"]') || 'mage' in window)
                ? ['platform:magento'] : []),
              ...(([...document.scripts].some(s=>/myshopline\.com|shoplineapp\.com/i.test(s.src))
                || [...document.images].some(i=>/myshopline\.com/i.test(i.currentSrc||i.src))
                || document.querySelector('link[href*="myshopline.com"], meta[content*="SHOPLINE"]'))
                ? ['platform:shopline'] : []),
              ...(document.querySelector('#looxReviews, .loox-rating') || [...document.scripts].some(s=>s.src.includes('loox.io/widget/loox.js'))
                ? ['review-platform:loox'] : []),
              ...(document.querySelector('#judgeme_product_reviews, .jdgm-widget, .jdgm-review-widget, .jdgm-preview-badge')
                ? ['review-platform:judgeme'] : []),
              ...([...document.scripts].some(s=>s.src.includes('track123.com/track123-widget.min.js') || s.src.includes('shp.track123.com/tracking-page/build/widget.min.js'))
                || document.querySelector('#track123-tracking-widget, track123-tracking-widget')
                ? ['tracking-platform:track123'] : []),
              ...([...document.scripts].some(s=>s.src.includes('parcelpanel.com/assets/tracking/track-page.js') || s.src.includes('shopify-edd.parcelpanel.com/loader.js'))
                || document.querySelector('#pp-tracking-page-app, #pp-tracking-shop, parcelpanel-edd')
                ? ['tracking-platform:parcelpanel'] : []),
            ],
          },
          pageText,
          reviews,
          siteLinks,
          catalog,
          hostedReviews: hostedRating ? {
            rating: hostedRating,
            reviewCount: hostedReviewCount,
            source:'Store-hosted structured reviews',
          } : undefined,
          scriptSources,
          htmlSignature:(document.head?.innerHTML || '').slice(0,80000)+' '+(document.body?.className || ''),
          amazonSearchCards,
        };
      
}
