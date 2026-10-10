export const AUTO_CONTENT_ID='dropshredder-auto-shopping-v1';
export const AUTO_CONTENT_PATH='content-scripts/auto.js';
export const AUTO_PANEL_INTENT='dropshredder-auto-panel-intent-v1';
export const AUTO_PATTERN='https://*/*';

/**
 * Multiple native panels and the service worker can reconcile registration at
 * the same time (especially on permissions.onRemoved). Chrome's list + mutation
 * are not atomic; treat a racing duplicate/missing-ID error as success only
 * when a fresh query proves the requested registration state.
 */
export async function setAutoContentRegistration(enabled:boolean):Promise<void>{
  const query=()=>chrome.scripting.getRegisteredContentScripts({ids:[AUTO_CONTENT_ID]});
  const existing=await query();
  if(!enabled){
    if(!existing.length) return;
    try{await chrome.scripting.unregisterContentScripts({ids:[AUTO_CONTENT_ID]});}
    catch(error){if((await query()).length) throw error;}
    return;
  }
  if(existing.length) return;
  try{
    await chrome.scripting.registerContentScripts([{
      id:AUTO_CONTENT_ID,
      matches:[AUTO_PATTERN],
      js:[AUTO_CONTENT_PATH],
      runAt:'document_idle',
      allFrames:false,
      persistAcrossSessions:true,
      world:'ISOLATED',
    }]);
  }catch(error){if(!(await query()).length) throw error;}
}
