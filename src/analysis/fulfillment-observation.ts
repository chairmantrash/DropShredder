import {commerceText} from '../languages/commerce-text';
export interface ParsedFulfillmentObservation {
  origin?:string;
  carrier?:string;
  routeText?:string;
  confidence:number;
}

const ORIGIN_PATTERNS=[
  /\b(?:origin|ship(?:ped|s)?\s+(?:directly\s+)?from|dispatch(?:ed)?\s+from|departed\s+from|accepted\s+at)[:\s-]+([^.;!?\n]{3,100})/gi,
];

const CARRIER_PATTERNS=[
  /\b(4PX|YANWEN|CAINIAO|SF EXPRESS|DHL|FEDEX|UPS|USPS|ROYAL MAIL|CANADA POST|AUSTRALIA POST|LASERSHIP|ONTRAC)\b/i,
];

export function parseFulfillmentObservation(text:string):ParsedFulfillmentObservation {
  const matching=commerceText(text,50000);
  const normalized=matching.text.replace(/\s/g,' ');
  let origin:string|undefined;
  let routeText:string|undefined;
  for(const pattern of ORIGIN_PATTERNS){
    for(const match of matching.text.matchAll(pattern)){
    if(match?.[1]){
      const before=matching.text.slice(Math.max(0,match.index-65),match.index).split(/[.;!?\n]/).at(-1)??'';
      if(/\b(?:not|never|cannot|no)\b|["“”]|\b(?:customer|reviewer)\s+(?:said|says)/i.test(before))continue;
      const candidate=match[1].split(/\s+(?:to|→|->|destination\b)|\s*→\s*/i)[0]!.trim().replace(/[,\s]+$/,'');
      // Promotional dates are not dispatch locations. Generic "from X to Y"
      // prose is deliberately not an origin observation.
      if(!candidate || candidate.length>80 || /^(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d|\d{1,4}[-/]\d{1,2}/i.test(candidate))continue;
      origin=candidate;
      routeText=matching.original(match.index,Math.min(match[0].length,260)).replace(/\s+/g,' ');
      break;
    }
    }
    if(origin)break;
  }

  let carrier:string|undefined;
  for(const pattern of CARRIER_PATTERNS){
    const match=normalized.match(pattern);
    if(match?.[1]){
      carrier=match[1].toUpperCase();
      break;
    }
  }

  return {
    origin,
    carrier,
    routeText,
    confidence:origin ? .76 : carrier ? .45 : 0,
  };
}
