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
