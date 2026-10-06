import assert from 'node:assert/strict';
import test from 'node:test';
import { indexedSourceEvidence } from '../src/analysis/source-match';
import { analyzeReputationObservations } from '../src/reputation/complaint-analysis';
import type { DropShredderReport } from '../src/types/report';
import type { StoredObservation } from '../src/storage/history';

function baseReport(domain:string, technicalFingerprint?:string, sha256?:string):DropShredderReport{
  return {
    version:1,
    product:{
      url:`https://${domain}/p`,
      domain,
      imageUrls:[],
      jsonLdProductCount:1,
      capturedAt:'2026-10-06T00:00:00Z',
      claims:[],
      pageSignals:[],
      technicalFingerprint,
      imageFingerprints:sha256?[{
        url:'https://img.example/p.jpg',
        sha256,
        ahash:'0'.repeat(64),
        dhash:'0'.repeat(64),
        width:800,
        height:800,
        capturedAt:'2026-10-06T00:00:00Z',
      }]:[],
    },
    merchant:{domain},
    evidence:[],
    contradictions:[],
    verdict:{
      massResellLikelihood:null,
      dropshipLikelihood:null,
      deceptionRisk:'unknown',
      severeWarningAllowed:false,
      reason:'test',
    },
  };
}

function obs(report:DropShredderReport):StoredObservation{
  return {
    id:crypto.randomUUID(),
    identityKey:'test',
    capturedAt:report.product.capturedAt,
    domain:report.product.domain,
    url:report.product.url,
    report,
  };
}

test('single source characteristic stays moderate',()=>{
  const current=baseReport('store.example','fp-1');
  const source=baseReport('aliexpress.com','fp-1');
  const evidence=indexedSourceEvidence(current.product,[obs(source)]);
  assert.equal(evidence.length,1);
  assert.equal(evidence[0]?.severity,'moderate');
});

test('two independent source characteristics can become strong',()=>{
  const current=baseReport('store.example','fp-1','abc');
  const source=baseReport('aliexpress.com','fp-1','abc');
  const evidence=indexedSourceEvidence(current.product,[obs(source)]);
  assert.equal(evidence.length,1);
  assert.equal(evidence[0]?.severity,'strong');
});

test('one complaint source is moderate only',()=>{
  const evidence=analyzeReputationObservations([{
    source:'Trustpilot',
    rating:1.9,
    reviewCount:120,
    url:'https://example.invalid',
  }]);
  assert.equal(evidence.length,1);
  assert.equal(evidence[0]?.severity,'moderate');
});

test('multiple independent complaint sources can become strong',()=>{
  const evidence=analyzeReputationObservations([
    {source:'Trustpilot',rating:1.9,reviewCount:120,url:'https://example.invalid/a'},
    {source:'Sitejabber',rating:2.1,reviewCount:80,url:'https://example.invalid/b'},
  ]);
  assert.equal(evidence.some(item=>item.severity==='strong'),true);
});

test('small review samples do not trigger rating warning',()=>{
  const evidence=analyzeReputationObservations([{
    source:'Trustpilot',
    rating:1.0,
    reviewCount:4,
    url:'https://example.invalid',
  }]);
  assert.equal(evidence.length,0);
});

test('duplicate pages from one review platform do not count as independent sources',()=>{
  const evidence=analyzeReputationObservations([
    {source:'Trustpilot',rating:1.7,reviewCount:200,url:'https://example.invalid/a'},
    {source:'trustpilot',rating:1.8,reviewCount:100,url:'https://example.invalid/b'},
  ]);
  assert.equal(evidence.length,1);
  assert.equal(evidence[0]?.severity,'moderate');
});

test('one snippet containing multiple keywords is not treated as substantial complaints',()=>{
  const evidence=analyzeReputationObservations([{
    source:'Forums',snippets:['refund wrong item never arrived'],url:'https://example.invalid/post',
  }]);
  assert.equal(evidence.length,0);
});
