import { SOURCE_INDEX } from '../intelligence/source-index';

function q(value:string):string { return encodeURIComponent(value.trim()); }

function domainGroups():Array<{label:string;domains:string[]}>{
  const classes=[
    ['wholesale',new Set(['wholesale'])],
    ['marketplaces',new Set(['marketplace'])],
    ['retail',new Set(['retail'])],
    ['supplier-networks',new Set(['supplier-network'])],
    ['pod',new Set(['pod'])],
  ] as const;

  const groups:Array<{label:string;domains:string[]}>= [];
  for(const [label,classesForGroup] of classes){
    const domains=[...new Set(
      SOURCE_INDEX
        .filter(source=>classesForGroup.has(source.sourceClass as never))
        .flatMap(source=>source.queryDomains)
    )];
    for(let i=0;i<domains.length;i+=6){
      groups.push({label:`${label}-${Math.floor(i/6)+1}`,domains:domains.slice(i,i+6)});
    }
  }
  return groups;
}

export function productSearchUrls(title:string):Record<string,string> {
  const phrase=title ? `"${title.slice(0,180)}"` : '';
  const urls:Record<string,string>={
    web:`https://www.google.com/search?q=${q(phrase)}`,
  };

  for(const group of domainGroups()){
    const sites=group.domains.map(domain=>`site:${domain}`).join(' OR ');
    urls[group.label]=`https://www.google.com/search?q=${q(`${phrase} (${sites})`)}`;
  }
  urls.reddit=`https://www.google.com/search?q=${q(phrase+' reddit')}`;
  return urls;
}

export function merchantSearchUrls(domain:string):Record<string,string> {
  const quoted=`"${domain}"`;
  return {
    reviews:`https://www.google.com/search?q=${q(quoted+' reviews')}`,
    complaints:`https://www.google.com/search?q=${q(quoted+' complaints')}`,
    scam:`https://www.google.com/search?q=${q(quoted+' scam')}`,
    reddit:`https://www.google.com/search?q=${q(quoted+' reddit')}`,
    trustpilot:`https://www.google.com/search?q=${q(quoted+' site:trustpilot.com')}`,
    rdap:`https://client.rdap.org/?object=${q(domain)}&type=domain`,
    bbb:`https://www.google.com/search?q=${q(quoted+' site:bbb.org')}`,
  };
}

export function imageSearchUrls(imageUrl?:string):Record<string,string> {
  return {
    googleLens:imageUrl
      ? `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageUrl)}`
      : 'https://lens.google.com/',
    bing:'https://www.bing.com/visualsearch?cc=us',
    yandex:'https://yandex.com/images/',
    tineye:imageUrl
      ? `https://tineye.com/search?url=${encodeURIComponent(imageUrl)}`
      : 'https://tineye.com/',
  };
}
