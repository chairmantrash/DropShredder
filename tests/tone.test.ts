import assert from 'node:assert/strict';
import test from 'node:test';
import { toneCopy, type ToneMode } from '../src/ui/tone';

test('tone modes change wording only',()=>{
  const modes:ToneMode[]=['professional','aggressive','nuclear'];
  for(const mode of modes){
    const copy=toneCopy(mode);
    assert.ok(copy.scan.length>0);
    assert.ok(copy.evidenceHeading.length>0);
    assert.ok(copy.signalsFound.length>0);
    assert.ok(copy.severeWarning.length>0);
  }
  assert.equal(toneCopy('professional').scan,'CHECK THIS PRODUCT');
  assert.equal(toneCopy('aggressive').scan,'CHECK THIS SHIT');
});
