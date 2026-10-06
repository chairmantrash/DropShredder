export type SourceClass='wholesale'|'marketplace'|'retail'|'pod'|'supplier-network';

export interface SourceIndexEntry {
  id:string;
  name:string;
  domains:string[];
  sourceClass:SourceClass;
  queryDomains:string[];
  notes:string;
}

export const SOURCE_INDEX:SourceIndexEntry[]=[
  {id:'aliexpress',name:'AliExpress',domains:['aliexpress.com'],sourceClass:'marketplace',queryDomains:['aliexpress.com'],notes:'Marketplace/source candidate only; match does not establish copying direction.'},
  {id:'alibaba',name:'Alibaba',domains:['alibaba.com'],sourceClass:'wholesale',queryDomains:['alibaba.com'],notes:'Wholesale/source candidate.'},
  {id:'1688',name:'1688',domains:['1688.com'],sourceClass:'wholesale',queryDomains:['1688.com'],notes:'Wholesale/source candidate.'},
  {id:'temu',name:'Temu',domains:['temu.com'],sourceClass:'marketplace',queryDomains:['temu.com'],notes:'Marketplace/source candidate.'},
  {id:'dhgate',name:'DHgate',domains:['dhgate.com'],sourceClass:'wholesale',queryDomains:['dhgate.com'],notes:'Wholesale/source candidate.'},
  {id:'banggood',name:'Banggood',domains:['banggood.com'],sourceClass:'marketplace',queryDomains:['banggood.com'],notes:'Marketplace/source candidate.'},
  {id:'amazon',name:'Amazon',domains:['amazon.com'],sourceClass:'retail',queryDomains:['amazon.com'],notes:'Retail-arbitrage/source candidate.'},
  {id:'ebay',name:'eBay',domains:['ebay.com'],sourceClass:'retail',queryDomains:['ebay.com'],notes:'Retail-resale/source candidate.'},
  {id:'walmart',name:'Walmart',domains:['walmart.com'],sourceClass:'retail',queryDomains:['walmart.com'],notes:'Retail-resale/source candidate.'},
  {id:'zendrop',name:'Zendrop',domains:['zendrop.com'],sourceClass:'supplier-network',queryDomains:['zendrop.com'],notes:'Supplier-network presence alone is informational.'},
  {id:'spocket',name:'Spocket',domains:['spocket.co'],sourceClass:'supplier-network',queryDomains:['spocket.co'],notes:'Supplier-network presence alone is informational.'},
  {id:'printify',name:'Printify',domains:['printify.com'],sourceClass:'pod',queryDomains:['printify.com'],notes:'POD provider; outsourcing alone is not negative evidence.'},
  {id:'printful',name:'Printful',domains:['printful.com'],sourceClass:'pod',queryDomains:['printful.com'],notes:'POD provider; outsourcing alone is not negative evidence.'},
  {id:'gelato',name:'Gelato',domains:['gelato.com'],sourceClass:'pod',queryDomains:['gelato.com'],notes:'POD provider; outsourcing alone is not negative evidence.'}
];

export function indexedSourceForDomain(domain:string):SourceIndexEntry|undefined{
  const normalized=domain.toLowerCase().replace(/^www\./,'');
  return SOURCE_INDEX.find(source=>source.domains.some(d=>normalized===d || normalized.endsWith('.'+d)));
}

export function sourceSearchUrls(query:string):Record<string,string>{
  const quoted=`"${query.slice(0,180)}"`;
  const urls:Record<string,string>={};
  for(const source of SOURCE_INDEX){
    for(const domain of source.queryDomains){
      urls[source.id]=`https://www.google.com/search?q=${encodeURIComponent(quoted+' site:'+domain)}`;
      break;
    }
  }
  return urls;
}
