import { tr } from '../src/i18n/index';
import { applyFeaturePatch, loadFeatureSettings } from '../src/settings/features';
import { imageSearchUrls, merchantSearchUrls, productSearchUrls } from '../src/deep-hunt/search-urls';
import { AUTO_PANEL_INTENT, AUTO_PATTERN, setAutoContentRegistration } from '../src/runtime/auto-registration';
import { applyListMutation } from '../src/intelligence/user-lists';
import { pageSafety } from '../src/security/page-safety';
import { checkDueSignedFeeds, ensureIntelligenceAlarm, INTELLIGENCE_ALARM } from '../src/intelligence/auto-refresh';

const ROOT='dropshredder-root';
function createMenus():void {
  chrome.contextMenus.removeAll(()=>{
    chrome.contextMenus.create({id:ROOT,title:tr('DropShredder'),contexts:['page','selection','image'],documentUrlPatterns:['http://*/*','https://*/*']});
    chrome.contextMenus.create({id:'ds-hunt-product',parentId:ROOT,title:tr('Hunt this product'),contexts:['page','selection'],documentUrlPatterns:['http://*/*','https://*/*']});
    chrome.contextMenus.create({id:'ds-hunt-image',parentId:ROOT,title:tr('Hunt this image'),contexts:['image'],documentUrlPatterns:['http://*/*','https://*/*']});
    chrome.contextMenus.create({id:'ds-hunt-store',parentId:ROOT,title:tr('Hunt this store'),contexts:['page'],documentUrlPatterns:['http://*/*','https://*/*']});
  });
}

async function openMany(urls:Record<string,string>,maxTabs=8):Promise<void> {
  const key=`ds-search-${crypto.randomUUID()}`;
  await chrome.storage.session.set({[key]:urls});
  await chrome.tabs.create({url:chrome.runtime.getURL(`search.html#${key}`),active:true});
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
    const enabled=(await loadFeatureSettings()).autoProtection;
    const authorized=enabled && await chrome.permissions.contains({origins:[AUTO_PATTERN]});
    await setAutoContentRegistration(authorized);
  };
  void syncAuto().catch(()=>{});
  void ensureIntelligenceAlarm().catch(()=>{});
  chrome.alarms.onAlarm.addListener(alarm=>{
    if(alarm.name===INTELLIGENCE_ALARM) void checkDueSignedFeeds().catch(()=>{});
  });
  chrome.runtime.onStartup.addListener(()=>{void syncAuto().catch(()=>{});void ensureIntelligenceAlarm().catch(()=>{});});
  chrome.runtime.onInstalled.addListener(()=>{void syncAuto().catch(()=>{});void ensureIntelligenceAlarm().catch(()=>{});});
  chrome.permissions.onRemoved.addListener(()=>{void syncAuto().catch(()=>{});});

  chrome.runtime.onMessage.addListener((message:unknown,sender,sendResponse)=>{
    if(!message || typeof message!=='object') return;
    const record=message as Record<string,unknown>;
    if(record.version!==1) return;
    if(record.type==='DS_LIST_MUTATION'){
      if(sender.id!==chrome.runtime.id || sender.tab || !sender.url?.startsWith(chrome.runtime.getURL(''))) return;
      void applyListMutation(record.action).then(store=>sendResponse({ok:true,store})).catch(error=>sendResponse({ok:false,error:error instanceof Error?error.message:tr('Local list update failed.')}));
      return true;
    }
    if(record.type==='DS_FEATURE_PATCH'){
      if(sender.id!==chrome.runtime.id || sender.tab || !sender.url?.startsWith(chrome.runtime.getURL(''))) return;
      void applyFeaturePatch(record.patch).then(async settings=>{await ensureIntelligenceAlarm();sendResponse({ok:true,settings});}).catch(()=>sendResponse({ok:false}));
      return true;
    }
    if(record.type==='DS_AUTO_STATUS'){
      if(!sender.tab?.id || sender.frameId!==0 || !sender.url?.startsWith('https://')) return;
      void (async()=>{
        const enabled=(await loadFeatureSettings()).autoProtection
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
      const stored=chrome.storage.session.set({[AUTO_PANEL_INTENT]:intent});
      // If the side panel is already open, it will not reload. Notify it after
      // storing the intent; a newly opened panel also consumes the saved intent.
      void stored.then(()=>chrome.runtime.sendMessage({
        type:'DS_AUTO_PANEL_READY',version:1,
      }).catch(()=>{})).catch(()=>{});
      // Open synchronously while Chrome still recognizes the content-script click.
      const opening=chrome.sidePanel.open({tabId:sender.tab.id});
      void opening.then(()=>sendResponse({ok:true})).catch(()=>sendResponse({ok:false}));
      return true;
    }
  });

  chrome.contextMenus.onClicked.addListener((info,tab)=>{
    const pageUrl=tab?.url || info.pageUrl || '';
    if(!pageSafety(pageUrl).allowed) return;
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
