import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewIntegrity } from '../src/analysis/review-integrity';

test('verified purchase does not override copied-review evidence',()=>{
  const body='Amazing premium product works perfectly and I absolutely recommend this purchase to everyone';
  const r=reviewIntegrity([
    {body,rating:5,verified:true},
    {body:body+'!',rating:5,verified:true},
  ]);
  assert.equal(r.flagged,2);
});

test('rich-looking long reviews can still be flagged when their wording is copied',()=>{
  const body='I used this product for several weeks before writing this detailed review. The build quality feels excellent and the controls work perfectly for my daily routine. I would absolutely recommend this purchase to friends and family.';
  const r=reviewIntegrity([
    {body,rating:5,verified:true},
    {body:body+' Great value.',rating:5,verified:true},
  ]);
  assert.equal(r.flagged,2);
});

test('strong rating-text conflict contributes suspicion without alone condemning review',()=>{
  const r=reviewIntegrity([
    {body:'Broken junk. It failed immediately and I asked for a refund.',rating:5,verified:true},
  ]);
  assert.ok(r.items[0]!.flags.includes('rating-text-conflict'));
  assert.equal(r.flagged,0);
});
