import assert from 'node:assert/strict';
import test from 'node:test';
import { LOCAL_VECTOR_DIM, localTextVector, localVectorSimilarity, lexicalOverlap } from '../src/analysis/local-vectors';

test('local feature hashes are deterministic, normalized and bounded with no external services',()=>{
  const a=localTextVector('Waterproof hiking backpack with rain cover 30 liter');
  assert.equal(a.length,LOCAL_VECTOR_DIM);
  assert.deepEqual([...a],[...localTextVector('Waterproof hiking backpack with rain cover 30 liter')]);
  assert.equal(localVectorSimilarity('hiking waterproof backpack','hiking waterproof backpack'),1);
  assert.equal(localVectorSimilarity('',''),0);
});
test('false-positive safety: short generic names abstain and unrelated titles do not match',()=>{
  assert.equal(lexicalOverlap('Blue hat','Blue hat'),0);
  assert.equal(lexicalOverlap('Rechargeable outdoor solar camping lamp','Canvas cotton throw pillow bedspread'),0);
  assert.ok(localVectorSimilarity('Rechargeable outdoor solar camping lamp','Canvas cotton throw pillow bedspread')<.87);
});
