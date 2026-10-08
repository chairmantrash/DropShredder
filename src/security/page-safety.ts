const SENSITIVE_PATH_PARTS=[
  'checkout','checkouts','account','accounts','login','log-in','signin','sign-in',
  'auth','oauth','payment','payments','billing','wallet','orders','order-history',
  'my-orders','addresses','address-book','subscriptions','manage-subscription',
  'cart','basket','customer','customers','profile','register','sign-up','signup',
  'shipping-address','checkout-step','order-confirmation','confirm-order'
];

export interface PageSafetyResult {
  allowed:boolean;
  reason?:string;
}

export function sanitizeUrlForStorage(value:string|undefined):string|undefined{
  if(!value) return undefined;
  try{
    const url=new URL(value);
    if(url.protocol!=='http:' && url.protocol!=='https:') return undefined;
    return url.origin+url.pathname;
  }catch{
    return undefined;
  }
}

export function pageSafety(urlValue:string|undefined):PageSafetyResult{
  if(!urlValue) return {allowed:false,reason:'No active web page is available.'};
  let url:URL;
  try{url=new URL(urlValue);}catch{return {allowed:false,reason:'The active page URL is not supported.'};}
  if(url.protocol!=='http:' && url.protocol!=='https:'){
    return {allowed:false,reason:'DropShredder only scans ordinary HTTP/HTTPS commerce pages.'};
  }

  const host=url.hostname.toLowerCase();
  if(/^(?:accounts?|auth|login|signin|checkout|payments?|billing|wallet|mail|webmail|inbox)\./.test(host)
    || /^(?:mail\.google\.com|outlook\.live\.com|outlook\.office\.com)$/.test(host)){
    return {allowed:false,reason:'DropShredder does not scan account, email, checkout or payment services.'};
  }

  const parts=url.pathname.toLowerCase().split('/').filter(Boolean);
  if(parts.some(part=>SENSITIVE_PATH_PARTS.some(blocked=>part===blocked || part.startsWith(blocked+'-')))){
    return {
      allowed:false,
      reason:'DropShredder does not scan account, authentication, payment, billing, address, or order-history pages.',
    };
  }
  return {allowed:true};
}
