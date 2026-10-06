import assert from 'node:assert/strict';
import test from 'node:test';
import { catalogEvidence } from '../src/analysis/catalog-signals';

test('catalog-wide sale prevalence becomes moderate at extreme share',()=>{
  const evidence=catalogEvidence({cardCount:20,saleCardCount:18});
  assert.equal(evidence[0]?.severity,'moderate');
});

test('ordinary sale subset does not trigger',()=>{
  assert.equal(catalogEvidence({cardCount:20,saleCardCount:6}).length,0);
});
