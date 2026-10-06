import assert from 'node:assert/strict';
import test from 'node:test';
import { parseFulfillmentObservation } from '../src/analysis/fulfillment-observation';

test('extracts explicit shipment origin and carrier',()=>{
  const result=parseFulfillmentObservation('Carrier: 4PX. Shipped from Shenzhen, China to Chicago, USA.');
  assert.match(result.origin ?? '',/Shenzhen/i);
  assert.equal(result.carrier,'4PX');
  assert.ok(result.confidence>=.7);
});

test('carrier alone stays low confidence',()=>{
  const result=parseFulfillmentObservation('USPS tracking number accepted.');
  assert.equal(result.origin,undefined);
  assert.equal(result.carrier,'USPS');
  assert.ok(result.confidence<.5);
});

test('does not invent an origin from generic shipping copy',()=>{
  const result=parseFulfillmentObservation('Free worldwide shipping. Estimated delivery 5 to 8 business days.');
  assert.equal(result.origin,undefined);
  assert.equal(result.confidence,0);
});


test('explicit origin wording is bounded and does not require a carrier',()=>{
  const result=parseFulfillmentObservation('Origin: Guangzhou, China. Package departed export facility.');
  assert.match(result.origin ?? '',/Guangzhou/i);
  assert.equal(result.carrier,undefined);
  assert.ok(result.confidence>=.7);
});
