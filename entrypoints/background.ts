import { imageSearchUrls, merchantSearchUrls, productSearchUrls } from '../src/deep-hunt/search-urls';

const ROOT='dropshredder-root';
function createMenus():void {
  chrome.contextMenus.removeAll(()=>{
    chrome.contextMenus.create({id:ROOT,title:'DropShredder',contexts:['page','selection','image'],documentUrlPatterns:['http://*/*','https://*/*']});
    chrome.contextMenus.create({id:'ds-hunt-product',parentId:ROOT,title:'Hunt this product',contexts:['page','selection'],documentUrlPatterns:['http://*/*','https://*/*']});
    chrome.contextMenus.create({id:'ds-hunt-image',parentId:ROOT,title:'Hunt this image',contexts:['image'],documentUrlPatterns:['http://*/*','https://*/*']});
    chrome.contextMenus.create({id:'ds-hunt-store',parentId:ROOT,title:'Hunt this store',contexts:['page'],documentUrlPatterns:['http://*/*','https://*/*']});
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
