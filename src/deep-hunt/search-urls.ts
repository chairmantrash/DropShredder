function q(value:string):string { return encodeURIComponent(value.trim()); }

export function productSearchUrls(title:string):Record<string,string> {
  const phrase=title ? `"${title.slice(0,180)}"` : '';
  return {
    web:`https://www.google.com/search?q=${q(phrase)}`,
    aliexpress:`https://www.google.com/search?q=${q(phrase+' site:aliexpress.com')}`,
    alibaba:`https://www.google.com/search?q=${q(phrase+' site:alibaba.com')}`,
    temu:`https://www.google.com/search?q=${q(phrase+' site:temu.com')}`,
    dhgate:`https://www.google.com/search?q=${q(phrase+' site:dhgate.com')}`,
    reddit:`https://www.google.com/search?q=${q(phrase+' reddit')}`,
  };
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
