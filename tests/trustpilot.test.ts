import assert from 'node:assert/strict';
import test from 'node:test';
import { parseTrustpilotHtml } from '../src/reputation/trustpilot';

test('script/style content with spaced, attributed or missing end tags cannot fabricate complaints',()=>{
  const visible='<body>Trustpilot TrustScore 4.8 out of 5 100 reviews.</body>';
  for(const hidden of ['<script>Counterfeit and never received.</script >','<style>Flimsy and broken.</style\n >','<script>Wrong item.</script data-x="1">','<script>Refund never received.']){
    const observation=parseTrustpilotHtml(visible+hidden,'https://www.trustpilot.com/review/example.com')!;
    assert.equal(observation.rating,4.8);assert.deepEqual(observation.snippets,[]);
  }
});

test('HTML entities are decoded once and escaped complaint-like markup stays literal text',()=>{
  const observation=parseTrustpilotHtml('<body>Trustpilot TrustScore 4.8 out of 5 100 reviews. Return &amp;quot;parcel&amp;quot; &amp;#39;label&amp;#39; &#39;one&#39; &#x27;two&#x27; &lt;b&gt;.</body>','https://www.trustpilot.com/review/example.com')!;
  assert.equal(observation.snippets?.[0],"Return &quot;parcel&quot; &#39;label&#39; 'one' 'two' <b>.");
});
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
