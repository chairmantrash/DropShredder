export interface AuthorizedChromePage {
  tab:chrome.tabs.Tab;
  tabId:number;
  url:string;
  documentId:string;
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
    return typeof probe?.result==='string' && probe.documentId
      ? {tab,tabId:tab.id,url:probe.result,documentId:probe.documentId}
      : undefined;
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
    return probe?.documentId===page.documentId
      && probe?.result?.url===page.url
      && !probe?.result?.sensitive;
  }catch{
    return false;
  }
}
