import assert from 'node:assert/strict';
import test from 'node:test';
import { merchantNetworkEvidence, merchantNetworkForDomain } from '../src/intelligence/merchant-networks';
import { crossDomainReferenceEvidence, localMerchantNetworkEvidence } from '../src/analysis/merchant-network';
import type { DropShredderReport } from '../src/types/report';
import type { StoredObservation } from '../src/storage/history';

function report(domain:string,sku:string):DropShredderReport{
  return {
    version:1,
    product:{url:`https://${domain}/p`,domain,sku,imageUrls:[],jsonLdProductCount:1,capturedAt:'2026-10-06T00:00:00Z',claims:[],pageSignals:[]},
    merchant:{domain},evidence:[],contradictions:[],
    verdict:{massResellLikelihood:null,dropshipLikelihood:null,deceptionRisk:'unknown',merchantRisk:'unknown',manipulationRisk:'unknown',fulfillmentRisk:'unknown',severeWarningAllowed:false,reason:'test'},
  };
}

function obs(r:DropShredderReport):StoredObservation{
  return {id:crypto.randomUUID(),identityKey:'x',capturedAt:r.product.capturedAt,domain:r.product.domain,url:r.product.url,report:r};
}

test('ships known HaremPants / Sure Design network out of box',()=>{
  assert.equal(merchantNetworkForDomain('harempants.com')?.id,'harempants-suredesign');
  assert.equal(merchantNetworkForDomain('suredesigntshirts.com')?.id,'harempants-suredesign');
  assert.equal(merchantNetworkEvidence('harempants.com')[0]?.severity,'strong');
});

test('exact shared SKU across domains is strong network evidence',()=>{
  const current=report('harempants.com','GPH42-Black');
  const other=report('suredesigntshirts.com','GPH42-Black');
  const evidence=localMerchantNetworkEvidence(current.product,[obs(other)]);
  assert.equal(evidence[0]?.severity,'strong');
});

test('explicit cross-domain merchant reference is moderate evidence',()=>{
  const evidence=crossDomainReferenceEvidence(
    'suredesigntshirts.com',
    'Free International Shipping at HaremPants.com',
    ['harempants.com','suredesigntshirts.com']
  );
  assert.equal(evidence[0]?.severity,'moderate');
});
