import assert from 'node:assert/strict';
import test from 'node:test';
import { merchantNetworkEvidence, merchantNetworkForDomain, merchantNetworkIsFresh } from '../src/intelligence/merchant-networks';
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

test('store-local SKU across domains cannot establish a merchant network',()=>{
  const current=report('harempants.com','GPH42-Black');
  const other=report('suredesigntshirts.com','GPH42-Black');
  const evidence=localMerchantNetworkEvidence(current.product,[obs(other)]);
  assert.equal(evidence.length,0);
});

test('explicit cross-domain merchant reference is moderate evidence',()=>{
  const evidence=crossDomainReferenceEvidence(
    'suredesigntshirts.com',
    'Free International Shipping at HaremPants.com',
    ['harempants.com','suredesigntshirts.com']
  );
  assert.equal(evidence[0]?.severity,'moderate');
});


test('seed registry recognizes current active networks',()=>{
  for(const domain of [
    'justfashionnow.com','noracora.com','stylewe.com',
    'modlily.com','rotita.com','rosewe.com',
    'lightinthebox.com','ador.com','ezbuy.sg'
  ]){
    assert.ok(merchantNetworkForDomain(domain),`missing network for ${domain}`);
  }
});

test('stale network records automatically downgrade',()=>{
  const network=merchantNetworkForDomain('justfashionnow.com');
  assert.ok(network);
  assert.equal(merchantNetworkIsFresh(network!,new Date('2026-10-20T00:00:00Z')),true);
  assert.equal(merchantNetworkIsFresh(network!,new Date('2027-03-01T00:00:00Z')),false);
  const evidence=merchantNetworkEvidence('justfashionnow.com',new Date('2027-03-01T00:00:00Z'));
  assert.equal(evidence[0]?.severity,'info');
  assert.match(evidence[0]?.explanation ?? '',/freshness/i);
});

test('GearLaunch stays informational/watch-level instead of inheriting platform complaints',()=>{
  const evidence=merchantNetworkEvidence('gearlaunch.com',new Date('2026-10-06T00:00:00Z'));
  assert.equal(evidence[0]?.severity,'info');
});


test('large seed corpus ships dozens of consumer-facing domains',async()=>{
  const {MERCHANT_NETWORKS}=await import('../src/intelligence/merchant-networks');
  const domains=new Set(MERCHANT_NETWORKS.flatMap(network=>network.domains));
  assert.ok(MERCHANT_NETWORKS.length>=15,`expected >=15 networks, got ${MERCHANT_NETWORKS.length}`);
  assert.ok(domains.size>=60,`expected >=60 domains, got ${domains.size}`);
});

test('transparent corporate groups do not get sister-store strong weighting',()=>{
  const wayfair=merchantNetworkEvidence('wayfair.com',new Date('2026-10-06T00:00:00Z'));
  assert.equal(wayfair[0]?.severity,'moderate');
  assert.match(wayfair[0]?.title ?? '',/Related commerce network/);
  const chicv=merchantNetworkEvidence('noracora.com',new Date('2026-10-06T00:00:00Z'));
  assert.equal(chicv[0]?.severity,'strong');
  assert.match(chicv[0]?.title ?? '',/sister-store/i);
});
