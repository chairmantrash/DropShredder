import { loadFeatureSettings } from '../settings/features';
import { fetchBoundedJson } from '../osint/bounded-json';
import { loadUserLists, MAX_LIST_BYTES, previewList, applyListMutation, WEEK_MS } from './user-lists';

export const INTELLIGENCE_ALARM='dropshredder-signed-feed-weekly-check-v1';
const ATTEMPTS_KEY='dropshredder-signed-feed-attempts-v1';
const DAY_MINUTES=24*60;

/** Chrome alarms wake a dormant MV3 service worker without polling page activity. */
export async function ensureIntelligenceAlarm():Promise<void>{
  const settings=await loadFeatureSettings();
  if(!settings.weeklyIntelligenceUpdates){
    await chrome.alarms.clear(INTELLIGENCE_ALARM);
    return;
  }
  if(!await chrome.alarms.get(INTELLIGENCE_ALARM)){
    await chrome.alarms.create(INTELLIGENCE_ALARM,{delayInMinutes:15,periodInMinutes:DAY_MINUTES});
  }
}
let inflight:Promise<void>|undefined;
/**
 * Only previously granted origins and a user-pinned Ed25519 issuer are eligible.
 * Each subscribed source is attempted at most once in seven days. An unsigned,
 * stale, downgraded, untrusted or same-version feed cannot silently replace a list.
 * All payload validation and writes pass through the same serialized list mutation
 * as a manual import. No newly requested permissions, credentials or page history.
 */
export function checkDueSignedFeeds(now=Date.now()):Promise<void>{
  if(inflight) return inflight;
  const task=(async()=>{
    if(!(await loadFeatureSettings()).weeklyIntelligenceUpdates) return;
    const store=await loadUserLists();
    const raw=await chrome.storage.local.get(ATTEMPTS_KEY);
    const dates=raw[ATTEMPTS_KEY]&&typeof raw[ATTEMPTS_KEY]==='object'&&!Array.isArray(raw[ATTEMPTS_KEY])
      ? raw[ATTEMPTS_KEY] as Record<string,unknown>:{};
    for(const row of store.lists.slice(0,5)){
      if(!(await loadFeatureSettings()).weeklyIntelligenceUpdates) return;
      const source=row.subscriptionUrl;
      if(!source || !store.keys.some(k=>k.sourceUrl===source)) continue;
      if(now-Date.parse(row.checkedAt)<WEEK_MS) continue;
      const last=dates[row.current.list.id];
      if(typeof last==='number'&&Number.isFinite(last)&&now-last<WEEK_MS) continue;
      const origin=new URL(source).origin+'/*';
      if(!await chrome.permissions.contains({origins:[origin]})) continue;
      dates[row.current.list.id]=now;
      // Record before fetching: errors do not create repeated background traffic.
      await chrome.storage.local.set({[ATTEMPTS_KEY]:dates});
      const controller=new AbortController();
      try{
        const body=await fetchBoundedJson(source,AbortSignal.any([controller.signal,AbortSignal.timeout(8000)]),MAX_LIST_BYTES);
        if(!await chrome.permissions.contains({origins:[origin]})) continue;
        const input=JSON.stringify(body);
        const preview=await previewList(input,(await loadUserLists()).keys,source,now);
        if(preview.authentication!=='user-pinned-key'||preview.stale||
          preview.list.id!==row.current.list.id||preview.list.version<=row.highestVersion) continue;
        if(!(await loadFeatureSettings()).weeklyIntelligenceUpdates) return;
        if(!await chrome.permissions.contains({origins:[origin]})) continue;
        await applyListMutation({type:'save',input,subscriptionUrl:source});
      }catch{
        // Network, malformed data, revoked grants and failed signatures never
        // activate a replacement; the user may manually inspect at any time.
      }finally{controller.abort();}
    }
  })();
  inflight=task.finally(()=>{inflight=undefined;});
  return inflight;
}
