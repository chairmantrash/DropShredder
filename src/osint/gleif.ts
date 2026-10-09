import { fetchBoundedJson } from './bounded-json';
export const GLEIF_ORIGIN='https://api.gleif.org/*';
/** ISO 17442 modulus-97 check. An LEI identifies a legal entity, never product quality. */
export function validLei(value:string):boolean{
  if(!/^[A-Z0-9]{18}[0-9]{2}$/.test(value)) return false;
  let remainder=0;for(const c of value){const digits=/[A-Z]/.test(c)?String(c.charCodeAt(0)-55):c;for(const digit of digits) remainder=(remainder*10+Number(digit))%97;}
  return remainder===1;
}
export interface LegalEntityObservation {lei:string;name:string;jurisdiction:string;status:string;registrationStatus:string;updatedAt?:string;sourceUrl:string;retrievedAt:string}
export function parseGleif(value:unknown,lei:string):LegalEntityObservation{
  const p=value as {data?:{id?:unknown;attributes?:{lei?:unknown;entity?:{legalName?:{name?:unknown};jurisdiction?:unknown;status?:unknown};registration?:{status?:unknown;lastUpdateDate?:unknown}}}};
  const a=p?.data?.attributes;if(p?.data?.id!==lei||a?.lei!==lei||typeof a.entity?.legalName?.name!=='string') throw new Error('Entity service did not identify the requested LEI.');
  const short=(v:unknown,max=100)=>typeof v==='string'?v.slice(0,max):'not supplied';
  const date=a.registration?.lastUpdateDate;
  return {lei,name:short(a.entity.legalName.name,250),jurisdiction:short(a.entity.jurisdiction),status:short(a.entity.status),registrationStatus:short(a.registration?.status),
    updatedAt:typeof date==='string'&&Number.isFinite(Date.parse(date))?date:undefined,sourceUrl:`https://api.gleif.org/api/v1/lei-records/${lei}`,retrievedAt:new Date().toISOString()};
}
export async function lookupLegalEntity(input:string,signal:AbortSignal):Promise<LegalEntityObservation|undefined>{
  const lei=input.trim().toUpperCase();if(!validLei(lei)) throw new Error('Enter a valid 20-character LEI with its check digits.');signal.throwIfAborted();
  const granted=chrome.permissions.request({origins:[GLEIF_ORIGIN]});if(!await granted) return undefined;signal.throwIfAborted();
  const result=await fetchBoundedJson(`https://api.gleif.org/api/v1/lei-records/${lei}`,AbortSignal.any([signal,AbortSignal.timeout(8000)]));
  if(!await chrome.permissions.contains({origins:[GLEIF_ORIGIN]})) return undefined;
  return parseGleif(result,lei);
}
