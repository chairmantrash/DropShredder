import assert from 'node:assert/strict';
import test from 'node:test';
import { matchRegulatoryRecord, type RegulatoryRecord } from '../src/intelligence/regulatory-match';

const record:RegulatoryRecord={authority:'CPSC',recordId:'R1',title:'Acme Turbo Blender Model X100 recalled',url:'https://example.test/r1',gtins:['012345678905'],brand:'Acme',model:'X100'};

test('exact GTIN is actionable regulatory evidence',()=>{
 const m=matchRegulatoryRecord({gtin:'0 12345 67890 5',title:'Blender'},record);
 assert.equal(m?.match,'exact-identifier');
 assert.equal(m?.actionable,true);
});

test('brand and model can corroborate an actionable match',()=>{
 const m=matchRegulatoryRecord({brand:'ACME',model:'X-100'},record);
 assert.equal(m?.match,'brand-model');
 assert.equal(m?.actionable,true);
});

test('title similarity is candidate-only and cannot become a recall accusation',()=>{
 const m=matchRegulatoryRecord({title:'Acme Turbo Blender X100 recalled'},record);
 assert.equal(m?.match,'candidate-title');
 assert.equal(m?.actionable,false);
});

test('generic similar category does not match',()=>{
 assert.equal(matchRegulatoryRecord({title:'Kitchen blender 500 watt'},record),undefined);
});
