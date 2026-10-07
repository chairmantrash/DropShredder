import test from 'node:test';
import assert from 'node:assert/strict';
import { fuseEvidence } from '../src/analysis/evidence-fusion';

test('missing evidence is unknown rather than clean',()=>{
  assert.equal(fuseEvidence([],[]).verdict,'not-enough-data');
});

test('many correlated clues in one family do not create a strong verdict',()=>{
 const items=Array.from({length:12},(_,i)=>({id:String(i),family:'reviews',strength:'moderate' as const,score:.55,sourceKey:'store',independenceKey:'same-campaign'}));
 const r=fuseEvidence(items,['reviews']);
 assert.notEqual(r.verdict,'strong-red-flags');
});

test('independent strong evidence families can escalate',()=>{
 const r=fuseEvidence([
  {id:'a',family:'identity',strength:'strong',score:.9,sourceKey:'supplier-a',independenceKey:'exact-gtin'},
  {id:'b',family:'claims',strength:'strong',score:.9,sourceKey:'regulator-b',independenceKey:'origin-contradiction'},
  {id:'c',family:'returns',strength:'moderate',score:.7,sourceKey:'store-policy',independenceKey:'return-address'},
 ],['identity','claims','returns']);
 assert.equal(r.verdict,'strong-red-flags');
});

test('one source repeated across families cannot satisfy source independence',()=>{
 const r=fuseEvidence([
  {id:'a',family:'identity',strength:'strong',score:.95,sourceKey:'same-feed',independenceKey:'id'},
  {id:'b',family:'claims',strength:'strong',score:.95,sourceKey:'same-feed',independenceKey:'claim'},
 ],['identity','claims']);
 assert.notEqual(r.verdict,'strong-red-flags');
});
