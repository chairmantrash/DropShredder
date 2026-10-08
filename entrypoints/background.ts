import { imageSearchUrls, merchantSearchUrls, productSearchUrls } from '../src/deep-hunt/search-urls';
import { AUTO_PANEL_INTENT, AUTO_PATTERN, setAutoContentRegistration } from '../src/runtime/auto-registration';

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

  // Registrations live outside the disposable MV3 service-worker process.
  // Reconcile permissions/settings after install and browser startup.
  const syncAuto=async():Promise<void>=>{
    const stored=await chrome.storage.local.get('dropshredder-feature-settings-v1');
    const enabled=Boolean(stored['dropshredder-feature-settings-v1']?.autoProtection);
    const authorized=enabled && await chrome.permissions.contains({origins:[AUTO_PATTERN]});
    await setAutoContentRegistration(authorized);
  };
  void syncAuto().catch(()=>{});
  chrome.runtime.onStartup.addListener(()=>{void syncAuto().catch(()=>{});});
  chrome.runtime.onInstalled.addListener(()=>{void syncAuto().catch(()=>{});});
  chrome.permissions.onRemoved.addListener(()=>{void syncAuto().catch(()=>{});});

  chrome.runtime.onMessage.addListener((message:unknown,sender,sendResponse)=>{
    if(!message || typeof message!=='object') return;
    const record=message as Record<string,unknown>;
    if(record.version!==1) return;
    if(record.type==='DS_AUTO_STATUS'){
      if(!sender.tab?.id || sender.frameId!==0 || !sender.url?.startsWith('https://')) return;
      void (async()=>{
        const stored=await chrome.storage.local.get('dropshredder-feature-settings-v1');
        const enabled=Boolean(stored['dropshredder-feature-settings-v1']?.autoProtection)
          && await chrome.permissions.contains({origins:[AUTO_PATTERN]});
        sendResponse({enabled});
      })().catch(()=>sendResponse({enabled:false}));
      return true;
    }
    if(record.type==='DS_AUTO_OPEN'){
      if(!sender.tab?.id || sender.frameId!==0 || !sender.documentId || !sender.url?.startsWith('https://')) return;
      const url=new URL(sender.url);
      if(!url.hostname) return;
      const intent={tabId:sender.tab.id,documentId:sender.documentId,createdAt:Date.now()};
      // Preserve the click activation: sidePanel.open is called without an await.
      void chrome.storage.session.set({[AUTO_PANEL_INTENT]:intent}).catch(()=>{});
      void chrome.sidePanel.open({tabId:sender.tab.id}).catch(()=>{});
    }
  });

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
