import assert from 'node:assert/strict';
import test from 'node:test';
import { imageHistoryEvidence } from '../src/forensics/image-history';
import { upstreamCandidateEvidence } from '../src/analysis/upstream-candidate';
import type { DropShredderReport } from '../src/types/report';
import type { StoredObservation } from '../src/storage/history';

function report(domain:string,capturedAt:string,sha256:string):DropShredderReport {
  return {
    version:1,
    product:{
      url:`https://${domain}/p/1`,
      domain,
      imageUrls:['https://img.example/p.jpg'],
      jsonLdProductCount:1,
      capturedAt,
      claims:[],
      pageSignals:[],
      imageFingerprints:[{
        url:'https://img.example/p.jpg',
        sha256,
        ahash:'10101010'.repeat(8),
        dhash:'11001100'.repeat(8),
        width:800,
        height:800,
        capturedAt,
      }],
    },
    merchant:{domain},
    evidence:[],
    contradictions:[],
    verdict:{
      massResellLikelihood:null,
      dropshipLikelihood:null,
      deceptionRisk:'unknown',
      merchantRisk:'unknown',
      manipulationRisk:'unknown',
      fulfillmentRisk:'unknown',
      severeWarningAllowed:false,
      reason:'test',
    },
  };
}

function observation(domain:string,capturedAt:string,sha256:string):StoredObservation {
  const value=report(domain,capturedAt,sha256);
  return {
    id:`${domain}-${capturedAt}`,
    identityKey:`url:${value.product.url}`,
    capturedAt,
    domain,
    url:value.product.url,
    report:value,
  };
}

test('same-domain image history stays informational',()=>{
  const current=report('shop.example','2026-10-06T12:00:00Z','abc').product;
  const evidence=imageHistoryEvidence(current,[observation('shop.example','2026-10-01T12:00:00Z','abc')]);
  assert.equal(evidence.length,1);
  assert.equal(evidence[0]?.severity,'info');
  assert.equal(evidence[0]?.weight,0);
});

test('cross-domain exact image history is moderate, not automatic proof',()=>{
  const current=report('seller.example','2026-10-06T12:00:00Z','abc').product;
  const evidence=imageHistoryEvidence(current,[observation('other.example','2026-09-01T12:00:00Z','abc')]);
  assert.equal(evidence.length,1);
  assert.equal(evidence[0]?.severity,'moderate');
  assert.ok((evidence[0]?.weight ?? 0)>0);
});

test('older upstream listing needs independent corroboration for strong evidence',()=>{
  const weak=upstreamCandidateEvidence({
    sourceUrl:'https://supplier.example/item',
    sourceDomain:'supplier.example',
    observedAt:'2026-01-01T00:00:00Z',
    imageMatch:'exact',
    technicalSimilarity:.4,
    sourceType:'wholesale',
  },'2026-10-06T00:00:00Z');
  assert.equal(weak[0]?.severity,'moderate');

  const strong=upstreamCandidateEvidence({
    sourceUrl:'https://supplier.example/item',
    sourceDomain:'supplier.example',
    observedAt:'2026-01-01T00:00:00Z',
    identifiersMatched:['MPN-1234'],
    imageMatch:'exact',
    technicalSimilarity:.9,
    sourceType:'manufacturer',
  },'2026-10-06T00:00:00Z');
  assert.equal(strong[0]?.severity,'strong');
});

test('later related listing cannot establish upstream provenance',()=>{
  const evidence=upstreamCandidateEvidence({
    sourceUrl:'https://market.example/item',
    sourceDomain:'market.example',
    observedAt:'2026-12-01T00:00:00Z',
    identifiersMatched:['SKU-9'],
    imageMatch:'exact',
    technicalSimilarity:.95,
  },'2026-10-06T00:00:00Z');
  assert.equal(evidence[0]?.severity,'info');
  assert.equal(evidence[0]?.weight,0);
});
