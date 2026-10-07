import { imageSearchUrls, merchantSearchUrls, productSearchUrls } from '../src/deep-hunt/search-urls';

const ROOT='dropshredder-root';
let lastActiveWebTabId:number|undefined;

function rememberWebTab(tab:chrome.tabs.Tab|undefined):void{
  if(tab?.id && /^https?:\/\//i.test(tab.url ?? '')) lastActiveWebTabId=tab.id;
}

async function refreshActiveWebTab(windowId?:number):Promise<void>{
  const tabs=await chrome.tabs.query(windowId===undefined?{active:true}:{active:true,windowId});
  rememberWebTab(tabs.find(tab=>/^https?:\/\//i.test(tab.url ?? '')));
}

function createMenus():void {
  chrome.contextMenus.removeAll(()=>{
    chrome.contextMenus.create({id:ROOT,title:'DropShredder',contexts:['page','selection','image']});
    chrome.contextMenus.create({id:'ds-hunt-product',parentId:ROOT,title:'Hunt this product',contexts:['page','selection']});
    chrome.contextMenus.create({id:'ds-hunt-image',parentId:ROOT,title:'Hunt this image',contexts:['image']});
    chrome.contextMenus.create({id:'ds-hunt-store',parentId:ROOT,title:'Hunt this store',contexts:['page']});
  });
}

async function openMany(urls:Record<string,string>,maxTabs=8):Promise<void> {
  const unique=[...new Set(Object.values(urls))].slice(0,maxTabs);
  for(const url of unique) {
    await chrome.tabs.create({url,active:false});
  }
}

export default defineBackground(() => {
  if(chrome.storage?.local?.setAccessLevel){
    void chrome.storage.local.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'});
  }

  if (chrome.sidePanel?.setPanelBehavior) {
    void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }

  void refreshActiveWebTab();
  chrome.tabs.onActivated.addListener(info=>void chrome.tabs.get(info.tabId).then(rememberWebTab).catch(()=>{}));
  chrome.tabs.onUpdated.addListener((_tabId,change,tab)=>{if(change.status==='complete'||change.url) rememberWebTab(tab);});
  chrome.windows.onFocusChanged.addListener(windowId=>{if(windowId!==chrome.windows.WINDOW_ID_NONE) void refreshActiveWebTab(windowId);});
  chrome.runtime.onMessage.addListener((message,_sender,sendResponse)=>{
    if(message?.type!=='dropshredder:get-active-web-tab') return;
    void (async()=>{
      if(lastActiveWebTabId){
        try{
          const tab=await chrome.tabs.get(lastActiveWebTabId);
          if(/^https?:\/\//i.test(tab.url ?? '')){sendResponse({tabId:tab.id,url:tab.url});return;}
        }catch{}
      }
      await refreshActiveWebTab();
      sendResponse({tabId:lastActiveWebTabId});
    })();
    return true;
  });

  chrome.runtime.onInstalled.addListener(createMenus);
  chrome.runtime.onStartup.addListener(createMenus);

  chrome.contextMenus.onClicked.addListener((info,tab)=>{
    const pageUrl=tab?.url || info.pageUrl || '';
    let domain='';
    try { domain=new URL(pageUrl).hostname; } catch {}

    if(info.menuItemId==='ds-hunt-image'){
      void openMany(imageSearchUrls(info.srcUrl));
      return;
    }

    if(info.menuItemId==='ds-hunt-store' && domain){
      void openMany(merchantSearchUrls(domain));
      return;
    }

    if(info.menuItemId==='ds-hunt-product'){
      const title=info.selectionText || tab?.title || '';
      if(title) void openMany(productSearchUrls(title));
    }
  });
});
