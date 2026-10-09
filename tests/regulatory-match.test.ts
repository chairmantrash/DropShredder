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

test('regulated lots are strict, fixed-width and require both available lot and serial scope',()=>{
  const scoped:RegulatoryRecord={...record,serialRanges:[{prefix:'A-',start:'0010',end:'0020'}],
    lotRanges:[{prefix:'B',start:'0003',end:'0008'}]};
  const product={gtin:'012345678905',serial:'A-0015',lot:'B0006'};
  assert.equal(matchRegulatoryRecord(product,scoped)?.actionable,true);
  assert.equal(matchRegulatoryRecord({...product,lot:undefined},scoped)?.coverage,'unresolved');
  assert.equal(matchRegulatoryRecord({...product,serial:undefined},scoped)?.actionable,false);
  assert.equal(matchRegulatoryRecord({...product,lot:'B0009'},scoped)?.coverage,'excluded');
  assert.equal(matchRegulatoryRecord({...product,serial:'A-015'},scoped)?.coverage,'excluded');
  assert.equal(matchRegulatoryRecord({...product,lot:'B6'},scoped)?.coverage,'excluded');
});

test('a precise lot match cannot override an excluded model, differing brand or official serial requirement',()=>{
  const scoped:RegulatoryRecord={...record,lotNumbers:['LOT-EXACT'],excludedModels:['X-101'],requiresOfficialSerialCheck:true};
  const product={gtin:'012345678905',brand:'Acme',model:'X100',lot:'LOT-EXACT'};
  assert.equal(matchRegulatoryRecord(product,scoped)?.coverage,'unresolved');
  assert.equal(matchRegulatoryRecord({...product,model:'X101'},scoped)?.coverage,'excluded');
  assert.equal(matchRegulatoryRecord({...product,lot:'lot-exact'},scoped)?.coverage,'excluded');
});
