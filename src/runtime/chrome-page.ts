import {hasSensitiveCommerceSurface} from '../security/sensitive-surface';
import {COMMERCE_LANGUAGE_KIT} from '../languages/commerce-kit';
export interface AuthorizedChromePage {
  tab:chrome.tabs.Tab;
  tabId:number;
  url:string;
  documentId:string;
  selectionStamp?:string;
}
/** Read only product-selection fields, never form credentials or arbitrary inputs. */
export function chromeProductSelectionStamp(variantNames:string[]=[],privateFormParts:string[]=[]):string{
  const privateRegion=(element:Element):boolean=>{
    const region=element.closest('form,dialog,[role="dialog"]');if(!region)return false;
    if(region.matches('dialog,[role="dialog"]')||region.querySelector('input[type="password"],input[autocomplete~="current-password"],input[autocomplete~="new-password"],input[autocomplete~="cc-number"],input[autocomplete~="cc-csc"],input[name*="cardnumber" i]'))return true;
    try{const path=decodeURIComponent(new URL(region.getAttribute('action')||'',location.href).pathname).normalize('NFKC').toLowerCase();return /checkout|payment/i.test(path)||path.split('/').some(p=>privateFormParts.includes(p));}catch{return true;}
  };
  const heading=document.querySelector('main h1');
  const values:string[]=[heading&&!privateRegion(heading)?heading.textContent?.slice(0,500)??'':''];
  // Match the explicit-control contract in extractPageScan. A route may
  // preserve its URL while a real selected swatch/button changes SKU/price.
  const selector='main select[name],main select[data-option-name],main input[type="radio"][name]:checked,main input[type="radio"][data-option-name]:checked,main [data-option-name][aria-pressed="true"],main [data-option-name][aria-checked="true"]';
  for(const control of [...document.querySelectorAll<HTMLElement>(selector)].slice(0,40)){
    if(control.tagName==='INPUT'&&(control as HTMLInputElement).type!=='radio') continue;
    if(privateRegion(control)) continue;
    const name=control.getAttribute('data-option-name')||control.getAttribute('name')||'';
    if(!(/^(?:options\[)?(?:color|colour|size|capacity|material|variant|sku)\]?$/i.test(name)||variantNames.includes(name.normalize('NFKC').toLowerCase().replace(/^options\[/,'').replace(/\]$/,'')))
      ||control.hasAttribute('disabled')||control.getAttribute('aria-disabled')==='true') continue;
    const value=control.tagName==='INPUT' || control.tagName==='SELECT'
      ?(control as HTMLInputElement|HTMLSelectElement).value:control.getAttribute('data-option-value')||control.getAttribute('value')||control.getAttribute('aria-label')||control.textContent?.slice(0,100)||'';
    if(value && value.length<=200) values.push(`${name}:${value}`);
  }
  // Detect seller updates to structured identity even when the URL stays fixed.
  let bytes=0,hash=2166136261;
  for(const script of [...document.querySelectorAll('script[type="application/ld+json"]')].slice(0,40)){
    if(privateRegion(script)) continue;
    const text=(script.textContent??'').slice(0,60_000);bytes+=text.length;if(bytes>120_000) break;
    for(let i=0;i<text.length;i++) hash=Math.imul(hash^text.charCodeAt(i),16777619);
  }
  return JSON.stringify(values)+':'+(hash>>>0);
}

export async function activeWebTab():Promise<chrome.tabs.Tab|undefined>{
  const [tab]=await chrome.tabs.query({active:true,lastFocusedWindow:true});
  return tab?.id ? tab : undefined;
}

export async function authorizeChromePage(tab:chrome.tabs.Tab):Promise<AuthorizedChromePage|undefined>{
  if(!tab.id) return undefined;
  try{
    const [probe]=await chrome.scripting.executeScript({
      target:{tabId:tab.id},
      world:'ISOLATED',
      func:()=>location.href,
    });
    if(typeof probe?.result!=='string'||!probe.documentId) return undefined;
    const [selection]=await chrome.scripting.executeScript({target:{tabId:tab.id,documentIds:[probe.documentId]},world:'ISOLATED',func:chromeProductSelectionStamp,args:[Object.values(COMMERCE_LANGUAGE_KIT.variants).flat(),COMMERCE_LANGUAGE_KIT.privateFormParts]});
    if(typeof selection?.result!=='string'||selection.documentId!==probe.documentId) return undefined;
    return {tab,tabId:tab.id,url:probe.result,documentId:probe.documentId,selectionStamp:selection.result};
  }catch{
    if(chrome.permissions.addHostAccessRequest){
      await chrome.permissions.addHostAccessRequest({tabId:tab.id});
    }
    return undefined;
  }
}

export function documentTarget(page:AuthorizedChromePage):chrome.scripting.InjectionTarget{
  return {tabId:page.tabId,documentIds:[page.documentId]};
}

/**
 * Fail closed when the panel's target changes. documentId catches full navigations;
 * URL catches history.pushState / replaceState SPA transitions within one document.
 * This also rejects an account/checkout modal appearing on the same URL.
 */
export async function isCurrentChromePage(page:AuthorizedChromePage):Promise<boolean>{
  const tab=await activeWebTab();
  if(tab?.id!==page.tabId) return false;
  try{
    const [probe]=await chrome.scripting.executeScript({
      target:documentTarget(page),
      world:'ISOLATED',
      func:()=>({url:location.href}),
    });
    if(probe?.documentId!==page.documentId||probe?.result?.url!==page.url) return false;
    const [privateSurface]=await chrome.scripting.executeScript({target:documentTarget(page),world:'ISOLATED',func:hasSensitiveCommerceSurface,args:[COMMERCE_LANGUAGE_KIT.privateFormParts]});
    if(privateSurface?.result) return false;
    const [selection]=await chrome.scripting.executeScript({target:documentTarget(page),world:'ISOLATED',func:chromeProductSelectionStamp,args:[Object.values(COMMERCE_LANGUAGE_KIT.variants).flat(),COMMERCE_LANGUAGE_KIT.privateFormParts]});
    return selection?.documentId===page.documentId && selection?.result===page.selectionStamp && probe?.documentId===page.documentId
      && probe?.result?.url===page.url;
  }catch{
    return false;
  }
}
