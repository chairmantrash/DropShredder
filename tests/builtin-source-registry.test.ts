import assert from 'node:assert/strict';
import test from 'node:test';
import { SOURCE_INDEX, sourceSearchUrls } from '../src/intelligence/source-index';

test('fresh install ships with broad supplier/source coverage',()=>{
  const ids=new Set(SOURCE_INDEX.map(source=>source.id));
  for(const id of [
    'aliexpress','alibaba','1688','temu','dhgate','taobao','tmall',
    'made-in-china','globalsources','cjdropshipping','zendrop','spocket',
    'modalyst','syncee','autods','dsers','printify','printful','gelato','tapstitch'
  ]){
    assert.equal(ids.has(id),true,`missing built-in source: ${id}`);
  }
});

test('source hunt uses bundled registry without local history',()=>{
  const urls=sourceSearchUrls('example product');
  for(const [id,domain]of [['aliexpress','aliexpress.com'],['made-in-china','made-in-china.com'],['globalsources','globalsources.com']]){
    const search=new URL(urls[id!]!);
    assert.equal(search.origin,'https://www.google.com');assert.equal(search.pathname,'/search');
    assert.equal(search.searchParams.get('q'),'"example product" site:'+domain);
  }
  assert.ok(Object.keys(urls).length>=20);
});
