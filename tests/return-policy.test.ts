import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeReturnPolicy } from '../src/analysis/return-policy';

test('customer-paid international return is moderate merchant-risk evidence',()=>{
  const evidence=analyzeReturnPolicy('Customers are responsible for international return shipping costs.');
  assert.equal(evidence[0]?.id,'INTERNATIONAL_RETURN_AT_CUSTOMER_COST');
  assert.equal(evidence[0]?.severity,'moderate');
});

test('small restocking fee stays weak',()=>{
  const evidence=analyzeReturnPolicy('A 10% restocking fee applies to opened items.');
  assert.equal(evidence[0]?.id,'RESTOCKING_FEE');
  assert.equal(evidence[0]?.severity,'weak');
});

test('large restocking fee escalates to moderate',()=>{
  const evidence=analyzeReturnPolicy('A restocking fee of 25% applies to returns.');
  assert.equal(evidence[0]?.id,'RESTOCKING_FEE');
  assert.equal(evidence[0]?.severity,'moderate');
});

test('ordinary 30-day return policy does not trigger short-window rule',()=>{
  const evidence=analyzeReturnPolicy('Returns accepted within 30 days of delivery.');
  assert.equal(evidence.some(x=>x.id==='VERY_SHORT_RETURN_WINDOW'),false);
});
