import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeReviewProvenance } from '../src/analysis/review-provenance';
import { calculateVerdict } from '../src/analysis/evidence-engine';
import { buildProductFingerprint, fingerprintSimilarity } from '../src/forensics/product-fingerprint';

test('duplicate burst reviews emit expected anomaly signals', () => {
  const reviews = [
    ...Array.from({length:5},()=>({rating:5,body:'Amazing quality and perfect product. Highly recommend to everyone.',date:'2026-09-01',verified:false})),
    ...Array.from({length:7},()=>({rating:5,body:'Great product, works as expected.',date:'2026-09-03',verified:false})),
  ];
  const signals=analyzeReviewProvenance({reviews,productTitle:'Portable LED Lantern'});
  const ids=new Set(signals.map(s=>s.id));
  assert(ids.has('LOW_VERIFIED_PURCHASE_SHARE'));
  assert(ids.has('REVIEW_DATE_BURST'));
  assert(ids.has('REVIEW_TEXT_DUPLICATION'));
});

test('weak signals alone cannot unlock severe warning', () => {
  const verdict=calculateVerdict([
    {
      id:'A',family:'scarcity',severity:'weak',confidence:1,weight:4,
      title:'x',explanation:'x',independentKey:'a',
    },
    {
      id:'B',family:'technology',severity:'info',confidence:1,weight:0,
      title:'x',explanation:'x',independentKey:'b',
    },
  ]);
  assert.equal(verdict.severeWarningAllowed,false);
});

test('review anomalies cannot corroborate a severe dropshipping accusation', () => {
  const verdict=calculateVerdict([
    {
      id:'A',family:'reviews',severity:'strong',confidence:.9,weight:20,
      title:'x',explanation:'x',independentKey:'review-dup',
    },
    {
      id:'B',family:'provenance',severity:'strong',confidence:.9,weight:20,
      title:'x',explanation:'x',independentKey:'upstream-id',
    },
  ]);
  assert.equal(verdict.severeWarningAllowed,false);
  assert.equal(verdict.massResellLikelihood,18);
});

test('technical fingerprints retain invariant overlap after marketing rewrite', () => {
  const a=buildProductFingerprint({
    title:'Premium Revolutionary USB-C Desk Lamp 4000mAh',
    description:'Aluminum body, 3W LED, 2700K light',
    mpn:'DL-4000-A',
  });
  const b=buildProductFingerprint({
    title:'Exclusive Luxury Portable Reading Light',
    description:'3W LED reading lamp with aluminum housing, 4000mAh battery, 2700K',
    mpn:'DL-4000-A',
  });
  assert(fingerprintSimilarity(a,b)>.5);
});

test('merchant complaints alone do not establish mass resale or dropshipping',()=>{
  const verdict=calculateVerdict([{
    id:'COMPLAINTS',family:'merchant',severity:'strong',confidence:1,weight:60,
    title:'Complaints',explanation:'Public reputation concerns',independentKey:'reputation:multi-source',
  }]);
  assert.equal(verdict.massResellLikelihood,null);
  assert.equal(verdict.dropshipLikelihood,null);
  assert.equal(verdict.severeWarningAllowed,false);
});

test('two independent strong provenance and fulfillment families can pass the gate',()=>{
  const verdict=calculateVerdict([
    {id:'UPSTREAM',family:'provenance',severity:'strong',confidence:1,weight:24,title:'x',explanation:'x',independentKey:'upstream'},
    {id:'FULFILLMENT',family:'fulfillment',severity:'strong',confidence:1,weight:24,title:'x',explanation:'x',independentKey:'route'},
  ]);
  assert.equal(verdict.severeWarningAllowed,true);
});


test('merchant complaints affect merchant risk but not deception or provenance',()=>{
  const verdict=calculateVerdict([{
    id:'COMPLAINTS',family:'merchant',severity:'strong',confidence:1,weight:60,
    title:'Complaints',explanation:'Public reputation concerns',independentKey:'reputation:multi-source',
  }]);
  assert.equal(verdict.massResellLikelihood,null);
  assert.equal(verdict.dropshipLikelihood,null);
  assert.equal(verdict.deceptionRisk,'unknown');
  assert.equal(verdict.merchantRisk,'moderate');
  assert.equal(verdict.manipulationRisk,'unknown');
  assert.equal(verdict.fulfillmentRisk,'unknown');
});

test('scarcity and review anomalies affect manipulation risk without proving dropshipping',()=>{
  const verdict=calculateVerdict([
    {id:'SCARCITY',family:'scarcity',severity:'moderate',confidence:1,weight:12,title:'x',explanation:'x',independentKey:'scarcity'},
    {id:'REVIEWS',family:'reviews',severity:'strong',confidence:1,weight:25,title:'x',explanation:'x',independentKey:'reviews'},
  ]);
  assert.equal(verdict.massResellLikelihood,null);
  assert.equal(verdict.dropshipLikelihood,null);
  assert.equal(verdict.manipulationRisk,'moderate');
  assert.equal(verdict.severeWarningAllowed,false);
});

test('fulfillment contradiction is visible separately from product provenance',()=>{
  const verdict=calculateVerdict([
    {id:'FULFILLMENT',family:'fulfillment',severity:'strong',confidence:1,weight:24,title:'x',explanation:'x',independentKey:'route'},
  ]);
  assert.equal(verdict.massResellLikelihood,null);
  assert.equal(verdict.dropshipLikelihood,16);
  assert.equal(verdict.fulfillmentRisk,'low');
  assert.equal(verdict.severeWarningAllowed,false);
});
