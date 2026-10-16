import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExactProductFingerprint,compareExactProductFingerprints } from '../src/forensics/product-fingerprint';

test('exact GTIN establishes exact identity',()=>{
 const a=buildExactProductFingerprint({gtin:'0 12345-67890 5',title:'Fancy Lamp'});
 const b=buildExactProductFingerprint({gtin:'012345678905',title:'Renamed Lamp'});
 const r=compareExactProductFingerprints(a,b);
 assert.equal(r.exactIdentity,true);assert.equal(r.score,1);
});
test('similar titles alone stay weak',()=>{
 const a=buildExactProductFingerprint({title:'Portable rechargeable camping lantern'});
 const b=buildExactProductFingerprint({title:'Portable rechargeable camping lantern light'});
 const r=compareExactProductFingerprints(a,b);
 assert.ok(r.score<.5);assert.equal(r.exactIdentity,false);
});
test('brand model images and specs combine without claiming exact GTIN identity',()=>{
 const a=buildExactProductFingerprint({brand:'Acme',mpn:'X-10',imageHashes:['abc'],specs:{wattage:'10W',material:'ABS',height:'20cm'}});
 const b=buildExactProductFingerprint({brand:'ACME',mpn:'X10',imageHashes:['abc'],specs:{wattage:'10W',material:'ABS',height:'20cm'}});
 const r=compareExactProductFingerprints(a,b);
 assert.ok(r.score>=.9);assert.equal(r.exactIdentity,false);
});
