export interface ParsedFulfillmentObservation {
  origin?:string;
  carrier?:string;
  routeText?:string;
  confidence:number;
}

const ORIGIN_PATTERNS=[
  /(?:origin|ship(?:ped)? from|departed from|accepted at)[:\s-]+([a-z0-9 .,'-]{3,80})/i,
  /(?:from)\s+([a-z][a-z .,'-]{2,50})\s+(?:to|→|->)\s+[a-z]/i,
];

const CARRIER_PATTERNS=[
  /\b(4PX|YANWEN|CAINIAO|SF EXPRESS|DHL|FEDEX|UPS|USPS|ROYAL MAIL|CANADA POST|AUSTRALIA POST|LASERSHIP|ONTRAC)\b/i,
];

export function parseFulfillmentObservation(text:string):ParsedFulfillmentObservation {
  const normalized=text.replace(/\s+/g,' ').slice(0,50000);
  let origin:string|undefined;
  for(const pattern of ORIGIN_PATTERNS){
    const match=normalized.match(pattern);
    if(match?.[1]){
      origin=match[1].trim();
      break;
    }
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
    routeText:origin ? normalized.slice(0,260) : undefined,
    confidence:origin ? .76 : carrier ? .45 : 0,
  };
}
