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
  {id:'taobao',name:'Taobao',domains:['taobao.com'],sourceClass:'marketplace',queryDomains:['taobao.com'],notes:'China retail/source marketplace candidate.'},
  {id:'tmall',name:'Tmall',domains:['tmall.com'],sourceClass:'marketplace',queryDomains:['tmall.com'],notes:'China retail/source marketplace candidate.'},
  {id:'made-in-china',name:'Made-in-China.com',domains:['made-in-china.com'],sourceClass:'wholesale',queryDomains:['made-in-china.com'],notes:'Manufacturer/wholesale source candidate.'},
  {id:'globalsources',name:'Global Sources',domains:['globalsources.com'],sourceClass:'wholesale',queryDomains:['globalsources.com'],notes:'Manufacturer/wholesale source candidate.'},
  {id:'lightinthebox',name:'LightInTheBox',domains:['lightinthebox.com'],sourceClass:'retail',queryDomains:['lightinthebox.com'],notes:'Cross-border retail/source candidate.'},
  {id:'shein',name:'SHEIN',domains:['shein.com'],sourceClass:'retail',queryDomains:['shein.com'],notes:'Cross-border retail/product-equivalence candidate.'},
  {id:'amazon',name:'Amazon',domains:['amazon.com'],sourceClass:'retail',queryDomains:['amazon.com'],notes:'Retail-arbitrage/source candidate.'},
  {id:'ebay',name:'eBay',domains:['ebay.com'],sourceClass:'retail',queryDomains:['ebay.com'],notes:'Retail-resale/source candidate.'},
  {id:'walmart',name:'Walmart',domains:['walmart.com'],sourceClass:'retail',queryDomains:['walmart.com'],notes:'Retail-resale/source candidate.'},
  {id:'cjdropshipping',name:'CJdropshipping',domains:['cjdropshipping.com'],sourceClass:'supplier-network',queryDomains:['cjdropshipping.com'],notes:'Supplier-network presence alone is informational.'},
  {id:'zendrop',name:'Zendrop',domains:['zendrop.com'],sourceClass:'supplier-network',queryDomains:['zendrop.com'],notes:'Supplier-network presence alone is informational.'},
  {id:'spocket',name:'Spocket',domains:['spocket.co'],sourceClass:'supplier-network',queryDomains:['spocket.co'],notes:'Supplier-network presence alone is informational.'},
  {id:'doba',name:'Doba',domains:['doba.com'],sourceClass:'supplier-network',queryDomains:['doba.com'],notes:'Supplier-network presence alone is informational.'},
  {id:'salehoo',name:'SaleHoo',domains:['salehoo.com'],sourceClass:'supplier-network',queryDomains:['salehoo.com'],notes:'Supplier-directory presence alone is informational.'},
  {id:'wholesale2b',name:'Wholesale2B',domains:['wholesale2b.com'],sourceClass:'supplier-network',queryDomains:['wholesale2b.com'],notes:'Supplier-network presence alone is informational.'},
  {id:'modalyst',name:'Modalyst',domains:['modalyst.co'],sourceClass:'supplier-network',queryDomains:['modalyst.co'],notes:'Supplier-network presence alone is informational.'},
  {id:'syncee',name:'Syncee',domains:['syncee.com'],sourceClass:'supplier-network',queryDomains:['syncee.com'],notes:'Supplier-network presence alone is informational.'},
  {id:'autods',name:'AutoDS',domains:['autods.com'],sourceClass:'supplier-network',queryDomains:['autods.com'],notes:'Dropshipping automation presence alone is informational.'},
  {id:'inventory-source',name:'Inventory Source',domains:['inventorysource.com'],sourceClass:'supplier-network',queryDomains:['inventorysource.com'],notes:'Supplier-network/automation presence alone is informational.'},
  {id:'dropified',name:'Dropified',domains:['dropified.com'],sourceClass:'supplier-network',queryDomains:['dropified.com'],notes:'Dropshipping automation presence alone is informational.'},
  {id:'dsers',name:'DSers',domains:['dsers.com'],sourceClass:'supplier-network',queryDomains:['dsers.com'],notes:'AliExpress/Alibaba sourcing automation presence alone is informational.'},
  {id:'printify',name:'Printify',domains:['printify.com'],sourceClass:'pod',queryDomains:['printify.com'],notes:'POD provider; outsourcing alone is not negative evidence.'},
  {id:'printful',name:'Printful',domains:['printful.com'],sourceClass:'pod',queryDomains:['printful.com'],notes:'POD provider; outsourcing alone is not negative evidence.'},
  {id:'gelato',name:'Gelato',domains:['gelato.com'],sourceClass:'pod',queryDomains:['gelato.com'],notes:'POD provider; outsourcing alone is not negative evidence.'},
  {id:'tapstitch',name:'Tapstitch',domains:['tapstitch.com'],sourceClass:'pod',queryDomains:['tapstitch.com'],notes:'POD/private-label provider; outsourcing alone is not negative evidence.'}
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
