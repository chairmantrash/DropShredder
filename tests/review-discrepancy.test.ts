import assert from 'node:assert/strict';
import test from 'node:test';
import { reviewDiscrepancyEvidence } from '../src/reputation/review-discrepancy';

test('large hosted-vs-independent rating gap is surfaced',()=>{
  const evidence=reviewDiscrepancyEvidence(
    {rating:4.7,reviewCount:10000,source:'Store-hosted'},
    {source:'Trustpilot',rating:3.4,reviewCount:69,url:'https://example.invalid'}
  );
  assert.equal(evidence[0]?.severity,'moderate');
});

test('small samples do not create discrepancy warning',()=>{
  const evidence=reviewDiscrepancyEvidence(
    {rating:5,reviewCount:4,source:'Store-hosted'},
    {source:'Trustpilot',rating:2,reviewCount:5,url:'https://example.invalid'}
  );
  assert.equal(evidence.length,0);
});
