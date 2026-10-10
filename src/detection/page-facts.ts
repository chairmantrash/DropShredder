import {hasSensitiveCommerceSurface} from '../security/sensitive-surface';
import {COMMERCE_LANGUAGE_KIT} from '../languages/commerce-kit';
import {canonicalCommerceText,normalizeCommerceCharacters,commerceTokens} from '../languages/commerce-text';
import {classifyShoppingPage,type ShoppingPageFacts} from '../detection/shopping-page';

function safeType(node:unknown):string[]{
  if(!node || typeof node!=='object') return [];
  const value=(node as Record<string,unknown>)['@type'];
  return Array.isArray(value)?value.filter((x):x is string=>typeof x==='string').slice(0,8):
    typeof value==='string'?[value]:[];
}

export function collectShoppingPageFacts(doc:Document,href:string):ShoppingPageFacts {
  const facts:ShoppingPageFacts={
    url:href,
    title:doc.querySelector('h1')?.textContent?.trim().slice(0,180),
    hasSensitiveFields:hasSensitiveCommerceSurface(COMMERCE_LANGUAGE_KIT.privateFormParts,doc),
  };
  // Never inspect scripts, prices or text on sensitive surfaces.
  if(facts.hasSensitiveFields) return facts;
  const type=doc.querySelector<HTMLMetaElement>('meta[property="og:type"]')?.content?.toLowerCase();
  facts.ogProduct=type==='product' || type==='product.item';
  facts.structuredArticle=type==='article';
  // Work budget applies to input traversal as well as parsed outputs.
  const scripts=doc.scripts;
  let parsedScripts=0;
  for(let i=0;i<Math.min(scripts.length,160) && parsedScripts<12;i++){
    const script=scripts.item(i);
    if(script?.type!=='application/ld+json') continue;
    parsedScripts++;
    const raw=script.textContent??'';
    if(!raw || raw.length>24_000) continue;
    try{
      const parsed=JSON.parse(raw) as unknown;
      const nodes:unknown[]=[parsed];
      let seen=0;
      while(nodes.length && seen++<28){
        const node=nodes.shift();
        if(Array.isArray(node)){nodes.push(...node.slice(0,15));continue;}
        if(!node || typeof node!=='object') continue;
        const obj=node as Record<string,unknown>;
        const types=safeType(obj).map(x=>x.toLowerCase());
        if(types.some(t=>/^(?:article|newsarticle|blogposting|review)$/.test(t))) facts.structuredArticle=true;
        if(types.includes('product')){
          facts.structuredProduct=true;
          const offer=Array.isArray(obj.offers)?obj.offers[0]:obj.offers;
          if(offer && typeof offer==='object'){
            const o=offer as Record<string,unknown>;
            if((typeof o.price==='string'||typeof o.price==='number') && String(o.price).length<30) facts.structuredOffer=true;
          }
        }
        if(Array.isArray(obj['@graph'])) nodes.push(...obj['@graph'].slice(0,20));
      }
    }catch{}
  }

  const purchaseSelectors=[
    'button[name="add"]','button[id*="add-to-cart" i]',
    '[data-testid*="add-to-cart" i]','[data-test*="add-to-cart" i]',
    '[itemprop="offers"] button','form[action*="/cart" i] button',
    'a[href*="/shop/buy"]','a[href*="/checkout/"]',
    '[id="add-to-cart-button"]','[id="buy-now-button"]',
  ];
  const activeControl=(el:Element|null):boolean=>{
    if(!el||el.hasAttribute('disabled')||el.getAttribute('aria-disabled')==='true'||el.closest('[hidden],[aria-hidden="true"]')) return false;
    const style=doc.defaultView?.getComputedStyle?.(el);
    return style?.display!=='none'&&style?.visibility!=='hidden';
  };
  let purchase=activeControl(doc.querySelector(purchaseSelectors.join(',')));
  if(!purchase){
    const groups=[doc.getElementsByTagName('button'),doc.getElementsByTagName('a')];
    for(const controls of groups){
      for(let i=0;i<Math.min(controls.length,50);i++){
        const el=controls.item(i);
        if(!activeControl(el)) continue;
        const phrase=canonicalCommerceText((el?.getAttribute('aria-label')||el?.textContent||'').trim().slice(0,80),80).trim();
        if(/^(?:buy(?:\s+now)?|add to (?:cart|bag)|pre-?order|purchase|add to basket)(?:\s|$)/i.test(phrase)){
          purchase=true;break;
        }
      }
      if(purchase) break;
    }
  }
  facts.purchaseAction=purchase;

  const price=doc.querySelector<HTMLElement>('[itemprop="price"],[data-price],.product-price,.price,[class*="price"],.a-price .a-offscreen,[class*="product-price"]');
  const metaPrice=doc.querySelector<HTMLMetaElement>('meta[property="product:price:amount"]');
  const priceText=(price?.textContent||metaPrice?.content||'').trim().slice(0,70);
  facts.visiblePrice=/(?:[$€£¥₹৳]|(?:USD|EUR|GBP|CAD|AUD|CNY|INR|BDT|BRL|SAR|AED)|د\.?إ|ر\.?س)[\s\S]{0,20}\d|\d[\d.,\s]*\s*(?:[$€£¥₹৳]|USD|EUR|GBP|CAD|AUD|CNY|INR|BDT|BRL|SAR|AED|د\.?إ|ر\.?س)/i.test(normalizeCommerceCharacters(priceText));

  // A title alone is not product identity. Require an individual product visual/detail section.
  facts.productDetail=Boolean(facts.title && (
    doc.querySelector('[itemprop="image"],[data-testid="product-image"],[class*="product-gallery"],[id*="product-image"],.product__media,meta[property="og:image"]')
    || doc.querySelector('main h1,article h1')
  ));
  const words=commerceTokens(facts.title||'',180).filter(w=>w.length>1).slice(0,12);
  for(let n=0;n<Math.min(doc.images.length,60) && words.length>=2;n++){
    const alt=(doc.images.item(n)?.alt||'').toLowerCase();
    const altWords=new Set(commerceTokens(alt,500).filter(w=>w.length>1));
    if(words.filter(w=>altWords.has(w)).length>=2){facts.focusedHero=true;break;}
  }
  const possibleCards=doc.getElementsByClassName('product-card').length+
    doc.getElementsByClassName('product-item').length+
    doc.getElementsByClassName('s-result-item').length;
  facts.productCards=Math.min(50,possibleCards);
  return facts;
}

export function detectShoppingPage(doc:Document,href:string){
  // URL safety is evaluated first to avoid even light DOM inspection on blocked paths.
  const early=classifyShoppingPage({url:href});
  if(early.kind==='sensitive') return early;
  return classifyShoppingPage(collectShoppingPageFacts(doc,href));
}
