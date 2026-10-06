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
