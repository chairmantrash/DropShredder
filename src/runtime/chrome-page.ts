export interface AuthorizedChromePage {
  tab:chrome.tabs.Tab;
  tabId:number;
  url:string;
  documentId:string;
  selectionStamp?:string;
}
/** Read only product-selection fields, never form credentials or arbitrary inputs. */
export function chromeProductSelectionStamp():string{
  const values:string[]=[document.querySelector('main h1')?.textContent?.slice(0,500)??''];
  for(const control of [...document.querySelectorAll<HTMLSelectElement|HTMLInputElement>('main select[name], main input[type="radio"][name]:checked')].slice(0,40)){
    if(/^(?:options\[)?(?:color|colour|size|capacity|material|variant|sku)\]?$/i.test(control.name)) values.push(`${control.name}:${control.value.slice(0,200)}`);
  }
  // Detect seller updates to structured identity even when the URL stays fixed.
  let bytes=0,hash=2166136261;
  for(const script of [...document.querySelectorAll('script[type="application/ld+json"]')].slice(0,40)){
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
    const [selection]=await chrome.scripting.executeScript({target:{tabId:tab.id,documentIds:[probe.documentId]},world:'ISOLATED',func:chromeProductSelectionStamp});
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
      func:()=>({
        url:location.href,
        sensitive:Boolean(document.querySelector([
          'input[type="password"]',
          'input[autocomplete="cc-number"]',
          'input[autocomplete="cc-csc"]',
          'input[autocomplete="current-password"]',
          'input[autocomplete="new-password"]',
          'form[action*="checkout" i]',
          'form[action*="payment" i]',
        ].join(','))),
      }),
    });
    if(probe?.documentId!==page.documentId||probe?.result?.url!==page.url||probe?.result?.sensitive) return false;
    const [selection]=await chrome.scripting.executeScript({target:documentTarget(page),world:'ISOLATED',func:chromeProductSelectionStamp});
    return selection?.documentId===page.documentId && selection?.result===page.selectionStamp && probe?.documentId===page.documentId
      && probe?.result?.url===page.url
      && !probe?.result?.sensitive;
  }catch{
    return false;
  }
}
