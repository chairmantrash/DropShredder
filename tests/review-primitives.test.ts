import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeReviewText,
  reviewHasIncentiveLanguage,
  reviewMentionsMismatchedCategory,
  reviewTextSimilarity,
} from '../src/analysis/review-primitives';

test('normalizes review text without changing meaning',()=>{
  assert.equal(normalizeReviewText('  Great—LAMP!!  '),'great lamp');
});

test('copied review wording stays detectable after punctuation changes',()=>{
  const base='Amazing premium product works perfectly and I absolutely recommend this purchase to everyone';
  assert.ok(reviewTextSimilarity(base,base+'!!!')>=.72);
});

test('ordinary unrelated reviews do not look copied',()=>{
  assert.ok(reviewTextSimilarity('Battery life is good for my commute','The shade fits my desk and gives warm light')<.72);
});

test('incentive language is detected but ordinary praise is not',()=>{
  assert.equal(reviewHasIncentiveLanguage('I received this product for free in exchange for my honest review.'),true);
  assert.equal(reviewHasIncentiveLanguage('I bought this myself and it works well.'),false);
});

test('wrong-product category requires a mismatch with the listing title',()=>{
  assert.equal(reviewMentionsMismatchedCategory('Portable charger','This necklace clasp is beautiful.'),'necklace');
  assert.equal(reviewMentionsMismatchedCategory('Silver necklace','This necklace clasp is beautiful.'),undefined);
});
