/** Anonymous source diagnosis only; detached DOM is not genuine browser acceptance. */
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {extractPageScan} from '../../../src/extraction/page-scan';
import {pathToFileURL} from 'node:url';
import {COMMERCE_LANGUAGE_KIT} from '../../../src/languages/commerce-kit';
const directory=process.argv[2]!;
const receipts=JSON.parse(fs.readFileSync(directory+'/source-receipts.json','utf8'));
const results=[];
const module=process.argv[3]?await import(pathToFileURL(process.argv[3]).href):undefined;
const extractor=module?(module.extractPageScan??module.default?.extractPageScan):extractPageScan;
for(const receipt of receipts){
 if(receipt.status!==200)continue;
 const {document,window}=parseHTML(fs.readFileSync(directory+'/'+receipt.id+'.html','utf8'));
 for(const [key,selector] of [['scripts','script'],['images','img']] as const){const nodes=[...document.querySelectorAll(selector)];Object.defineProperty(document,key,{value:{length:nodes.length,item:(i:number)=>nodes[i]}});}
 const globals=globalThis as unknown as Record<string,unknown>;
 const values={document,window,location:new URL(receipt.responseUrl),NodeFilter:{SHOW_TEXT:4,SHOW_ELEMENT:1},HTMLElement:window.HTMLElement};
 const old=Object.fromEntries(Object.keys(values).map(k=>[k,globals[k]]));Object.assign(globals,values);
 try{
  const scan=extractor(COMMERCE_LANGUAGE_KIT);
  const ld=[...document.querySelectorAll('script[type="application/ld+json"]')].flatMap(s=>{try{return [JSON.parse(s.textContent??'')];}catch{return [];}});
  results.push({id:receipt.id,source:receipt,product:scan.product,siteLinks:scan.siteLinks,pageTextChars:scan.pageText.length,jsonRootTypes:ld.map(x=>Array.isArray(x)?'array':x['@type']),sourceStructuredSummary:ld.map(x=>({type:x['@type'],brand:x.brand,hasGraph:Boolean(x['@graph']),hasVariant:Boolean(x.hasVariant)}))});
 }catch(error){results.push({id:receipt.id,error:String(error)});}
 finally{for(const k of Object.keys(values))if(old[k]===undefined)delete globals[k];else globals[k]=old[k];}
}
fs.writeFileSync(directory+'/detached-diagnosis.json',JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results.map(x=>({id:x.id,error:x.error,product:x.product?{title:x.product.title,brand:x.product.brand,mpn:x.product.mpn,gtin:x.product.gtin,price:x.product.price,currency:x.product.currency,shippingText:x.product.shippingText,extraction:x.product.extraction,specifications:x.product.specifications}:undefined,jsonRootTypes:x.jsonRootTypes,siteLinks:x.siteLinks,pageTextChars:x.pageTextChars})),null,2));
