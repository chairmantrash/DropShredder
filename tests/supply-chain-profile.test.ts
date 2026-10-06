import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSupplyChainProfile } from '../src/analysis/supply-chain-profile';

test('foreign manufacture plus US fulfillment is mixed, not Made in USA',()=>{
  const profile=buildSupplyChainProfile({
    mainPageText:'Made in China.',
    pages:[
      {kind:'about',url:'https://x/about',text:'We are based in United States.'},
      {kind:'shipping',url:'https://x/shipping',text:'Orders ship from United States.'},
      {kind:'returns',url:'https://x/returns',text:'Returns accepted in United States.'},
    ],
  });
  assert.equal(profile.classification,'mixed-us-international');
});

test('known material chain outside US can be entirely international',()=>{
  const profile=buildSupplyChainProfile({
    mainPageText:'Manufactured in China.',
    pages:[
      {kind:'about',url:'https://x/about',text:'We are based in Hong Kong.'},
      {kind:'shipping',url:'https://x/shipping',text:'Orders ship from China.'},
      {kind:'returns',url:'https://x/returns',text:'Return address: Shenzhen, China.'},
    ],
    paymentProcessors:['PayPal'],
  });
  assert.equal(profile.classification,'known-chain-entirely-international');
  assert.equal(profile.paymentJurisdictionKnown,false);
});

test('Made in USA remains a claim unless independently verified',()=>{
  const profile=buildSupplyChainProfile({
    mainPageText:'Made in USA.',
    pages:[],
  });
  assert.equal(profile.classification,'us-origin-claimed');
  assert.match(profile.preferenceNote,/not independently verified/i);
});
