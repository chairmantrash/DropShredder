import {publicEvidenceUrl} from '../security/public-url';

export interface OutsideResult {
  provider:'ScamFerret research'|'urlscan';domain:string;reportedAt:string;retrievedAt:string;
  outcome:'reported-concern'|'no-listed-concern'|'unclassified';scope:'historical-opinion'|'security';
  reason:string;recordId:string;stale:boolean;
}
export function lookupDomain(value:string):string {
  const host=value.trim().toLowerCase().replace(/^www\./,'');
  if(host.length>253||!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/.test(host)||!publicEvidenceUrl('https://'+host+'/'))throw Error('A public website domain is required.');
  return host;
}
export function validOutsideResult(r:unknown):r is OutsideResult {
  if(!r||typeof r!=='object')return false;const v=r as OutsideResult;
  try{return lookupDomain(v.domain)===v.domain&&['ScamFerret research','urlscan'].includes(v.provider)&&
    ['reported-concern','no-listed-concern','unclassified'].includes(v.outcome)&&['historical-opinion','security'].includes(v.scope)&&
    v.scope===(v.provider==='urlscan'?'security':'historical-opinion')&&
    typeof v.reportedAt==='string'&&typeof v.retrievedAt==='string'&&Number.isFinite(Date.parse(v.reportedAt))&&Number.isFinite(Date.parse(v.retrievedAt))&&Date.parse(v.reportedAt)<=Date.parse(v.retrievedAt)&&
    typeof v.reason==='string'&&v.reason.length<=1600&&typeof v.recordId==='string'&&v.recordId.length<=150&&typeof v.stale==='boolean';}catch{return false;}
}
