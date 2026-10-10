import data from './commerce-kit-data.json';
/** Offline finite commerce vocabulary. These aliases are matching cues, never translations of source evidence. */
export interface CommerceLanguageKit {
  locales:string[];
  privateFormParts:string[];
  dynamic:Array<[string,string]>;
  phrases:Array<[string,...string[][]]>;
  paths:{product:string[];collection:string[];editorial:string[];sensitive:string[]};
  variants:Record<string,string[]>;
}
export const COMMERCE_LANGUAGE_KIT=data as unknown as CommerceLanguageKit;
