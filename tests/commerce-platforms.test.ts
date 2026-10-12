import assert from 'node:assert/strict';
import test from 'node:test';
import { detectCommercePlatforms } from '../src/intelligence/commerce-platforms';

test('detects SHOPLINE from CDN without treating it as accusation',()=>{
  const matches=detectCommercePlatforms({
    scripts:['https://cdn.myshopline.com/assets/app.js'],
    html:'',
    imageUrls:[],
  });
  assert.equal(matches.some(m=>m.id==='shopline'),true);
});

test('detects Shoplazza and ShopBase from bundled signatures',()=>{
  const shoplazza=detectCommercePlatforms({scripts:['https://assets.shoplazza.com/a.js'],html:'',imageUrls:[]});
  const shopbase=detectCommercePlatforms({scripts:['https://connect.shopbase.com/x.js'],html:'',imageUrls:[]});
  assert.equal(shoplazza.some(m=>m.id==='shoplazza'),true);
  assert.equal(shopbase.some(m=>m.id==='shopbase'),true);
});

test('detects Wix and Ecwid common public assets',()=>{
  assert.equal(detectCommercePlatforms({scripts:['https://static.wixstatic.com/x.js'],html:'',imageUrls:[]}).some(m=>m.id==='wix'),true);
  assert.equal(detectCommercePlatforms({scripts:['https://app.ecwid.com/script.js'],html:'',imageUrls:[]}).some(m=>m.id==='ecwid'),true);
});

test('asset domains cannot be spoofed with URL paths, queries, credentials or suffix hosts',()=>{
  const matches=detectCommercePlatforms({scripts:['https://cdn.shopify.com.evil.example/a.js','https://bigcommerce.com@evil.example/a.js','https://evil.example/myshopline.com/a.js','https://evil.example/a.js?site=wixstatic.com&wc-cart-fragments=1#shoplazza.com','data:text/javascript,shopbase.com'],html:'',imageUrls:['https://shoplazza.com.evil.example/a.jpg','https://evil.example/myshopline.com/a.jpg']});
  assert.deepEqual(matches,[]);
});

test('real subdomains and public asset paths remain recognized with cache queries',()=>{
  const matches=detectCommercePlatforms({scripts:['https://cdn.shopify.com/a.js?x=1','https://shop.example/wp/woocommerce/wc-cart-fragments.js?v=1','https://ecwid.com/script.js?v=1','https://shop.example/on/demandware.static/a.js'],html:'',imageUrls:['https://cdn.shoplazza.net/a.jpg']});
  assert.deepEqual(matches.map(x=>x.id),['shopify','woocommerce','shoplazza','ecwid','salesforce-commerce-cloud']);
  assert.equal(detectCommercePlatforms({scripts:['https://ecwid.com/not-script.js'],html:'',imageUrls:[]}).length,0);
});
