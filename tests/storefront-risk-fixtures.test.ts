import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeMerchantOrigin } from '../src/analysis/merchant-origin';
import { catalogEvidence } from '../src/analysis/catalog-signals';
import { analyzeReputationObservations } from '../src/reputation/complaint-analysis';
import { qualityClaimEvidence } from '../src/analysis/quality-claims';
import { reviewDiscrepancyEvidence } from '../src/reputation/review-discrepancy';
import { calculateVerdict } from '../src/analysis/evidence-engine';

test('explicit cross-border returns and pervasive-sale pattern remain visible without scoring policy placement',()=>{
  const origin=analyzeMerchantOrigin(
    'Premium western-inspired apparel. Free shipping.',
    [
      {kind:'about',url:'https://shop.example/about',text:'Company address: Kowloon, Hong Kong.'},
      {kind:'shipping',url:'https://shop.example/shipping',text:'Orders are processed internationally.'},
      {kind:'returns',url:'https://shop.example/returns',text:'Return address: Shenzhen, China.'},
    ],
  );
  const evidence=[
    ...origin.evidence,
    ...catalogEvidence({cardCount:30,saleCardCount:27}),
  ];
  const verdict=calculateVerdict(evidence);

  assert.equal(origin.evidence.some(e=>e.id==='MERCHANT_ORIGIN_BURIED_IN_SECONDARY_PAGES'),true);
  assert.equal(origin.evidence.some(e=>e.id==='RETURN_JURISDICTION_DIFFERS'),true);
  assert.equal(origin.evidence.find(e=>e.id==='MERCHANT_ORIGIN_BURIED_IN_SECONDARY_PAGES')?.weight,0);
  assert.equal(verdict.merchantRisk,'low');
  assert.notEqual(verdict.deceptionRisk,'unknown');
  assert.equal(verdict.severeWarningAllowed,false);
});

test('HaremPants-like explicit origin + independent quality complaints raises manipulation risk without nationality penalty',()=>{
  const origin=analyzeMerchantOrigin(
    'Based in Chiang Mai, Thailand. Premium quality handcrafted clothing.',
    [
      {kind:'shipping',url:'https://shop.example/shipping',text:'Orders ship from Chiang Mai, Thailand.'},
      {kind:'returns',url:'https://shop.example/returns',text:'Returns go to Chiang Mai, Thailand.'},
    ],
  );
  const external={
    source:'Trustpilot',
    rating:3.4,
    reviewCount:69,
    negativeShare:.26,
    url:'https://www.trustpilot.com/review/shop.example',
    snippets:[
      'Flimsy stitching and pants ripped after first wear.',
      'The material is awful and cheap material.',
      'Elastic broke and seams started to fray.',
      'High priced junk clothing.',
    ],
  };
  const evidence=[
    ...origin.evidence,
    ...analyzeReputationObservations([external]),
    ...qualityClaimEvidence('Premium quality handcrafted clothing.',[external]),
    ...reviewDiscrepancyEvidence(
      {rating:4.7,reviewCount:10000,source:'Store-hosted structured reviews'},
      external,
    ),
  ];
  const verdict=calculateVerdict(evidence);

  assert.equal(origin.evidence.some(e=>e.id==='MERCHANT_ORIGIN_BURIED_IN_SECONDARY_PAGES'),false);
  assert.equal(verdict.manipulationRisk,'low');
  assert.equal(verdict.merchantRisk,'unknown'); // Same external source contributes once across evidence families.
  assert.equal(verdict.massResellLikelihood,null);
  assert.equal(verdict.severeWarningAllowed,false);
});


test('legitimate domestic manufacturer control stays low risk',()=>{
  const origin=analyzeMerchantOrigin(
    'We design and manufacture our cookware in Pittsburgh, United States.',
    [
      {kind:'about',url:'https://maker.example/about',text:'We are based in Pittsburgh, United States. Made in United States.'},
      {kind:'shipping',url:'https://maker.example/shipping',text:'Orders ship from Pittsburgh, United States.'},
      {kind:'returns',url:'https://maker.example/returns',text:'Returns go to Pittsburgh, United States.'},
    ],
  );
  const verdict=calculateVerdict(origin.evidence);
  assert.equal(verdict.severeWarningAllowed,false);
  assert.equal(verdict.massResellLikelihood,null);
  assert.equal(verdict.dropshipLikelihood,null);
  assert.equal(verdict.merchantRisk,'unknown');
});

test('plainly disclosed overseas reseller control is not treated as deception',()=>{
  const origin=analyzeMerchantOrigin(
    'We are based in Toronto, Canada. Some products ship from partner warehouses in China.',
    [
      {kind:'about',url:'https://reseller.example/about',text:'We are based in Toronto, Canada.'},
      {kind:'shipping',url:'https://reseller.example/shipping',text:'Orders ship from Canada or China depending on stock.'},
      {kind:'returns',url:'https://reseller.example/returns',text:'Returns go to Toronto, Canada.'},
    ],
  );
  const verdict=calculateVerdict(origin.evidence);
  assert.equal(origin.evidence.some(e=>e.id==='MERCHANT_ORIGIN_BURIED_IN_SECONDARY_PAGES'),false);
  assert.equal(verdict.severeWarningAllowed,false);
  assert.equal(verdict.deceptionRisk,'unknown');
});
