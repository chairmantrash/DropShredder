import assert from 'node:assert/strict';
import test from 'node:test';
import { pageSafety, sanitizeUrlForStorage } from '../src/security/page-safety';

test('removes query strings and fragments before local persistence',()=>{
  assert.equal(
    sanitizeUrlForStorage('https://shop.example/products/widget?token=secret&utm_source=x#reviews'),
    'https://shop.example/products/widget'
  );
});

test('rejects checkout and account surfaces',()=>{
  assert.equal(pageSafety('https://shop.example/checkout/payment').allowed,false);
  assert.equal(pageSafety('https://shop.example/account/orders').allowed,false);
  assert.equal(pageSafety('https://shop.example/sign-in').allowed,false);
});

test('permits ordinary product and collection pages',()=>{
  assert.equal(pageSafety('https://shop.example/products/widget').allowed,true);
  assert.equal(pageSafety('https://shop.example/collections/chairs?page=2').allowed,true);
});

test('rejects browser/internal schemes',()=>{
  assert.equal(pageSafety('chrome://extensions').allowed,false);
  assert.equal(pageSafety('file:///tmp/test.html').allowed,false);
});
