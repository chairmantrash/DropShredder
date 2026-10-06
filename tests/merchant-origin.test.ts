import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeMerchantOrigin } from '../src/analysis/merchant-origin';

test('foreign geography alone is informational when plainly disclosed',()=>{
  const result=analyzeMerchantOrigin(
    'We are based in Chiang Mai, Thailand. Made in Thailand.',
    [{kind:'shipping',url:'https://x/shipping',text:'Orders ship from Chiang Mai, Thailand.'}]
  );
  assert.equal(result.evidence.some(e=>e.id==='MERCHANT_ORIGIN_BURIED_IN_SECONDARY_PAGES'),false);
  assert.equal(result.evidence.find(e=>e.id==='MERCHANT_JURISDICTIONS_DISCLOSED')?.severity,'info');
});

test('secondary-page-only jurisdiction becomes transparency signal',()=>{
  const result=analyzeMerchantOrigin(
    'Premium western-inspired apparel. Free shipping.',
    [{kind:'about',url:'https://x/about',text:'Company address: Kowloon, Hong Kong.'}]
  );
  assert.equal(result.evidence.some(e=>e.id==='MERCHANT_ORIGIN_BURIED_IN_SECONDARY_PAGES'),true);
});

test('different return jurisdiction becomes friction signal',()=>{
  const result=analyzeMerchantOrigin(
    'Premium apparel.',
    [
      {kind:'about',url:'https://x/about',text:'We are based in Hong Kong.'},
      {kind:'returns',url:'https://x/returns',text:'Return address: Shenzhen, China.'},
    ]
  );
  assert.equal(result.evidence.some(e=>e.id==='RETURN_JURISDICTION_DIFFERS'),true);
});
