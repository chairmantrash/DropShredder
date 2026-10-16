/** Test admission is not product, price, legitimacy or label acceptance. */
export const auditPrivatePath=path=>/\/(?:cart|shopping_cart|checkout|account|my-account|create_account|login|signin|sign-in|payment|admin|wp-admin)(?:[/.]|$)/i.test(path);
export function publicAuditUrl(value){const u=new URL(value);u.hash='';for(const k of [...u.searchParams.keys()])if(!['products_id','product_id','id','pid','item','main_page','variant'].includes(k)||u.searchParams.get(k).length>128)u.searchParams.delete(k);return u.href;}
export function auditCommerceAdmission(observed){
 if(observed.structuredCurrentProduct&&observed.h1)return {allowed:true,reason:'current named structured Product/ProductGroup; price or selected offer may be unresolved'};
 const commerce=Boolean(observed.products||observed.productLinks||/add to (?:cart|bag)|warenkorb|acheter|comprar|winkelwagen|カート|購入|aggiungi|panier/i.test(observed.text));
 const priced=/[$€£¥]|\b(?:USD|EUR|GBP|JPY)\b/.test(observed.text);
 return {allowed:commerce&&priced,reason:commerce&&priced?'commerce cues plus visible currency; selected product/offer not inferred':'current commerce unconfirmed'};
}

/** Self-contained browser observer. No fields or private form/script contents. */
export function observePublicAuditPage(){
 const h1=document.querySelector('h1')?.textContent?.trim();
 const named=v=>typeof v==='string'?v.normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim():'';
 const here=new URL(location.href);let structuredCurrentProduct=false,products=0;
 let scripts=0,nodes=0;
 const walk=(value,depth=0)=>{
  if(depth>8||nodes>=120)return;
  if(Array.isArray(value)){for(const v of value.slice(0,120))walk(v,depth+1);return;}
  if(!value||typeof value!=='object')return;nodes++;
  const types=Array.isArray(value['@type'])?value['@type']:[value['@type']];
  if(types.includes('Product')||types.includes('ProductGroup')){
   products++;
   let urlMatches=value.url===undefined;
   if(typeof value.url==='string')try{const u=new URL(value.url,here);urlMatches=u.origin===here.origin&&u.pathname===here.pathname;}catch{}
   if(urlMatches&&h1&&named(value.name)===named(h1))structuredCurrentProduct=true;
  }
  if(Array.isArray(value['@graph']))walk(value['@graph'],depth+1);
  if(value.hasVariant)walk(value.hasVariant,depth+1);
  if(value.mainEntity)walk(value.mainEntity,depth+1);
 };
 for(let i=0;i<Math.min(document.scripts.length,220)&&scripts<40;i++){
  const el=document.scripts.item(i);
  if(el?.type!=='application/ld+json'||el.closest('form,dialog,[role="dialog"],[hidden],[aria-hidden="true"]'))continue;
  scripts++;const raw=el.textContent??'';if(raw.length>60000)continue;
  try{walk(JSON.parse(raw));}catch{}
 }
 return {language:document.documentElement.lang,title:document.title,h1,text:(document.body?.innerText??'').slice(0,60000),privateForm:Boolean(document.querySelector('input[type=password],input[autocomplete="cc-number"],input[autocomplete="current-password"]')),products,structuredCurrentProduct,productLinks:[...document.querySelectorAll('a[href]')].slice(0,1200).filter(a=>/\/(products?|item|items|p)\//i.test(a.pathname)).length};
}
