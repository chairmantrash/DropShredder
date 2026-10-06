import assert from 'node:assert/strict';
import test from 'node:test';
import { qualityClaimEvidence } from '../src/analysis/quality-claims';

test('repeated independent quality complaints conflict with explicit premium claim',()=>{
  const evidence=qualityClaimEvidence('Premium quality handcrafted clothing made to last.',[{
    source:'Trustpilot',rating:3.4,reviewCount:69,negativeShare:.26,url:'https://example.invalid',
    snippets:[
      'Flimsy stitching and pants ripped after first wear.',
      'The material is awful and cheap material.',
      'Elastic broke and seams started to fray.',
      'High priced junk clothing.',
    ],
  }]);
  assert.equal(evidence[0]?.id,'QUALITY_MARKETING_CONFLICT');
  assert.equal(evidence[0]?.severity,'strong');
});

test('quality complaints without merchant quality claim do not create contradiction',()=>{
  const evidence=qualityClaimEvidence('Colorful pants and free shipping.',[{
    source:'Trustpilot',reviewCount:100,url:'https://example.invalid',
    snippets:['poor quality','flimsy stitching'],
  }]);
  assert.equal(evidence.length,0);
});
