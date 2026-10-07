import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePriceHistory } from '../src/analysis/price-manipulation';

test('catches a price increase introduced as a discount',()=>{
 const f=analyzePriceHistory([
  {at:'2026-01-01',price:29.99},
  {at:'2026-01-02',price:34.99,referencePrice:59.99},
 ]);
 assert.equal(f[0]?.id,'PRICE_RISE_FRAMED_AS_DISCOUNT');
 assert.equal(f[0]?.severity,'strong');
});

test('does not condemn an ordinary price drop',()=>{
 const f=analyzePriceHistory([
  {at:'2026-01-01',price:39.99,referencePrice:49.99},
  {at:'2026-01-02',price:29.99,referencePrice:49.99},
 ]);
 assert.equal(f.some(x=>x.id==='PRICE_RISE_FRAMED_AS_DISCOUNT'),false);
});

test('detects a persistent sale state only with enough history',()=>{
 const f=analyzePriceHistory([
  {at:'2026-01-01',price:30,referencePrice:60},
  {at:'2026-01-02',price:31,referencePrice:60},
  {at:'2026-01-03',price:29,referencePrice:60},
  {at:'2026-01-04',price:30,referencePrice:60},
  {at:'2026-01-05',price:30,referencePrice:60},
 ]);
 assert.equal(f.some(x=>x.id==='PERSISTENT_SALE_STATE'),true);
});
