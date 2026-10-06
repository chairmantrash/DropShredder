export interface ReputationTarget {
  merchantName?:string;
  domain:string;
  providerNames?:string[];
}

export interface ReputationSource {
  id:string;
  label:string;
  searchUrl:(target:string)=>string;
}

function q(value:string):string{return encodeURIComponent(value.trim());}

export const REPUTATION_SOURCES:ReputationSource[]=[
  {id:'trustpilot',label:'Trustpilot',searchUrl:t=>`https://www.google.com/search?q=${q('"'+t+'" site:trustpilot.com')}`},
  {id:'sitejabber',label:'Sitejabber',searchUrl:t=>`https://www.google.com/search?q=${q('"'+t+'" site:sitejabber.com')}`},
  {id:'consumeraffairs',label:'ConsumerAffairs',searchUrl:t=>`https://www.google.com/search?q=${q('"'+t+'" site:consumeraffairs.com')}`},
  {id:'bbb',label:'BBB',searchUrl:t=>`https://www.google.com/search?q=${q('"'+t+'" site:bbb.org complaints')}`},
  {id:'google-reviews',label:'Google Reviews',searchUrl:t=>`https://www.google.com/search?q=${q('"'+t+'" reviews')}`},
  {id:'reddit',label:'Reddit',searchUrl:t=>`https://www.google.com/search?q=${q('"'+t+'" (refund OR scam OR dropship OR shipping OR quality) site:reddit.com')}`}
];

export function reputationSearchUrls(target:ReputationTarget):Record<string,string>{
  const primary=target.merchantName?.trim() || target.domain;
  const out:Record<string,string>={};
  for(const source of REPUTATION_SOURCES) out[source.id]=source.searchUrl(primary);
  return out;
}

export function providerReputationSearchUrls(provider:string):Record<string,string>{
  const out:Record<string,string>={};
  for(const source of REPUTATION_SOURCES){
    out[`${source.id}:${provider}`]=source.searchUrl(provider);
  }
  return out;
}
