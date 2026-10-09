import type { ToneMode } from '../ui/tone';

export interface DropShredderFeatureSettings {
  autoSourceHunt:boolean;
  autoProtection:boolean;
  preferMadeInUSA:boolean;
  toneMode:ToneMode;
}

export const DEFAULT_FEATURE_SETTINGS:DropShredderFeatureSettings={
  autoSourceHunt:false,
  autoProtection:false,
  preferMadeInUSA:false,
  toneMode:'professional',
};

const KEY='dropshredder-feature-settings-v1';

export function normalizeFeatureSettings(value:unknown):DropShredderFeatureSettings{
  const raw=value && typeof value==='object' && !Array.isArray(value)?value as Record<string,unknown>:{};
  return {
    autoSourceHunt:raw.autoSourceHunt===true,
    autoProtection:raw.autoProtection===true,
    preferMadeInUSA:raw.preferMadeInUSA===true,
    toneMode:raw.toneMode==='aggressive'||raw.toneMode==='nuclear'?raw.toneMode:'professional',
  };
}

export function validFeaturePatch(value:unknown):value is Partial<DropShredderFeatureSettings>{
  if(!value || typeof value!=='object' || Array.isArray(value)) return false;
  return Object.entries(value).every(([key,v])=>
    key==='toneMode'?['professional','aggressive','nuclear'].includes(v as string):
      ['autoSourceHunt','autoProtection','preferMadeInUSA'].includes(key) && typeof v==='boolean');
}

export async function loadFeatureSettings():Promise<DropShredderFeatureSettings>{
  const value=await chrome.storage.local.get(KEY);
  return normalizeFeatureSettings(value[KEY]);
}

let patchQueue:Promise<unknown>=Promise.resolve();
/** Only the background worker calls this: one writer serializes patches across panels. */
export function applyFeaturePatch(patch:unknown):Promise<DropShredderFeatureSettings>{
  if(!validFeaturePatch(patch)) return Promise.reject(new Error('Invalid feature settings.'));
  const copy={...patch};
  const task=patchQueue.then(async()=>{
    const settings=normalizeFeatureSettings({...await loadFeatureSettings(),...copy});
    await chrome.storage.local.set({[KEY]:settings});
    return settings;
  });
  patchQueue=task.catch(()=>{});
  return task;
}

export async function updateFeatureSettings(patch:Partial<DropShredderFeatureSettings>):Promise<DropShredderFeatureSettings>{
  if(!validFeaturePatch(patch)) throw new Error('Invalid feature settings.');
  const response=await chrome.runtime.sendMessage({type:'DS_FEATURE_PATCH',version:1,patch});
  if(response?.ok!==true) throw new Error('Could not save feature settings.');
  return normalizeFeatureSettings(response.settings);
}
