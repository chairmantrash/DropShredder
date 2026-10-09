import assert from 'node:assert/strict';
import test from 'node:test';
import { productMutationEvidence } from '../src/analysis/product-mutation';
import type { DropShredderReport } from '../src/types/report';
import type { StoredObservation } from '../src/storage/history';

function report(url:string,gtin:string,fingerprint:string,hash:string,date:string):DropShredderReport{
  const domain=new URL(url).hostname;
  return {
    version:1,
    product:{
      url,canonicalUrl:url,domain,title:'Product',gtin,
      technicalFingerprint:fingerprint,
      imageUrls:[],jsonLdProductCount:1,capturedAt:date,claims:[],pageSignals:[],
      imageFingerprints:[{url:'https://img.example/x',sha256:hash,ahash:'0'.repeat(64),dhash:'1'.repeat(64),width:800,height:800,capturedAt:date}],
    },
    merchant:{domain},evidence:[],contradictions:[],
    verdict:{massResellLikelihood:null,dropshipLikelihood:null,deceptionRisk:'unknown',merchantRisk:'unknown',manipulationRisk:'unknown',fulfillmentRisk:'unknown',severeWarningAllowed:false,reason:'test'},
  };
}

function obs(r:DropShredderReport):StoredObservation{
  return {id:crypto.randomUUID(),identityKey:'x',capturedAt:r.product.capturedAt,domain:r.product.domain,url:r.product.url,report:r};
}

test('one changed dimension does not trigger listing mutation',()=>{
  const old=report('https://shop.example/products/widget','012345678905','same','img','2026-01-01T00:00:00Z');
  const now=report('https://shop.example/products/widget','4006381333931','same','img','2026-10-06T00:00:00Z');
  assert.equal(productMutationEvidence(now.product,[obs(old)]).length,0);
});

test('multiple identity changes trigger listing mutation evidence',()=>{
  const old=report('https://shop.example/products/widget','012345678905','fp-old','img-old','2026-01-01T00:00:00Z');
  const now=report('https://shop.example/products/widget','4006381333931','fp-new','img-new','2026-10-06T00:00:00Z');
  const evidence=productMutationEvidence(now.product,[obs(old)]);
  assert.equal(evidence.length,1);
  assert.equal(evidence[0]?.severity,'strong');
});
