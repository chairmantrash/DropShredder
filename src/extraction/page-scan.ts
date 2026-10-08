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
  const LIMITS={images:160,scripts:220,pageText:100_000,cards:160,amazonCards:120,reviews:60,htmlSignature:60_000} as const;
  // These limits cap WORK as well as output. Slicing a giant DOM result afterwards is not a work limit.
  const MAX_JSON_SCRIPTS=40, MAX_JSON_BYTES=60_000, MAX_JSON_NODES=120, MAX_JSON_DEPTH=8;
  const MAX_TEXT_NODES=4500, MAX_ELEMENTS=9000, MAX_LINKS=1200;
  const bounded=(value:string|undefined,limit:number):string|undefined=>value?.trim().slice(0,limit)||undefined;

        const meta=(selector:string):string|undefined =>
          document.querySelector<HTMLMetaElement>(selector)?.content?.trim() || undefined;
        const canonical=document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || undefined;

        const jsonNodes: Record<string, unknown>[]=[];
        const walk=(value:unknown,depth=0):void=>{
          if(depth>MAX_JSON_DEPTH || jsonNodes.length>=MAX_JSON_NODES) return;
          if(Array.isArray(value)){
            for(let i=0;i<Math.min(value.length,MAX_JSON_NODES);i++) walk(value[i],depth+1);
            return;
          }
          if(!value || typeof value!=='object') return;
          const record=value as Record<string,unknown>;
          jsonNodes.push(record);
          if (Array.isArray(record['@graph'])) walk(record['@graph'],depth+1);
        };
        let jsonScripts=0;
        for(let i=0;i<Math.min(document.scripts.length,LIMITS.scripts) && jsonScripts<MAX_JSON_SCRIPTS;i++){
          const script=document.scripts.item(i);
          if(script?.type!=='application/ld+json') continue;
          jsonScripts++;
          const input=script.textContent || '';
          if(input.length>MAX_JSON_BYTES) continue;
          try { walk(JSON.parse(input)); } catch {}
        }
        const product=jsonNodes.find(node=>{
          const t=node['@type'];
          return t==='Product' || (Array.isArray(t) && t.includes('Product'));
        });
        const asRecord=(v:unknown):Record<string,unknown>|undefined =>
          v && typeof v==='object' && !Array.isArray(v) ? v as Record<string,unknown> : undefined;
        const first=(v:unknown):string|undefined=>{
          if (typeof v==='string') return bounded(v,4000);
          if (Array.isArray(v)) return bounded(v.find(x=>typeof x==='string') as string|undefined,4000);
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
          ? imageValue.slice(0,60).filter((x):x is string=>typeof x==='string').map(x=>x.slice(0,2048))
          : typeof imageValue==='string'?[imageValue.slice(0,2048)]:[];
        const pageImages:string[]=[];
        for(let i=0;i<Math.min(document.images.length,LIMITS.images);i++){
          const image=document.images.item(i);
          const src=image?.currentSrc || image?.src;
          if(src) pageImages.push(src.slice(0,2048));
        }
        const scriptSources:string[]=[];
        for(let i=0;i<Math.min(document.scripts.length,LIMITS.scripts);i++){
          const src=document.scripts.item(i)?.src;
          if(src) scriptSources.push(src.slice(0,2048));
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

        // A bounded text-node walk avoids materializing the entire body's innerText on huge pages.
        const pagePieces:string[]=[];
        let pageChars=0, visitedTextNodes=0;
        if(document.body){
          const textWalker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
          while(visitedTextNodes<MAX_TEXT_NODES && pageChars<LIMITS.pageText){
            const node=textWalker.nextNode();
            if(!node) break;
            visitedTextNodes++;
            const parent=node.parentElement;
            if(!parent || parent.closest('script,style,noscript,textarea,input,select,option,[contenteditable="true"],[hidden],[aria-hidden="true"]')) continue;
            const value=(node.nodeValue||'').replace(/\\s+/g,' ').trim();
            if(!value) continue;
            const clipped=value.slice(0,Math.min(1500,LIMITS.pageText-pageChars));
            pagePieces.push(clipped);
            pageChars+=clipped.length+1;
          }
        }
        const pageText=pagePieces.join(' ').slice(0,LIMITS.pageText);
        const shippingMatch=pageText.match(/(?:shipping|delivery)[^\n]{0,100}(?:\d+\s*(?:-|to|–)\s*\d+\s+(?:business\s+)?days)/i);

        const classifyLink=(a:HTMLAnchorElement):'about'|'shipping'|'returns'|'contact'|undefined=>{
          const haystack=(a.pathname+' '+(a.innerText||'')).toLowerCase();
          if(/about|our story|who we are/.test(haystack)) return 'about';
          if(/shipping|delivery/.test(haystack)) return 'shipping';
          if(/return|refund|exchange/.test(haystack)) return 'returns';
          if(/contact/.test(haystack)) return 'contact';
          return undefined;
        };
        const siteLinks:Array<{kind:'about'|'shipping'|'returns'|'contact';url:string}>=[];
        const seenLinkKinds=new Set<string>();
        const anchors=document.getElementsByTagName('a');
        for(let i=0;i<Math.min(anchors.length,MAX_LINKS) && siteLinks.length<4;i++){
          const a=anchors.item(i);
          if(!a?.href) continue;
          try{
            const url=new URL(a.href,location.href);
            const kind=classifyLink(a);
            if(url.origin===location.origin && kind && !seenLinkKinds.has(kind) && url.href.length<=2048){
              seenLinkKinds.add(kind);
              siteLinks.push({kind,url:url.href});
            }
          }catch{}
        }

        const cardSelectors=[
          '[class*="product-card"]','[class*="product_card"]','[class*="product-item"]',
          '[class*="product_item"]','[data-product-id]','li[class*="product"]'
        ];
        const cards:HTMLElement[]=[];
        const amazonElements:HTMLElement[]=[];
        const reviewElements:HTMLElement[]=[];
        if(document.body){
          const elementWalker=document.createTreeWalker(document.body,NodeFilter.SHOW_ELEMENT);
          let visitedElements=0;
          const cardSelector=cardSelectors.join(',');
          while(visitedElements<MAX_ELEMENTS){
            const element=elementWalker.nextNode();
            if(!element) break;
            visitedElements++;
            if(!(element instanceof HTMLElement)) continue;
            if(cards.length<LIMITS.cards && element.matches(cardSelector)) cards.push(element);
            if(amazonElements.length<LIMITS.amazonCards && element.matches('[data-component-type="s-search-result"][data-asin], [data-asin].s-result-item')) amazonElements.push(element);
            if(reviewElements.length<LIMITS.reviews && element.matches('[data-hook="review"]')) reviewElements.push(element);
          }
        }
        const saleCards=cards.filter(card=>
          Boolean(card.querySelector('del,s,[class*="compare"],[class*="was-price"],[class*="sale-price"]'))
          || /\\b(?:sale|save\\s+\\d+%|\\d+%\\s+off)\\b/i.test((card.innerText||'').slice(0,1500))
        );
        const catalog={cardCount:cards.length,saleCardCount:saleCards.length};

        const amazonSearchCards:AmazonSearchCard[]=amazonElements
          .map(card=>{
            const asin=(card.dataset.asin || '').trim().toUpperCase();
            const title=(card.querySelector<HTMLElement>('h2, [data-cy="title-recipe"] h2')?.innerText || '').replace(/\\s+/g,' ').trim().slice(0,500);
            const image=card.querySelector<HTMLImageElement>('img.s-image, img[data-image-latency]');
            const priceText=card.querySelector<HTMLElement>('.a-price .a-offscreen')?.innerText || '';
            const price=Number(priceText.replace(/[^0-9.]/g,'')) || undefined;
            return {
              asin,
              title,
              imageUrl:(image?.currentSrc || image?.src)?.slice(0,2048),
              price,
            };
          })
          .filter(card=>/^[A-Z0-9]{10}$/.test(card.asin) && Boolean(card.title));

        const reviews=reviewElements
          .map((review,index)=>{
            const text=(selector:string)=>(review.querySelector<HTMLElement>(selector)?.innerText || '').replace(/\s+/g,' ').trim().slice(0,4000);
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
              ...(('Shopify' in window || scriptSources.some(src=>src.includes('cdn.shopify.com')) || document.querySelector('link[href*="cdn.shopify.com"]'))
                ? ['platform:shopify'] : []),
              ...((document.body?.classList.contains('woocommerce') || scriptSources.some(src=>/wc-(?:cart|checkout|add-to-cart)/i.test(src)))
                ? ['platform:woocommerce'] : []),
              ...((scriptSources.some(src=>src.includes('bigcommerce.com')) || document.querySelector('[data-content-region]'))
                ? ['platform:bigcommerce'] : []),
              ...((document.querySelector('script[src*="requirejs"], script[src*="/static/version"]') || 'mage' in window)
                ? ['platform:magento'] : []),
              ...((scriptSources.some(src=>/myshopline\.com|shoplineapp\.com/i.test(src))
                || pageImages.some(src=>/myshopline\.com/i.test(src))
                || document.querySelector('link[href*="myshopline.com"], meta[content*="SHOPLINE"]'))
                ? ['platform:shopline'] : []),
              ...(document.querySelector('#looxReviews, .loox-rating') || scriptSources.some(src=>src.includes('loox.io/widget/loox.js'))
                ? ['review-platform:loox'] : []),
              ...(document.querySelector('#judgeme_product_reviews, .jdgm-widget, .jdgm-review-widget, .jdgm-preview-badge')
                ? ['review-platform:judgeme'] : []),
              ...(scriptSources.some(src=>src.includes('track123.com/track123-widget.min.js') || src.includes('shp.track123.com/tracking-page/build/widget.min.js'))
                || document.querySelector('#track123-tracking-widget, track123-tracking-widget')
                ? ['tracking-platform:track123'] : []),
              ...(scriptSources.some(src=>src.includes('parcelpanel.com/assets/tracking/track-page.js') || src.includes('shopify-edd.parcelpanel.com/loader.js'))
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
          htmlSignature:(()=>{
            const parts:string[]=[];
            const head=document.head;
            if(head) for(let i=0;i<Math.min(head.children.length,100);i++){
              const item=head.children.item(i);
              if(item) parts.push(item.outerHTML.slice(0,500));
            }
            return parts.join(' ').slice(0,LIMITS.htmlSignature)+' '+(document.body?.className || '').slice(0,500);
          })(),
          amazonSearchCards,
        };
      
}
