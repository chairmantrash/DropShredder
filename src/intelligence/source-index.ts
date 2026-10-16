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
  {id:'amazon-ca',name:'Amazon Canada',domains:['amazon.ca'],sourceClass:'retail',queryDomains:['amazon.ca'],notes:'Regional product comparison only; third-party seller, manufacture and dispatch are separate. Reviewed 2026-10-10.'},
  {id:'amazon-mx',name:'Amazon Mexico',domains:['amazon.com.mx'],sourceClass:'retail',queryDomains:['amazon.com.mx'],notes:'Regional product comparison only; no marketplace trust or origin guarantee. Reviewed 2026-10-10.'},
  {id:'walmart-ca',name:'Walmart Canada',domains:['walmart.ca'],sourceClass:'retail',queryDomains:['walmart.ca'],notes:'Regional product comparison; exact seller/product and fulfillment must be checked separately. Reviewed 2026-10-10.'},
  {id:'walmart-mx',name:'Walmart Mexico',domains:['walmart.com.mx'],sourceClass:'retail',queryDomains:['walmart.com.mx'],notes:'Regional product comparison; generic extraction rather than independently validated regional adapter. Reviewed 2026-10-10.'},
  {id:'mercadolibre-mx',name:'Mercado Libre Mexico',domains:['mercadolibre.com.mx'],sourceClass:'marketplace',queryDomains:['mercadolibre.com.mx'],notes:'Regional comparison candidate; Full fulfillment does not prove Mexican manufacture. No dedicated adapter/badges claimed. Reviewed 2026-10-10.'},
  {id:'dropcommerce',name:'DropCommerce',domains:['dropcommerce.com'],sourceClass:'supplier-network',queryDomains:['dropcommerce.com'],notes:'US/Canada shipping suppliers may source overseas; see https://www.dropcommerce.com/suppliers/ . Informational only, reviewed 2026-10-10.'},
  {id:'dropi-import',name:'Dropi import app',domains:['dropi.com.mx'],sourceClass:'supplier-network',queryDomains:['dropi.com.mx'],notes:'Disclosed AliExpress/CJ/FForder/SourcinBox imports. Not conflated with Dropi logistics. Informational only, reviewed 2026-10-10: https://dropi.com.mx/'},
  {id:'nihaojewelry',name:'Nihaojewelry',domains:['nihaojewelry.com'],sourceClass:'wholesale',queryDomains:['nihaojewelry.com'],notes:'Provider discloses China sourcing and Mexico warehouse. Local inventory is not local manufacture. Reviewed 2026-10-10: https://www.nihaojewelry.com/about-us'},
  {id:'sourcinbox',name:'SourcinBox',domains:['sourcinbox.com'],sourceClass:'supplier-network',queryDomains:['sourcinbox.com'],notes:'Provider discloses Chinese factory sourcing/private labels; network presence alone unscored. Reviewed 2026-10-10: https://www.sourcinbox.com/about-us'},
  {id:'hypersku',name:'HyperSKU',domains:['hypersku.com'],sourceClass:'supplier-network',queryDomains:['hypersku.com'],notes:'China sourcing/fulfillment provider; no downstream seller attribution. Reviewed 2026-10-10: https://www.hypersku.com/sourcing/'},
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
  {id:'tapstitch',name:'Tapstitch',domains:['tapstitch.com'],sourceClass:'pod',queryDomains:['tapstitch.com'],notes:'POD/private-label provider; outsourcing alone is not negative evidence.'},
  {id:'dear-lover',name:'Dear-Lover',domains:['dear-lover.com'],sourceClass:'wholesale',queryDomains:['dear-lover.com'],notes:'Apparel wholesale/dropship comparison candidate; provider discloses private labels and Quanzhou Shiying operation. Reviewed 2026-10-08: https://www.dear-lover.com/page/about-dear-lover-wholesale . No quality or downstream merchant attribution from domain presence.'},
  {id:'trendsi',name:'Trendsi',domains:['trendsi.com'],sourceClass:'supplier-network',queryDomains:['trendsi.com'],notes:'Apparel/private-label supplier candidate; provider offers product media and direct customer fulfillment. Reviewed 2026-10-08: https://www.trendsi.com/private-labeling . Provider claims do not prove garment quality or another merchant uses Trendsi.'},
  {id:'fondmart',name:'FondMart',domains:['fondmart.com'],sourceClass:'wholesale',queryDomains:['fondmart.com'],notes:'Apparel wholesale/private-label candidate; provider describes relabeling and direct fulfillment. Reviewed 2026-10-08: https://fondmart.com/private-label.html/ . Branding or country alone is not negative evidence.'},
  {id:'wholesale7',name:'Wholesale7',domains:['wholesale7.net'],sourceClass:'wholesale',queryDomains:['wholesale7.net'],notes:'Apparel source candidate; public FAQ describes direct dropship orders and custom labels. Reviewed 2026-10-08: https://www.wholesale7.net/faq_detail.php . No supplier identity, garment quality or deception conclusion without product-specific evidence.'},
  {id:'cc-wholesale-clothing',name:'CC Wholesale Clothing',domains:['ccwholesaleclothing.com'],sourceClass:'wholesale',queryDomains:['ccwholesaleclothing.com'],notes:'Apparel source candidate; public FAQ names its My Online Fashion Store dropship partnership. Reviewed 2026-10-08: https://www.ccwholesaleclothing.com/faq . U.S. dispatch is distinct from manufacture; no standalone quality or merchant-risk inference.'},
  {id:'usadrop',name:'USAdrop',domains:['usadrop.com'],sourceClass:'supplier-network',queryDomains:['usadrop.com'],notes:'Blind/branded fulfillment source candidate. Reviewed 2026-10-08: https://usadrop.com/blind-dropshipping-ship-without-revealing-supplier/ . Neutral packaging, domestic dispatch and tool presence cannot establish origin, quality or deception.'}
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
