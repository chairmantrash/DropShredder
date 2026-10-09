import assert from 'node:assert/strict';
import test from 'node:test';
import {boundedBraveQuery,parseSupplierSearchResults} from '../src/osint/optional-brave';
test('optional API query refuses malformed inputs without key disclosure',()=>{
 assert.equal(boundedBraveQuery('  Acme model ABC  '),'Acme model ABC');
 for(const q of ['x','hi\napi_key','a'.repeat(181)])assert.throws(()=>boundedBraveQuery(q));
});
test('provider results are bounded, remove tracker URLs and remain informational',()=>{
 const results=parseSupplierSearchResults({web:{results:[
  {title:'Example item',url:'https://supplier.example.com/product/1?affiliate_token=secret',description:'Supplier listing'},
  {title:'Internal',url:'http://localhost/private',description:'Ignored'}
 ]}});
 assert.equal(results.length,1);
 assert.equal(results[0]?.url,'https://supplier.example.com/product/1');
});
