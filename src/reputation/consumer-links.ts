import {lookupDomain} from './outside-results';
/** Reputation navigation is limited to consumer-review/bureau/government originals. */
export function consumerRecordLinks(domain:string):Array<{label:string;url:string}>{
  const host=lookupDomain(domain);
  return [
    {label:'Trustpilot',url:'https://www.trustpilot.com/review/'+host},
    {label:'BBB',url:'https://www.bbb.org/search?find_country=USA&find_text='+encodeURIComponent(host)+'&find_type=Business'},
    {label:'FTC consumer and enforcement records',url:'https://www.ftc.gov/legal-library/search?search='+encodeURIComponent(host)},
    {label:'CPSC official recalls',url:'https://www.cpsc.gov/Recalls'},
    {label:'Canada Competition Bureau',url:'https://competition-bureau.canada.ca/'},
    {label:'Mexico PROFECO consumer records',url:'https://www.gob.mx/profeco'},
  ];
}
