import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewIntegrity } from '../src/analysis/review-integrity';

test('keeps ordinary varied reviews',()=>{
  const r=reviewIntegrity([
    {body:'Battery life has been good for my commute.',rating:5,verified:true},
    {body:'Fits my desk and the controls are easy to use.',rating:4,verified:true},
    {body:'Shipping took a week but the item works.',rating:4,verified:true},
  ],'Desk lamp');
  assert.equal(r.flagged,0);
  assert.equal(r.passedPercent,100);
  assert.equal(r.adjustedRating,r.displayedRating);
});

test('flags copied review wording and recalculates rating',()=>{
  const copied='Amazing premium product works perfectly and I absolutely recommend this purchase to everyone';
  const r=reviewIntegrity([
    {body:copied,rating:5},
    {body:copied+'!',rating:5},
    {body:'It broke after three days and support never replied.',rating:1,verified:true},
  ],'Portable charger');
  assert.equal(r.flagged,2);
  assert.equal(r.passed,1);
  assert.equal(r.passedPercent,33);
  assert.equal(r.adjustedRating,1);
  assert.ok((r.displayedRating??0)>r.adjustedRating!);
});

test('one unverified review is not automatically called fake',()=>{
  const r=reviewIntegrity([{body:'Works as expected and arrived on time.',rating:5,verified:false}]);
  assert.equal(r.flagged,0);
});

test('wrong-product review is a strong flag',()=>{
  const r=reviewIntegrity([{body:'This necklace clasp is beautiful.',rating:5,verified:true}],'Portable charger');
  assert.equal(r.flagged,1);
  assert.ok(r.items[0]!.flags.includes('wrong-product'));
});
