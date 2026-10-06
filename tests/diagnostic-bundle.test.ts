import assert from 'node:assert/strict';
import test from 'node:test';
import { buildDiagnosticBundle, diagnosticFilename } from '../src/diagnostics/bundle';
import type { DropShredderReport } from '../src/types/report';

const report:DropShredderReport={
  version:1,
  product:{
    url:'https://shop.example/products/widget?utm_source=x#reviews',
    domain:'shop.example',
    canonicalUrl:'https://shop.example/products/widget?variant=123',
    title:'Widget',
    imageUrls:[],
    jsonLdProductCount:0,
    capturedAt:'2026-10-06T00:00:00Z',
    claims:[],
    pageSignals:[],
  },
  merchant:{domain:'shop.example'},
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

test('diagnostic bundle strips query/hash and records unknown hosts',()=>{
  const bundle=buildDiagnosticBundle({
    report,
    page:{
      url:report.product.url,
      scriptSources:['https://cdn.unknown-platform.example/app.js','https://www.googletagmanager.com/gtm.js'],
      imageUrls:['https://img.unknown-cdn.example/p.jpg'],
      siteLinkKinds:['shipping'],
      catalog:{cardCount:12,saleCardCount:8},
      visibleReviewCount:0,
      jsonLdProductCount:0,
    },
    settings:{autoSourceHunt:false,autoReputationSweep:false,preferMadeInUSA:false},
    detectedPlatforms:[],
    paymentProcessors:[],
    durationMs:123.4,
    extensionVersion:'0.1.0',
    userAgent:'test-agent',
    language:'en-US',
  });

  assert.equal(bundle.scan.pageUrl,'https://shop.example/products/widget');
  assert.deepEqual(bundle.discovery.unknownScriptHosts,['cdn.unknown-platform.example']);
  assert.ok(bundle.discovery.notes.some(note=>/No bundled commerce platform/.test(note)));
  assert.ok(bundle.discovery.notes.some(note=>/No stable GTIN/.test(note)));
});

test('diagnostic filename is portable and domain-scoped',()=>{
  const filename=diagnosticFilename('shop.example','2026-10-06T17:30:00.000Z');
  assert.match(filename,/^dropshredder-diagnostic-shop\.example-/);
  assert.ok(filename.endsWith('.json'));
});
