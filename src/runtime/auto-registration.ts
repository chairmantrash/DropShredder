export const AUTO_CONTENT_ID='dropshredder-auto-shopping-v1';
export const AUTO_CONTENT_PATH='content-scripts/auto.js';
export const AUTO_PANEL_INTENT='dropshredder-auto-panel-intent-v1';
export const AUTO_PATTERN='https://*/*';

export async function setAutoContentRegistration(enabled:boolean):Promise<void>{
  const existing=await chrome.scripting.getRegisteredContentScripts({ids:[AUTO_CONTENT_ID]});
  if(!enabled){
    if(existing.length) await chrome.scripting.unregisterContentScripts({ids:[AUTO_CONTENT_ID]});
    return;
  }
  if(existing.length) return;
  await chrome.scripting.registerContentScripts([{
    id:AUTO_CONTENT_ID,
    matches:[AUTO_PATTERN],
    js:[AUTO_CONTENT_PATH],
    runAt:'document_idle',
    allFrames:false,
    persistAcrossSessions:true,
    world:'ISOLATED',
  }]);
}
