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
