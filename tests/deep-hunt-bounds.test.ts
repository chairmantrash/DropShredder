import assert from 'node:assert/strict';
import test from 'node:test';
import { productSearchUrls } from '../src/deep-hunt/search-urls';
import { SOURCE_INDEX } from '../src/intelligence/source-index';

test('product source hunt stays bounded while covering built-in sources',()=>{
  const urls=productSearchUrls('generic cat tower');
  const values=Object.values(urls);
  assert.ok(values.length<=10,`Deep Hunt would open ${values.length} tabs`);
  assert.ok(values.length>=4);
  for(const url of values) assert.match(url,/^https:\/\//);

  const decoded=values.map(value=>decodeURIComponent(value)).join(' ');
  for(const domain of SOURCE_INDEX.flatMap(source=>source.queryDomains)){
    assert.ok(decoded.includes(domain),`grouped Deep Hunt lost built-in source ${domain}`);
  }
});

test('image hunts never transmit signed or private image links to third-party search destinations',async()=>{
  const {imageSearchUrls}=await import('../src/deep-hunt/search-urls');
  const trusted=imageSearchUrls('https://cdn.example.com/images/item.png');
  assert.match(decodeURIComponent(trusted.googleLens??''),/cdn\.example\.com\/images\/item\.png/);
  for(const link of [
    'https://cdn.example.com/images/item.png?access_token=SECRET',
    'https://cdn.example.com/images/item.png#SECRET',
    'https://token@cdn.example.com/images/item.png',
    'http://cdn.example.com/images/item.png',
    'https://127.0.0.1/images/item.png',
  ]){
    const urls=imageSearchUrls(link);
    assert.equal(urls.googleLens,'https://lens.google.com/');
    assert.equal(urls.tineye,'https://tineye.com/');
    assert.ok(!JSON.stringify(urls).includes('SECRET'));
  }
});
