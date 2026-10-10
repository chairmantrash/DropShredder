import { tr, uiDirection } from '../i18n/index';
/**
 * Informational, user-activated result-page labels. No scores, hidden requests,
 * DOM-wide observers, affiliate redirects or ownership inference.
 */
type Venue='amazon'|'etsy'|'walmart';
export function marketplaceResultsKind(href:string):Venue|undefined{
  try{
    const u=new URL(href),host=u.hostname.toLowerCase(),p=u.pathname.toLowerCase();
    if(u.protocol!=='https:'||u.username||u.password) return undefined;
    if(/^(?:www\.)?amazon\.(?:com|ca|de|fr|it|es|in|co\.uk|co\.jp|com\.au)$/.test(host)
      && (/^\/s(?:\/|$)/.test(p)||p==='/gp/search')) return 'amazon';
    if(/^(?:www\.)?etsy\.com$/.test(host)&&(/^\/search(?:\/|$)/.test(p)||/^\/market(?:\/|$)/.test(p))) return 'etsy';
    if(/^(?:www\.)?walmart\.com$/.test(host)&&/^\/search(?:\/|$)/.test(p)) return 'walmart';
  }catch{}
  return undefined;
}

function resultPath(path:string,venue:Venue):boolean{
  if(venue==='amazon') return /^\/(?:[^/]+\/)?(?:dp|gp\/product)\/[A-Z0-9]{10}(?:\/|$)/i.test(path);
  if(venue==='etsy') return /^\/listing\/\d{6,15}(?:\/|$)/i.test(path);
  return /^\/ip\/(?:[^/]+\/)?\d{5,20}(?:\/|$)/i.test(path);
}
export function removeMarketplaceBadges(doc:Document):void{
  for(const item of [...doc.querySelectorAll<HTMLElement>('[data-dropshredder-result-label]')].slice(0,48)) item.remove();
}
/** Bounded rendering; labels merely navigate to the original product page. */
export function attachMarketplaceBadges(doc:Document,href:string,max=24):number{
  const venue=marketplaceResultsKind(href);
  if(!venue) return 0;
  const origin=new URL(href).origin;
  const selector=venue==='amazon'
    ?'[data-component-type="s-search-result"] a[href]'
    :venue==='etsy'?'a[href*="/listing/"]':'a[href*="/ip/"]';
  const anchors=[...doc.querySelectorAll<HTMLAnchorElement>(selector)].slice(0,180);
  let count=0;
  const stamped=new Set<string>();
  for(const link of anchors){
    if(count>=Math.max(0,Math.min(24,max))) break;
    let destination:URL;
    try {destination=new URL(link.href,href);}catch{continue;}
    if(destination.origin!==origin||!resultPath(destination.pathname,venue)) continue;
    const url=destination.origin+destination.pathname;
    if(stamped.has(url)) continue;
    // Mark only an actual single-item result link; not a global toolbar/header.
    const host=venue==='amazon'?link.closest('[data-component-type="s-search-result"]')
      :link.closest('article,li,[data-testid*="item"],[data-testid*="product"],[class*="listing-card"],[class*="product-card"]');
    if(!host || host.querySelector('[data-dropshredder-result-label]')) continue;
    const label=doc.createElement('a');
    label.setAttribute('data-dropshredder-result-label','');label.dir=uiDirection();
    label.href=url;
    label.textContent=tr('🔎 Check with DropShredder');
    label.setAttribute('aria-label',tr('Open this product listing for a DropShredder check'));
    label.setAttribute('title',tr('This listing has not been verified. Open the product for an evidence-based check.'));
    label.style.cssText='display:inline-flex;align-items:center;max-width:100%;box-sizing:border-box;'+
      'padding:4px 8px;margin:5px 0;border:1px solid #5f84aa;border-radius:7px;'+
      'background:#152335;color:#d9edff;font:600 11px/1.5 system-ui,sans-serif;'+
      'text-decoration:none;cursor:pointer;';
    host.append(label);
    stamped.add(url);count++;
  }
  return count;
}
