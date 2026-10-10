import test from 'node:test';
import assert from 'node:assert/strict';
import { defectConsensusEvidence } from '../src/analysis/defect-consensus';

test('requires the same defect on more than one source',()=>{
  const evidence=defectConsensusEvidence([
    {source:'reviews-a',text:'It stopped working after one week.'},
    {source:'reviews-a',text:'Mine died after two weeks of use.'},
  ]);
  assert.equal(evidence.length,0);
});

test('detects repeated concrete defects across independent sources',()=>{
  const evidence=defectConsensusEvidence([
    {source:'reviews-a',text:'It stopped working after one week.'},
    {source:'reviews-b',text:'Mine died after two weeks of use.'},
  ]);
  assert.equal(evidence.length,1);
  assert.equal(evidence[0]?.id,'DEFECT_CONSENSUS_EARLY_FAILURE');
  assert.equal(evidence[0]?.severity,'moderate');
});

test('escalates persistent cross-source defect consensus',()=>{
  const evidence=defectConsensusEvidence([
    {source:'reviews-a',text:'The case cracked after one use.'},
    {source:'reviews-b',text:'Mine broke on day two.'},
    {source:'reviews-c',text:'The hinge snapped almost immediately.'},
    {source:'reviews-c',text:'A second one fell apart too.'},
  ]);
  assert.equal(evidence.length,1);
  assert.equal(evidence[0]?.severity,'strong');
});

test('treats repeated overheating as a safety family',()=>{
  const evidence=defectConsensusEvidence([
    {source:'reviews-a',text:'It started to overheat while charging.'},
    {source:'reviews-b',text:'The unit was too hot to touch.'},
  ]);
  assert.equal(evidence[0]?.family,'safety');
  assert.equal(evidence[0]?.weight,15);
});

test('generic negative sentiment is not a defect consensus',()=>{
  const evidence=defectConsensusEvidence([
    {source:'reviews-a',text:'Terrible product. I hate it.'},
    {source:'reviews-b',text:'Bad purchase and disappointing.'},
    {source:'reviews-c',text:'Would not recommend.'},
  ]);
  assert.equal(evidence.length,0);
});
