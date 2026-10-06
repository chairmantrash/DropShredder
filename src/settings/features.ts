export interface DropShredderFeatureSettings {
  autoSourceHunt:boolean;
  autoReputationSweep:boolean;
  preferMadeInUSA:boolean;
}

export const DEFAULT_FEATURE_SETTINGS:DropShredderFeatureSettings={
  autoSourceHunt:false,
  autoReputationSweep:false,
  preferMadeInUSA:false,
};

const KEY='dropshredder-feature-settings-v1';

export async function loadFeatureSettings():Promise<DropShredderFeatureSettings>{
  const value=await chrome.storage.local.get(KEY);
  return {...DEFAULT_FEATURE_SETTINGS,...(value[KEY] ?? {})};
}

export async function saveFeatureSettings(settings:DropShredderFeatureSettings):Promise<void>{
  await chrome.storage.local.set({[KEY]:settings});
}
