import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeAmazonPage } from '../src/adapters/amazon';
import { analyzeEtsyPage } from '../src/adapters/etsy';
import { analyzeWalmartPage } from '../src/adapters/walmart';

test('Amazon seller and ships-from disclosures remain informational',()=>{
 const r=analyzeAmazonPage('Sold by Honest Merchant\nShips from Amazon.com');
 assert.equal(r.productPatch.seller,'Honest Merchant');
 assert.equal(r.evidence.every(x=>x.weight===0),true);
 assert.equal(r.evidence.some(x=>x.family==='fulfillment'),true);
});

test('Etsy handmade claim does not accuse without contradiction',()=>{
 const r=analyzeEtsyPage('Handmade by us in our workshop. Production partner: Local Printer.');
 assert.equal(r.evidence.length,2);
 assert.equal(r.evidence.every(x=>x.weight===0),true);
 assert.ok(r.claims.includes('seller-handmade-or-maker-claim'));
 assert.ok(r.claims.includes('production-partner-disclosure'));
});

test('Walmart third-party seller status alone has no accusation weight',()=>{
 const r=analyzeWalmartPage('Sold and shipped by Example Seller');
 assert.equal(r.productPatch.seller,'Example Seller');
 assert.equal(r.evidence[0]?.weight,0);
});
