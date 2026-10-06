export type CommercePlatformId=
  |'shopify'|'woocommerce'|'bigcommerce'|'magento'|'shopline'|'shoplazza'|'shopbase'
  |'wix'|'ecwid'|'squarespace'|'prestashop'|'opencart'|'shift4shop'|'salesforce-commerce-cloud';

export interface CommercePlatformDefinition {
  id:CommercePlatformId;
  name:string;
  scriptIncludes?:string[];
  htmlIncludes?:string[];
  selectors?:string[];
  imageHostIncludes?:string[];
  sourceUrl:string;
  dropshipContext:string;
}

export const COMMERCE_PLATFORMS:CommercePlatformDefinition[]=[
  {id:'shopify',name:'Shopify',scriptIncludes:['cdn.shopify.com','shopifycloud.com'],htmlIncludes:['Shopify.theme','shopify-section'],sourceUrl:'https://www.shopify.com/',dropshipContext:'General commerce platform with extensive dropshipping/POD integrations; platform presence is neutral.'},
  {id:'woocommerce',name:'WooCommerce',scriptIncludes:['woocommerce','wc-add-to-cart','wc-cart-fragments'],htmlIncludes:['woocommerce'],selectors:['body.woocommerce'],sourceUrl:'https://woocommerce.com/',dropshipContext:'General WordPress commerce platform; supplier/fulfillment integrations vary.'},
  {id:'bigcommerce',name:'BigCommerce',scriptIncludes:['bigcommerce.com','stencil-utils'],selectors:['[data-content-region]'],sourceUrl:'https://www.bigcommerce.com/',dropshipContext:'General commerce platform; dropshipping integrations exist but presence is neutral.'},
  {id:'magento',name:'Magento / Adobe Commerce',scriptIncludes:['requirejs','/static/version'],htmlIncludes:['Magento_'],sourceUrl:'https://business.adobe.com/products/magento/magento-commerce.html',dropshipContext:'General commerce platform; presence is neutral.'},
  {id:'shopline',name:'SHOPLINE',scriptIncludes:['shoplineapp.com','shoplinecdn.com','myshopline.com'],imageHostIncludes:['myshopline.com','shoplineimg.com'],htmlIncludes:['SHOPLINE'],sourceUrl:'https://www.shopline.com/',dropshipContext:'Cross-border commerce platform used by many ordinary and supplier-integrated stores; presence is informational.'},
  {id:'shoplazza',name:'Shoplazza',scriptIncludes:['shoplazza.com','shoplazza.net'],imageHostIncludes:['shoplazza.com','shoplazza.net'],htmlIncludes:['Shoplazza'],sourceUrl:'https://www.shoplazza.com/',dropshipContext:'Shoplazza documents dropshipping, 1688 and CJdropshipping sourcing and global fulfillment capabilities.'},
  {id:'shopbase',name:'ShopBase',scriptIncludes:['onshopbase.com','shopbase.com','connect.shopbase.com'],imageHostIncludes:['onshopbase.com'],htmlIncludes:['ShopBase'],sourceUrl:'https://www.shopbase.com/',dropshipContext:'ShopBase is oriented toward cross-border dropshipping, POD and white-label commerce.'},
  {id:'wix',name:'Wix Stores',scriptIncludes:['wixstatic.com','parastorage.com'],htmlIncludes:['wixStores','wixBiSession'],sourceUrl:'https://www.wix.com/ecommerce/website',dropshipContext:'Wix supports Modalyst/Spocket and other dropshipping services; Wix presence alone is neutral.'},
  {id:'ecwid',name:'Ecwid',scriptIncludes:['app.ecwid.com','ecwid.com/script.js'],htmlIncludes:['ecwid-shopping-cart'],selectors:['.ec-store'],sourceUrl:'https://www.ecwid.com/',dropshipContext:'Ecwid officially supports supplier integrations including Alibaba, Syncee, Printful and Wholesale2B.'},
  {id:'squarespace',name:'Squarespace Commerce',scriptIncludes:['static1.squarespace.com','squarespace-cdn.com'],htmlIncludes:['Squarespace'],sourceUrl:'https://www.squarespace.com/ecommerce-website',dropshipContext:'General commerce platform with Printful/POD integration; presence is neutral.'},
  {id:'prestashop',name:'PrestaShop',scriptIncludes:['prestashop'],htmlIncludes:['prestashop'],sourceUrl:'https://prestashop.com/',dropshipContext:'General open-source commerce platform; presence is neutral.'},
  {id:'opencart',name:'OpenCart',htmlIncludes:['route=product/product','catalog/view/theme'],sourceUrl:'https://www.opencart.com/',dropshipContext:'General open-source commerce platform; presence is neutral.'},
  {id:'shift4shop',name:'Shift4Shop',scriptIncludes:['3dcart.com','shift4shop.com'],htmlIncludes:['3dcart'],sourceUrl:'https://www.shift4shop.com/',dropshipContext:'Hosted commerce platform with supplier integrations; presence is neutral.'},
  {id:'salesforce-commerce-cloud',name:'Salesforce Commerce Cloud',scriptIncludes:['demandware.static','demandware.net'],htmlIncludes:['dwfrm_'],sourceUrl:'https://www.salesforce.com/commerce/',dropshipContext:'Enterprise commerce platform; platform presence has no dropshipping weight.'},
];

export function detectCommercePlatforms(input:{
  scripts:string[];
  html:string;
  imageUrls:string[];
  selectorPresent?:(selector:string)=>boolean;
}):CommercePlatformDefinition[]{
  const haystack=input.html.toLowerCase();
  return COMMERCE_PLATFORMS.filter(platform=>{
    if((platform.scriptIncludes??[]).some(n=>input.scripts.some(src=>src.toLowerCase().includes(n.toLowerCase())))) return true;
    if((platform.imageHostIncludes??[]).some(n=>input.imageUrls.some(src=>src.toLowerCase().includes(n.toLowerCase())))) return true;
    if((platform.htmlIncludes??[]).some(n=>haystack.includes(n.toLowerCase()))) return true;
    if(input.selectorPresent && (platform.selectors??[]).some(s=>input.selectorPresent!(s))) return true;
    return false;
  });
}
