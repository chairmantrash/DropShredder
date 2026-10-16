import type {CommerceLanguageKit} from '../languages/commerce-kit';
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
export function extractPageScan(kit:CommerceLanguageKit):PageScanResult {
  // The live guard permits dormant credential markup. Never collect its text,
  // selected values, metadata, scripts or resources, even when CSS hides it.
  // Self-contained because Chrome serializes this function into ISOLATED world.
  const privateRoots=new Set<Element>();
  const privateFields=document.querySelectorAll('input[type="password"],input[autocomplete~="cc-number"],input[autocomplete~="cc-csc"],input[autocomplete~="current-password"],input[autocomplete~="new-password"],input[name*="cardnumber" i]');
  const forms=document.getElementsByTagName('form');
  if(privateFields.length>64||forms.length>30) throw new Error('Too many private form regions to safely isolate.');
  for(const field of privateFields) privateRoots.add(field.closest('form,dialog,[role="dialog"]')||field.parentElement||field);
  for(let i=0;i<Math.min(forms.length,30);i++){
    const form=forms.item(i)!;
    try{
      const action=form.getAttribute('action');if(!action) continue;
      const path=decodeURIComponent(new URL(action,location.href).pathname).normalize('NFKC').toLowerCase();
      if(/checkout|payment/i.test(path)||path.split('/').some(part=>kit.privateFormParts.includes(part))) privateRoots.add(form);
    }catch{/* Unrecognized destinations are never used for data collection. */}
  }
  const excluded=(element:Element):boolean=>{for(const root of privateRoots)if(root===element||root.contains(element))return true;return false;};
  const publicNode=<T extends Element=Element>(selector:string):T|null=>{
    const nodes=document.querySelectorAll<T>(selector);
    for(let i=0;i<Math.min(nodes.length,40);i++)if(!excluded(nodes[i]!))return nodes[i]!;
    return null;
  };
  const publicText=(element:Element|null,limit=4000):string=>{
    if(!element||excluded(element))return '';
    const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);let text='',visited=0;
    while(visited++<160&&text.length<limit){const node=walker.nextNode();if(!node)break;const parent=node.parentElement;
      if(parent&&!excluded(parent)&&!parent.closest('input,textarea,select,[contenteditable="true"],script,style,noscript'))text+=(node.nodeValue||'').slice(0,limit-text.length);}
    return text;
  };
  const normalizeDigits=(v:string)=>v.normalize('NFKC').replace(/[\u061c\u200b\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g,'').replace(/[٠-٩۰-۹०-९০-৯]/g,c=>String(c.charCodeAt(0)-[0x660,0x6f0,0x966,0x9e6].find(n=>c.charCodeAt(0)>=n&&c.charCodeAt(0)<n+10)!));
  const aliases=new Map<string,string>();
  for(const [key,...langs] of kit.phrases) for(const alias of langs.flat()) if((alias.length>1||/\p{Script=Han}/u.test(alias))&&alias.toLowerCase()!==key.toLowerCase()) aliases.set(alias.toLowerCase(),key);
  const escape=(v:string)=>v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const phrasePattern=new RegExp([...aliases.keys()].sort((a,b)=>b.length-a.length).map(escape).join('|'),'giu');
  const matching=(v:string)=>normalizeDigits(v).replace(phrasePattern,(m:string,offset:number,input:string)=>{
    if(!/\p{Script=Han}/u.test(m)&&(/[\p{L}\p{M}\p{N}]/u.test(input[offset-1]??'')||/[\p{L}\p{M}\p{N}]/u.test(input[offset+m.length]??''))) return m;
    return ' '+aliases.get(m.toLowerCase())+' ';
  });
  const variantKey=(v:string)=>Object.entries(kit.variants).find(([key,aliases])=>key===v||aliases.includes(v))?.[0];
  const pageLanguage=(document.documentElement.lang||'').replace('_','-');
  const visibleNumber=(value:string):number|undefined=>{
    let text=normalizeDigits(value).trim();
    // Numeric displays may contain currency, but ranges/multiple amounts remain unresolved.
    const parts=text.match(/[0-9]+(?:[.,\u066b\u066c\u00a0\u202f ]*[0-9]+)*/g);
    if(parts?.length!==1) return undefined;
    text=parts[0]!.trim().replace(/[\u00a0\u202f ]/g,'').replace(/\u066c/g,',').replace(/\u066b/g,'.');
    let decimal:string|undefined;
    try{decimal=pageLanguage?new Intl.NumberFormat(pageLanguage).formatToParts(1.5).find(p=>p.type==='decimal')?.value:undefined;}catch{return undefined;}
    if(decimal){
      const point=decimal==='٫'?'.':decimal,group=point===','?'.':',';
      const integer=text.split(point)[0]!,groups=integer.split(group);
      if(groups.length>1){
        const indian=/^(?:hi|bn)(?:-|$)/i.test(pageLanguage);
        if(groups[0]!.length>3||groups.at(-1)!.length!==3||groups.slice(1,-1).some(part=>part.length!==(indian?2:3))) return undefined;
      }
    }
    if(decimal===',') text=text.replace(/\./g,'').replace(',','.');
    else if(decimal==='.'||decimal==='٫') text=text.replace(/,/g,'');
    else if(/[.,]\d{3}$/.test(text)||text.includes(',')&&text.includes('.')) return undefined;
    else text=text.replace(',','.');
    if(!/^\d+(?:\.\d{1,3})?$/.test(text)) return undefined;
    const n=Number(text);return Number.isFinite(n)&&n>=0?n:undefined;
  };
  const LIMITS={images:160,scripts:220,pageText:100_000,cards:160,amazonCards:120,reviews:60,htmlSignature:60_000} as const;
  // These limits cap WORK as well as output. Slicing a giant DOM result afterwards is not a work limit.
  const MAX_JSON_SCRIPTS=40, MAX_JSON_BYTES=60_000, MAX_JSON_NODES=120, MAX_JSON_DEPTH=8;
  const MAX_TEXT_NODES=4500, MAX_ELEMENTS=9000, MAX_LINKS=1200;
  const bounded=(value:string|undefined,limit:number):string|undefined=>value?.trim().slice(0,limit)||undefined;

        const meta=(selector:string):string|undefined =>
          bounded(publicNode<HTMLMetaElement>(selector)?.content,4000);
        const canonical=bounded(publicNode<HTMLLinkElement>('link[rel="canonical"]')?.href,2048);

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
          if(record.hasVariant) walk(record.hasVariant,depth+1);
          if(record.mainEntity) walk(record.mainEntity,depth+1);
          if(record.isVariantOf) walk(record.isVariantOf,depth+1);
          if(record.brand) walk(record.brand,depth+1);
        };
        let jsonScripts=0;
        for(let i=0;i<Math.min(document.scripts.length,LIMITS.scripts) && jsonScripts<MAX_JSON_SCRIPTS;i++){
          const script=document.scripts.item(i);
          if(script?.type!=='application/ld+json'||excluded(script)) continue;
          jsonScripts++;
          const input=script.textContent || '';
          if(input.length>MAX_JSON_BYTES) continue;
          try { walk(JSON.parse(input)); } catch {}
        }
        // Bind seller-authored metadata to the current product before comparing it.
        const types=(node:Record<string,unknown>)=>Array.isArray(node['@type'])?node['@type']:[node['@type']];
        const products=jsonNodes.filter(node=>types(node).includes('Product'));
        const normalizeUrl=(value:unknown):string|undefined=>{
          if(typeof value!=='string' || value.length>2048) return undefined;
          try{
            const url=new URL(value,location.href);
            if(url.origin!==location.origin || !/^https?:$/.test(url.protocol)) return undefined;
            url.hash='';
            for(const key of [...url.searchParams.keys()]) if(/^(?:utm_.+|gclid|fbclid)$/i.test(key)) url.searchParams.delete(key);
            url.searchParams.sort();
            return url.href;
          }catch{return undefined;}
        };
        const currentUrl=normalizeUrl(location.href);
        const ownUrls=(node:Record<string,unknown>)=>(node.url!==undefined?[node.url]:[node['@id']]).map(normalizeUrl).filter(Boolean);
        const named=(v:unknown)=>typeof v==='string'?v.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim():'';
        const amazonProduct=/^(?:www\.)?amazon\.(?:com|ca|de|fr|it|es|in|co\.uk|co\.jp|com\.au|com\.br|com\.mx)$/.test(location.hostname) && /\/(?:dp|gp\/product)\/[A-Z0-9]{10}(?:\/|$)/i.test(location.pathname);
        // Amazon may place an accessibility/keyboard-help h1 before the actual
        // product-title span. Keep that navigation text out of product identity.
        const visibleTitle=amazonProduct
          ? bounded(publicText(publicNode('#productTitle'),500)||meta('meta[property="og:title"]')||document.title||undefined,500)
          : bounded(publicText(publicNode('h1'),500)||undefined,500);
        const translatedPage=document.documentElement.classList.contains('translated-ltr')||document.documentElement.classList.contains('translated-rtl');
        const originalMetaTitle=meta('meta[property="og:title"]');
        const soleCurrentOffer=(node:Record<string,unknown>):boolean=>{
          const offers=Array.isArray(node.offers)?node.offers:[node.offers];
          const offer=offers[0];if(offers.length!==1||!offer||typeof offer!=='object'||Array.isArray(offer))return false;
          const value=offer as Record<string,unknown>,type=value['@type'];
          if(!(type==='Offer'||Array.isArray(type)&&type.includes('Offer'))||normalizeUrl(value.url)!==currentUrl)return false;
          // A single named Product/Offer can bind an explicit variant URL.
          // Multiple offers or a different parent path remain unresolved.
          const parent=normalizeUrl(node.url);return Boolean(parent&&!new URL(parent).search&&new URL(parent).pathname===location.pathname&&visibleTitle&&named(node.name)===named(visibleTitle));
        };
        const exact=products.filter(node=>soleCurrentOffer(node)||ownUrls(node).includes(currentUrl) && (node.url!==undefined || Boolean(visibleTitle && named(node.name)===named(visibleTitle))));
        let product:Record<string,unknown>|undefined=exact.length===1?exact[0]:undefined;
        let selectedByControls=false;
        // Some ProductGroups share one URL. Require one page-scoped group and
        // an unambiguous combination of explicit selected variant attributes.
        const groups=jsonNodes.filter(node=>types(node).includes('ProductGroup') &&
          (ownUrls(node).includes(currentUrl)||(!ownUrls(node).length&&visibleTitle&&named(node.name)===named(visibleTitle))));
        const selected:Record<string,string>={};
        let conflictingControls=false;
        // Explicitly named options only. Do not guess from unlabelled image swatches,
        // prices, arbitrary form fields or a third-party widget's private state.
        const selector='main select[name],main select[data-option-name],main input[type="radio"][name]:checked,main input[type="radio"][data-option-name]:checked,main [data-option-name][aria-pressed="true"],main [data-option-name][aria-checked="true"]';
        for(const control of [...document.querySelectorAll<HTMLElement>(selector)].slice(0,40)){
          if(excluded(control)||(control.tagName==='INPUT'&&(control as HTMLInputElement).type!=='radio')) continue;
          const name=control.getAttribute('data-option-name')||control.getAttribute('name')||'';
          const key=variantKey(name.normalize('NFKC').toLowerCase().replace(/^options\[/,'').replace(/\]$/,''));
          if(!key || control.hasAttribute('disabled') || control.getAttribute('aria-disabled')==='true') continue;
          const value=control.tagName==='INPUT' || control.tagName==='SELECT'
            ? (control as HTMLInputElement|HTMLSelectElement).value : control.getAttribute('data-option-value')||control.getAttribute('value')||control.getAttribute('aria-label')||control.textContent?.slice(0,100)||'';
          if(!value || value.length>200) continue;
          const normalized=named(matching(value));
          if(!normalized) continue;
          if(selected[key]&&selected[key]!==normalized) conflictingControls=true;
          selected[key]=normalized;
        }
        if(groups.length===1&&!conflictingControls&&Object.keys(selected).length){
          const children=Array.isArray(groups[0]!.hasVariant)?groups[0]!.hasVariant:[];
          const candidates=products.filter(node=>children.includes(node)&&Object.entries(selected).every(([key,value])=>named(matching(String(node[key]??(key==='color'?node.colour:undefined)??'')))===value));
          if(candidates.length===1){
            const candidate=candidates[0]!;
            // A selected control never overrides a different exact URL match.
            if(!product||product===candidate){product=candidate;selectedByControls=true;}
            else product=undefined;
          }else product=undefined;
        }
        // A canonical parent cannot choose between variants, nor override a variant URL.
        if(!product && !exact.length && products.length===1){
          const only=products[0]!, urls=ownUrls(only);
          if(!Array.from(new URL(location.href).searchParams.keys()).some(key=>/^(?:variant|sku|color|colour|size)$/i.test(key)) && !urls.length && visibleTitle && (named(only.name)===named(visibleTitle)||(translatedPage&&originalMetaTitle&&named(only.name)===named(originalMetaTitle)))) product=only;
        }
        const asRecord=(v:unknown):Record<string,unknown>|undefined =>
          v && typeof v==='object' && !Array.isArray(v) ? v as Record<string,unknown> : undefined;
        const first=(v:unknown):string|undefined=>{
          if (typeof v==='string') return bounded(v,4000);
          if (Array.isArray(v)) return bounded(v.find(x=>typeof x==='string') as string|undefined,4000);
          return undefined;
        };
        // Resolve references only inside this bounded document graph. No fetch,
        // ancestry chain or parent identifier/offer inheritance is permitted.
        const graphId=(v:unknown):string|undefined=>{
          if(typeof v!=='string'||v.length>2048)return undefined;
          try{const u=new URL(v,location.href);return /^https?:$/.test(u.protocol)?u.href:undefined;}catch{return undefined;}
        };
        const references=(value:unknown,node:Record<string,unknown>):boolean=>{
          const object=asRecord(value),id=graphId(typeof value==='string'?value:object?.['@id']);
          return value===node||Boolean(id&&id===graphId(node['@id']));
        };
        const parents=product?jsonNodes.filter(node=>types(node).includes('ProductGroup')&&(
          (Array.isArray(node.hasVariant)?node.hasVariant:[node.hasVariant]).some(v=>references(v,product!))||
          references(product!.isVariantOf,node))):[];
        const parent=parents.length===1?parents[0]:undefined;
        const dimensions=Array.isArray(parent?.variesBy)?parent.variesBy:parent?.variesBy===undefined?[]:[parent.variesBy];
        let dimensionsResolved=dimensions.length<=16;const varying=new Set<string>();
        for(const value of dimensions.slice(0,16)){
          const term=typeof value==='string'?value:asRecord(value)?.['@id'];
          if(typeof term!=='string'||term.length>200)dimensionsResolved=false;
          else varying.add(term.split(/[\/#]/).at(-1)!.toLowerCase());
        }
        const shared=(key:'brand'|'material'):unknown=>product&&Object.hasOwn(product,key)?product[key]:parent&&dimensionsResolved&&!varying.has(key)?parent[key]:undefined;
        const brandName=(value:unknown):string|undefined=>{
          const names=new Set<string>();
          for(const v of (Array.isArray(value)?value:[value]).slice(0,8)){
            if(typeof v==='string'){const name=first(v);if(name)names.add(name);continue;}
            let record=asRecord(v);
            if(record&&!record.name&&record['@id']){
              const targets=jsonNodes.filter(n=>types(n).some(t=>t==='Brand'||t==='Organization')&&references(record,n));
              record=targets.length===1?targets[0]:undefined;
            }
            const name=first(record?.name);if(name)names.add(name);
          }
          return names.size===1?[...names][0]:undefined;
        };
        const structuredBrand=brandName(shared('brand'));
        const offers=(Array.isArray(product?.offers)?product.offers:[product?.offers]).map(asRecord).filter((v):v is Record<string,unknown>=>Boolean(v));
        const currentOffers=offers.filter(node=>ownUrls(node).includes(currentUrl));
        const offer=currentOffers.length===1?currentOffers[0]:offers.length===1 && (!ownUrls(offers[0]!).length || ownUrls(offers[0]!).includes(currentUrl) || selectedByControls)?offers[0]:undefined;
        const seller=asRecord(offer?.seller ?? product?.seller);
        const aggregateNode=asRecord(product?.aggregateRating);
        const hostedRating=typeof aggregateNode?.ratingValue==='number'?aggregateNode.ratingValue:visibleNumber(String(aggregateNode?.ratingValue??''));
        const hostedReviewCount=visibleNumber(String(aggregateNode?.reviewCount ?? aggregateNode?.ratingCount??''));
        const imageValue=product?.image;
        const structuredImages=Array.isArray(imageValue)
          ? imageValue.slice(0,60).filter((x):x is string=>typeof x==='string').map(x=>x.slice(0,2048))
          : typeof imageValue==='string'?[imageValue.slice(0,2048)]:[];
        const pageImages:string[]=[];
        for(let i=0;i<Math.min(document.images.length,LIMITS.images);i++){
          const image=document.images.item(i);
          const src=image&&!excluded(image)?image.currentSrc||image.src:undefined;
          if(src) pageImages.push(src.slice(0,2048));
        }
        const scriptSources:string[]=[];
        for(let i=0;i<Math.min(document.scripts.length,LIMITS.scripts);i++){
          const script=document.scripts.item(i);
          const src=script&&!excluded(script)?script.src:undefined;
          if(src) scriptSources.push(src.slice(0,2048));
        }
        const resourceUrl=(value:string):URL|undefined=>{
          try{const url=new URL(value,location.href);return /^https?:$/.test(url.protocol)?url:undefined;}catch{return undefined;}
        };
        const scriptUrls=scriptSources.map(resourceUrl).filter((url):url is URL=>Boolean(url));
        const imageUrls=pageImages.map(resourceUrl).filter((url):url is URL=>Boolean(url));
        const linkUrls:URL[]=[];
        const links=document.getElementsByTagName('link');
        for(let i=0;i<Math.min(links.length,LIMITS.scripts);i++){
          const link=links.item(i);
          const href=link&&!excluded(link)?link.getAttribute('href'):undefined;
          if(href&&href.length<=2048){const url=resourceUrl(href);if(url)linkUrls.push(url);}
        }
        const fromHost=(url:URL,domain:string)=>{
          const host=url.hostname.toLowerCase().replace(/\.$/,'');
          return host===domain||host.endsWith('.'+domain);
        };
        const fromResource=(url:URL,domain:string,pathname:string)=>fromHost(url,domain)&&url.pathname===pathname;
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
        for(const key of ['color','size','capacity','material']){const value=first(key==='material'?shared('material'):product?.[key]??(key==='color'?product?.colour:undefined));if(value) specifications[key]=value.slice(0,200);}
        for(const entry of additionalProperties){
          const record=asRecord(entry);
          const name=first(record?.name);
          const value=first(record?.value);
          if(name && value && Object.keys(specifications).length<40) specifications[name]=value;
        }

        // A bounded text-node walk avoids materializing the entire body's innerText on huge pages.
        const pagePieces:string[]=[];
        // A merchant can expose the current SKU while its structured variants
        // remain unresolved. Keep that store-local label separate from choosing
        // a JSON-LD offer, GTIN, variant or common supplier.
        const skuRoot=visibleTitle && (Boolean(product)||/\/(?:products?|p)\//i.test(location.pathname))
          ? publicNode('h1')?.closest('main,[role="main"],[itemtype$="/Product"]') : undefined;
        const skuPieces:string[]=[];
        const visibleBrands=new Set<string>(),visibleMpns=new Set<string>(),brandRows=new Set<Element>(),mpnRows=new Set<Element>();
        const mpnPattern=/(?:manufacturer(?:'s)?\s+(?:code|part\s+number)|mpn|c[oó]digo\s+del\s+fabricante|herstellercode|codice\s+produttore|code\s+fabricant)\s*:\s*([A-Za-z0-9][A-Za-z0-9._\/-]{1,59})(?=$|\s)/gi;
        const publicMpnRow=(row:Element):boolean=>{
          if(typeof row.getClientRects==='function'&&!row.getClientRects().length)return false;
          const walker=document.createTreeWalker(row,NodeFilter.SHOW_ELEMENT);let element:Element|null=row,visited=0;
          while(element&&visited++<32){
            if(excluded(element)||element.matches('input,textarea,select,option,[contenteditable],[hidden],[aria-hidden="true"],script,style,form'))return false;
            if(/display\s*:\s*none|visibility\s*:\s*(?:hidden|collapse)/i.test(element.getAttribute('style')??''))return false;
            if(typeof getComputedStyle==='function'){const style=getComputedStyle(element);if(style.display==='none'||style.visibility==='hidden'||style.visibility==='collapse')return false;}
            element=walker.nextNode() as Element|null;
          }
          return !element;
        };
        // Typed Microdata is a fallback only, bound to one current public Product.
        // Metadata content attributes are public declarations; control values are never read.
        const identityExcluded='form,input,textarea,select,option,[contenteditable],blockquote,q,[class*="review"],[class*="recommend"],[class*="related"],[class*="product-card"],[class*="product_card"],[class*="product-item"],[class*="product_item"]';
        const publicIdentityNode=(node:Element):boolean=>{
          if(excluded(node)||node.closest(identityExcluded))return false;
          let cursor:Element|null=node;let depth=0;
          while(cursor&&depth++<32){
            if(cursor.matches('[hidden],[aria-hidden="true"]')||/display\s*:\s*none|visibility\s*:\s*(?:hidden|collapse)/i.test(cursor.getAttribute('style')??''))return false;
            if(typeof getComputedStyle==='function'&&!(cursor===node&&node.matches('meta,link'))){const style=getComputedStyle(cursor);if(style.display==='none'||style.visibility==='hidden'||style.visibility==='collapse')return false;}
            cursor=cursor.parentElement;
          }
          return !cursor;
        };
        const productScope=(node:Element)=>node.closest('[itemscope][itemtype~="https://schema.org/Product"],[itemscope][itemtype~="http://schema.org/Product"]');
        const microText=(node:Element,scope:Element):string=>{
          const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);let text='';
          for(let i=0;i<160&&text.length<200;i++){
            const part=walker.nextNode();if(!part)break;const parent=part.parentElement;
            if(parent&&productScope(parent)===scope&&publicIdentityNode(parent))text+=(part.nodeValue??'').slice(0,200-text.length);
          }
          return text;
        };
        const microValues=(scope:Element,key:string):string[]=>{
          const nodes=scope.querySelectorAll(`[itemprop~="${key}"]`),values:string[]=[];
          for(let i=0;i<Math.min(nodes.length,40);i++){
            const node=nodes[i]!;if(productScope(node)!==scope||!publicIdentityNode(node))continue;
            // Product properties inside another nested item (e.g. Offer/Review)
            // cannot lend their identifiers to the parent Product.
            const nested=node.parentElement?.closest('[itemscope]');
            if(nested&&nested!==scope)continue;
            const value=node.matches('meta')?node.getAttribute('content'):node.matches('link,a')?node.getAttribute('href'):microText(node,scope);
            if(value?.trim()&&value.length<=200)values.push(value.trim());
          }
          return [...new Set(values)].slice(0,12);
        };
        const microScopes:Element[]=[];
        const microWalker=document.createTreeWalker(document.documentElement,NodeFilter.SHOW_ELEMENT);
        for(let i=0;i<MAX_ELEMENTS&&microScopes.length<5;i++){
          const node=microWalker.nextNode() as Element|null;if(!node)break;
          if(!node.matches('[itemscope][itemtype~="https://schema.org/Product"],[itemscope][itemtype~="http://schema.org/Product"]')||!node.closest('main,[role="main"]')||!publicIdentityNode(node))continue;
          const urls=microValues(node,'url').map(normalizeUrl).filter(Boolean),names=microValues(node,'name');
          const exactUrl=urls.length===1&&urls[0]===currentUrl;
          const variantQuery=[...new URL(location.href).searchParams.keys()].some(k=>/^(?:variant|sku|color|colour|size)$/i.test(k));
          if(!exactUrl&&(urls.length||variantQuery||products.length>1))continue;
          if(names.length!==1||!visibleTitle||named(names[0])!==named(visibleTitle))continue;
          microScopes.push(node);
        }
        const microScope=microScopes.length===1?microScopes[0]:undefined;
        const uniqueMicro=(key:string):string|undefined=>{if(!microScope)return undefined;const values=microValues(microScope,key);return values.length===1?values[0]:undefined;};
        let microBrand=uniqueMicro('brand');
        if(microScope&&!microBrand){
          const names=new Set<string>();
          for(const node of [...microScope.querySelectorAll('[itemprop~="brand"][itemscope]')].slice(0,8)){
            if(productScope(node)!==microScope||!publicIdentityNode(node))continue;
            for(const name of [...node.querySelectorAll('[itemprop~="name"]')].slice(0,8))if(publicIdentityNode(name)){
              const value=name.matches('meta')?name.getAttribute('content'):microText(name,microScope);if(value?.trim())names.add(value.trim());
            }
          }
          if(names.size===1)microBrand=[...names][0];
        }
        const microMpn=uniqueMicro('mpn');
        const validMicroGtins=microScope?['gtin','gtin8','gtin12','gtin13','gtin14'].flatMap(k=>microValues(microScope,k)).map(v=>normalizeDigits(v).replace(/[\s-]/g,'')).filter(v=>{
          if(!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(v)||/^0+$/.test(v))return false;
          let sum=0;for(let i=v.length-2,n=0;i>=0;i--,n++)sum+=Number(v[i])*(n%2===0?3:1);
          return (10-sum%10)%10===Number(v.at(-1));
        }):[];
        const microGtin=new Set(validMicroGtins.map(v=>v.padStart(14,'0'))).size===1?validMicroGtins[0]:undefined;
        let pageChars=0, visitedTextNodes=0;
        if(document.body){
          const textWalker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
          while(visitedTextNodes<MAX_TEXT_NODES && pageChars<LIMITS.pageText){
            const node=textWalker.nextNode();
            if(!node) break;
            visitedTextNodes++;
            const parent=node.parentElement;
            if(!parent || excluded(parent)||parent.closest('script,style,noscript,textarea,input,select,option,[contenteditable="true"],[hidden],[aria-hidden="true"]')) continue;
            const value=(node.nodeValue||'').replace(/\s+/g,' ').trim();
            if(!value) continue;
            const clipped=value.slice(0,Math.min(1500,LIMITS.pageText-pageChars));
            pagePieces.push(clipped);
            if(skuRoot?.contains(parent) && !parent.closest('a[href],[class*="review"],[class*="recommend"],[class*="related"],[class*="product-card"],[class*="product_card"],[class*="product-item"],[class*="product_item"],li[class*="product"]')) skuPieces.push(clipped);
            if(skuRoot?.contains(parent)&&mpnRows.size<12&&/(?:manufacturer|mpn|fabricante|herstellercode|produttore|fabricant)/i.test(value)&&
              !parent.closest('blockquote,q,a[href],[class*="review"],[class*="recommend"],[class*="related"],[class*="product-card"],[class*="product_card"],[class*="product-item"],[class*="product_item"]')){
              const row=parent.closest('tr,p,li')??parent;
              if(row&&!mpnRows.has(row)){
                mpnRows.add(row);
                // Read only a narrow static product row, never borrow from another row or form field.
                if(publicMpnRow(row)){
                  const label=publicText(row,300).replace(/\s+/g,' ').trim();
                  for(const hit of label.matchAll(mpnPattern))if(!/^(?:unknown|none|null|n\/a)$/i.test(hit[1]!))visibleMpns.add(hit[1]!);
                }
              }
            }
            if(skuRoot?.contains(parent)&&brandRows.size<12&&!parent.closest('[class*="review"],[class*="recommend"],[class*="related"],[class*="product-card"],[class*="product_card"],[class*="product-item"],[class*="product_item"]')&&
              /(?:brand|marca|marke|marque|merk|μάρκα|ブランド|品牌|ब्रांड|ব্র্যান্ড|العلامة التجارية)\s*:/iu.test(value)){
              const row=parent.closest('tr,p,li');
              if(row&&!brandRows.has(row)){brandRows.add(row);const label=publicText(row,300).replace(/\s+/g,' ').trim();
                const hit=label.match(/(?:brand|marca|marke|marque|merk|μάρκα|ブランド|品牌|ब्रांड|ব্র্যান্ড|العلامة التجارية)\s*:\s*([\p{L}\p{N}][\p{L}\p{N} .&'’-]{0,58}?)(?=\s+[\p{L}]{2,20}\s*:|$|[,;|])/iu)?.[1]?.trim();
                if(hit&&!/^(?:unknown|none|n\/a)$/i.test(hit))visibleBrands.add(hit);
              }
            }
            pageChars+=clipped.length+1;
          }
        }
        const pageText=pagePieces.join(' ').slice(0,LIMITS.pageText);
        const labeledSkus=[...skuPieces.join(' ').matchAll(/(?:^|\s)SKU\s*:\s*([A-Za-z0-9][A-Za-z0-9._\/-]{0,79})(?=$|\s)/gi)].map(m=>m[1]!);
        const uniqueSkus=[...new Set(labeledSkus)];
        const visibleSku=uniqueSkus.length===1 && !/^(?:n\/a|none|unknown|null)$/i.test(uniqueSkus[0]!) ? uniqueSkus[0] : undefined;
        const shippingPattern=/(?:shipping|delivery)[^.;!?。！？]{0,120}\d+[\s-]*(?:-|to|–|से|থেকে|إلى|à|a|至)[\s-]*\d+[^.;!?。！？]{0,35}(?:business\s+)?days/i;
        const shippingMatch=pagePieces.find(piece=>shippingPattern.test(matching(piece)));
        const shippingText=shippingMatch?.slice(0,220);

        const classifyLink=(a:HTMLAnchorElement):'about'|'shipping'|'returns'|'contact'|undefined=>{
          let path=a.pathname.slice(0,500);try{path=decodeURIComponent(path);}catch{}
          const haystack=matching(path+' '+(a.innerText||a.textContent||'').slice(0,250)).toLowerCase();
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
          if(!a?.href||excluded(a)) continue;
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
        const publicReviewNode=(node:Element):boolean=>{
          let cursor:Element|null=node,depth=0;
          while(cursor&&depth++<32){
            if(excluded(cursor)||cursor.matches('form,input,textarea,select,option,[contenteditable],dialog:not([open]),[hidden],[aria-hidden="true"],script,style,noscript'))return false;
            if(/display\s*:\s*none|visibility\s*:\s*(?:hidden|collapse)/i.test(cursor.getAttribute('style')??''))return false;
            if(typeof getComputedStyle==='function'){const style=getComputedStyle(cursor);if(style.display==='none'||style.visibility==='hidden'||style.visibility==='collapse')return false;}
            cursor=cursor.parentElement;
          }
          return !cursor;
        };
        const currentJudgeReview=(element:Element):boolean=>{
          if(!element.matches('.jdgm-rev')||!element.closest('.jdgm-review-widget')||element.closest('.jdgm-all-reviews-widget,.jdgm-carousel-wrapper,.jdgm-revs-tab'))return false;
          const declared=element.getAttribute('data-product-url');if(!declared||declared.length>2048)return false;
          try{
            const u=new URL(declared,location.href),here=new URL(location.href);
            if(u.origin!==here.origin||u.pathname!==here.pathname||u.username||u.password)return false;
            // Parent product reviews can be displayed on a selected variant,
            // but an explicitly different variant is never borrowed.
            for(const key of ['variant','sku','color','colour','size'])if(u.searchParams.has(key)&&u.searchParams.get(key)!==here.searchParams.get(key))return false;
          }catch{return false;}
          return publicReviewNode(element);
        };
        const seenJudgeIds=new Set<string>();
        const priceElements:HTMLElement[]=[];
        if(document.body){
          const elementWalker=document.createTreeWalker(document.body,NodeFilter.SHOW_ELEMENT);
          let visitedElements=0;
          const cardSelector=cardSelectors.join(',');
          while(visitedElements<MAX_ELEMENTS){
            const element=elementWalker.nextNode();
            if(!element) break;
            visitedElements++;
            if(!(element instanceof HTMLElement)||excluded(element)) continue;
            if(priceElements.length<4&&element.matches('[itemprop="price"],.product-price,[data-product-price]')&&element.closest('main')) priceElements.push(element);
            if(cards.length<LIMITS.cards && element.matches(cardSelector)) cards.push(element);
            if(amazonElements.length<LIMITS.amazonCards && element.matches('[data-component-type="s-search-result"][data-asin], [data-asin].s-result-item')) amazonElements.push(element);
            if(reviewElements.length<LIMITS.reviews && element.matches('[data-hook="review"]')) reviewElements.push(element);
            if(reviewElements.length<LIMITS.reviews && currentJudgeReview(element)){
              const id=element.getAttribute('data-review-id');
              if(id&&id.length<=160&&!seenJudgeIds.has(id)){seenJudgeIds.add(id);reviewElements.push(element);}
            }
          }
        }
        const saleCards=cards.filter(card=>
          Boolean(card.querySelector('del,s,[class*="compare"],[class*="was-price"],[class*="sale-price"]'))
          || /\b(?:sale|save\s+\d+%|\d+%\s+off)\b/i.test(matching((card.innerText||'').slice(0,1500)))
        );
        const catalog={cardCount:cards.length,saleCardCount:saleCards.length};

        const amazonSearchCards:AmazonSearchCard[]=amazonElements
          .map(card=>{
            const asin=(card.dataset.asin || '').trim().toUpperCase();
            const title=(card.querySelector<HTMLElement>('h2, [data-cy="title-recipe"] h2')?.innerText || '').replace(/\s+/g,' ').trim().slice(0,500);
            const image=card.querySelector<HTMLImageElement>('img.s-image, img[data-image-latency]');
            const priceText=card.querySelector<HTMLElement>('.a-price .a-offscreen')?.innerText || '';
            const price=visibleNumber(priceText);
            return {
              asin,
              title,
              imageUrl:(image?.currentSrc || image?.src)?.slice(0,2048),
              price,
            };
          })
          .filter(card=>/^[A-Z0-9]{10}$/.test(card.asin) && Boolean(card.title));

        const currentPrices=priceElements;
        const currencyMeta=meta('meta[property="product:price:currency"]')||document.querySelector('[itemprop="priceCurrency"]')?.getAttribute('content')||first(offer?.priceCurrency);
        const explicitCurrency=currencyMeta&&/^[A-Z]{3}$/.test(currencyMeta)?currencyMeta:undefined;
        const priceNode=currentPrices.length===1?currentPrices[0]:undefined;
        const priceContent=priceNode?.getAttribute('content');
        const visiblePrice=priceNode?priceContent&&/^\d+(?:\.\d+)?$/.test(priceContent)?Number(priceContent):visibleNumber(priceNode.textContent??''):undefined;
        const boundVisiblePrice=explicitCurrency&&(product||products.length===0)&&currentPrices.length===1?visiblePrice:undefined;
        const reviews:ReviewSnapshot[]=reviewElements
          .map((review,index)=>{
            if(review.matches('.jdgm-rev')){
              const text=(selector:string,limit=4000):string=>{
                const element=review.querySelector(selector);if(!element||!publicReviewNode(element))return '';
                const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);let value='';
                for(let i=0;i<160&&value.length<limit;i++){const node=walker.nextNode();if(!node)break;if(node.parentElement&&publicReviewNode(node.parentElement))value+=(node.nodeValue??'').slice(0,limit-value.length);}
                return value.replace(/\s+/g,' ').trim();
              };
              const scoreNode=review.querySelector('.jdgm-rev__rating'),score=scoreNode&&publicReviewNode(scoreNode)?scoreNode.getAttribute('data-score'):null;
              const rating=score&&/^[1-5](?:\.\d{1,2})?$/.test(score)?Number(score):undefined;
              const verification=review.getAttribute('data-verified-buyer');
              const dateNode=review.querySelector('.jdgm-rev__timestamp'),date=dateNode&&publicReviewNode(dateNode)?dateNode.getAttribute('data-content'):undefined;
              return {id:review.getAttribute('data-review-id')!,platform:'judgeme',rating:rating!==undefined&&rating<=5?rating:undefined,
                title:text('.jdgm-rev__title',500)||undefined,body:text('.jdgm-rev__body'),date:date?.slice(0,80)||undefined,
                verified:verification==='true'?true:verification==='false'?false:undefined};
            }
            const text=(selector:string)=>(review.querySelector<HTMLElement>(selector)?.innerText || '').replace(/\s+/g,' ').trim().slice(0,4000);
            const ratingText=text('[data-hook="review-star-rating"], [data-hook="cmps-review-star-rating"]');
            const ratingMatch=normalizeDigits(ratingText).match(/([1-5](?:[.,٫]\d)?)/);
            return {
              id:review.id || `visible-review-${index}`,
              platform:'amazon',
              rating:ratingMatch ? Number(ratingMatch[1]!.replace(/[،,٫]/g,'.')) : undefined,
              title:text('[data-hook="review-title"]'),
              body:text('[data-hook="review-body"], [data-hook="reviewText"], [data-hook="reviewRichContentContainer"]'),
              date:text('[data-hook="review-date"]') || undefined,
              verified:Boolean(review.querySelector('[data-hook="avp-badge"]')),
              helpfulCount:Number((normalizeDigits(text('[data-hook="helpful-vote-statement"]')).match(/\d+/)?.[0])) || undefined,
              reviewerName:text('.a-profile-name') || undefined,
            };
          })
          .filter(review=>review.body);

        return {
          product:{
            url:location.href,
            domain:location.hostname,
            canonicalUrl:canonical,
            title:(translatedPage?visibleTitle:undefined)||first(product?.name) || visibleTitle || meta('meta[property="og:title"]') || document.title?.trim() || undefined,
            description:first(product?.description) || meta('meta[property="og:description"]') || meta('meta[name="description"]'),
            price:offer && ((typeof offer.price==='number' && Number.isFinite(offer.price) && offer.price>=0) || (typeof offer.price==='string' && /^\d+(?:\.\d+)?$/.test(offer.price.trim())))?Number(offer.price):boundVisiblePrice,
            currency:first(offer?.priceCurrency)||explicitCurrency,
            brand:structuredBrand||microBrand||(visibleBrands.size===1?[...visibleBrands][0]:undefined),
            seller:first(seller?.name ?? offer?.seller ?? product?.seller) || amazonSeller,
            sku:first(product?.sku) || visibleSku,
            asin:amazonAsin,
            mpn:first(product?.mpn)||microMpn||(visibleMpns.size===1?[...visibleMpns][0]:undefined),
            gtin:first(product?.gtin ?? product?.gtin13 ?? product?.gtin12 ?? product?.gtin14 ?? product?.gtin8)||microGtin,
            imageUrls:[...new Set(structuredImages.length?structuredImages:[meta('meta[property="og:image"]')].filter((v):v is string=>Boolean(v)))].slice(0,30),
            jsonLdProductCount:jsonNodes.filter(node=>{
              const t=node['@type'];
              return t==='Product' || (Array.isArray(t) && t.includes('Product'));
            }).length,
            capturedAt:new Date().toISOString(),
            shippingText,
            merchantIdentity:[...new Set([
              (publicNode('meta[property="og:site_name"]') as HTMLMetaElement|null)?.content?.trim().slice(0,300),
              /[|｜]|\s[-–—]\s/.test(document.title)?document.title.split(/[|｜]|\s[-–—]\s/).at(-1)?.trim().slice(0,300):undefined,
            ].filter((v):v is string=>Boolean(v)))].slice(0,4),
            claims:[],
            specifications,
            variantId:typeof product?.sku==='string'?product.sku.slice(0,200):undefined,
            extraction:{method:(product?(selectedByControls?'current ProductGroup selected controls':'current-product JSON-LD'):'page metadata; structured identity unresolved')+(!first(product?.sku)&&visibleSku?'; explicit visible SKU':'')+((!structuredBrand&&microBrand)||(!first(product?.mpn)&&microMpn)||(!first(product?.gtin??product?.gtin13??product?.gtin12??product?.gtin14??product?.gtin8)&&microGtin)?'; current-product Microdata identifiers':''),structuredIdentityResolved:Boolean(product),offerResolved:Boolean(offer),...(translatedPage&&typeof product?.name==='string'?{originalStructuredTitle:product.name.slice(0,500)}:{})},
            pageSignals:[
              ...(('Shopify' in window || [...scriptUrls,...linkUrls].some(url=>fromHost(url,'cdn.shopify.com')))
                ? ['platform:shopify'] : []),
              ...((document.body?.classList.contains('woocommerce') || scriptUrls.some(url=>/wc-(?:cart|checkout|add-to-cart)/i.test(url.pathname)))
                ? ['platform:woocommerce'] : []),
              ...((scriptUrls.some(url=>fromHost(url,'bigcommerce.com')) || document.querySelector('[data-content-region]'))
                ? ['platform:bigcommerce'] : []),
              ...((scriptUrls.some(url=>/requirejs|\/static\/version/.test(url.pathname)) || 'mage' in window)
                ? ['platform:magento'] : []),
              ...((scriptUrls.some(url=>fromHost(url,'myshopline.com')||fromHost(url,'shoplineapp.com'))
                || [...imageUrls,...linkUrls].some(url=>fromHost(url,'myshopline.com'))
                || document.querySelector('meta[content*="SHOPLINE"]'))
                ? ['platform:shopline'] : []),
              ...(document.querySelector('#looxReviews, .loox-rating') || scriptUrls.some(url=>fromResource(url,'loox.io','/widget/loox.js'))
                ? ['review-platform:loox'] : []),
              ...(document.querySelector('#judgeme_product_reviews, .jdgm-widget, .jdgm-review-widget, .jdgm-preview-badge')
                ? ['review-platform:judgeme'] : []),
              ...(scriptUrls.some(url=>fromResource(url,'track123.com','/track123-widget.min.js') || fromResource(url,'shp.track123.com','/tracking-page/build/widget.min.js'))
                || document.querySelector('#track123-tracking-widget, track123-tracking-widget')
                ? ['tracking-platform:track123'] : []),
              ...(scriptUrls.some(url=>fromResource(url,'parcelpanel.com','/assets/tracking/track-page.js') || fromResource(url,'shopify-edd.parcelpanel.com','/loader.js'))
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
            scope:'product',
            subjectId:first(product?.gtin ?? product?.gtin13 ?? product?.mpn ?? product?.sku) || currentUrl,
          } : undefined,
          scriptSources,
          htmlSignature:(()=>{
            const parts:string[]=[];
            const head=document.head;
            if(head) for(let i=0;i<Math.min(head.children.length,100);i++){
              const item=head.children.item(i);
              // Stack fingerprints do not need arbitrary inline script bodies
              // or attributes, which can contain customer/session information.
              if(!item||excluded(item)) continue;
              if(item.tagName==='META'&&/^(?:generator|application-name)$/i.test(item.getAttribute('name')||''))parts.push('meta '+(item.getAttribute('name')||'')+' '+(item.getAttribute('content')||'').slice(0,500));
              if(item.tagName==='SCRIPT'&&item.getAttribute('src'))parts.push('script '+(item.getAttribute('src')||'').split(/[?#]/)[0]!.slice(0,500));
            }
            return parts.join(' ').slice(0,LIMITS.htmlSignature)+' '+(document.body?.className || '').slice(0,500);
          })(),
          amazonSearchCards,
        };
      
}
