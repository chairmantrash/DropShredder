export interface DisplayPreferences {theme:'dark'|'light'|'system';density:'comfortable'|'compact';textScale:100|115|130}
export const DISPLAY_KEY='dropshredder-display-v1';
export const DEFAULT_DISPLAY:DisplayPreferences={theme:'dark',density:'comfortable',textScale:100};
export function normalizeDisplayPreferences(value:unknown):DisplayPreferences {
  const v=value&&typeof value==='object'?value as Record<string,unknown>:{};
  return {theme:v.theme==='light'||v.theme==='system'?v.theme:'dark',density:v.density==='compact'?'compact':'comfortable',
    textScale:v.textScale===115||v.textScale===130?v.textScale:100};
}
export function applyDisplayPreferences(root:HTMLElement,value:unknown):DisplayPreferences {
  const p=normalizeDisplayPreferences(value);
  root.dataset.theme=p.theme;root.dataset.density=p.density;root.dataset.textScale=String(p.textScale);
  return p;
}
