import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAdversarialText, normalizeIdentifier } from '../src/analysis/adversarial-normalization';

test('normalizes full-width and spacing tricks',()=>{
  assert.equal(normalizeAdversarialText('ＭＡＤＥ   ＩＮ   USA'),'made in usa');
});

test('removes zero-width evasion characters',()=>{
  assert.equal(normalizeAdversarialText('lim\u200Bited ti\u200Dme'),'limited time');
});

test('normalizes dash variants',()=>{
  assert.equal(normalizeAdversarialText('one—time – sale'),'one-time - sale');
});

test('normalizes identifiers across punctuation and spaces',()=>{
  assert.equal(normalizeIdentifier('AB-12 34.56'),'ab123456');
});
