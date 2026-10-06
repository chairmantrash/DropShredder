import assert from 'node:assert/strict';
import test from 'node:test';
import { parseTrustpilotHtml } from '../src/reputation/trustpilot';
import { analyzeReputationObservations } from '../src/reputation/complaint-analysis';

test('parses Trustpilot score, volume, one-star share and complaints',()=>{
  const html='<html><body>Trustpilot TrustScore 3.4 out of 5 69 reviews 5-star 61% 4-star 4% 3-star 6% 2-star 3% 1-star 26%. Flimsy stitching and poor quality. Return process was difficult. Product never received.</body></html>';
  const observation=parseTrustpilotHtml(html,'https://www.trustpilot.com/review/example.com');
  assert.equal(observation?.rating,3.4);
  assert.equal(observation?.reviewCount,69);
  assert.equal(observation?.negativeShare,.26);
  assert.ok((observation?.snippets?.length ?? 0)>=2);
});

test('20 percent one-star share at meaningful volume is elevated',()=>{
  const observation=parseTrustpilotHtml(
    '<body>Trustpilot TrustScore 3.4 out of 5 69 reviews 1-star 26%</body>',
    'https://www.trustpilot.com/review/example.com'
  );
  assert.ok(observation);
  const evidence=analyzeReputationObservations([observation!]);
  assert.equal(evidence[0]?.severity,'moderate');
});
