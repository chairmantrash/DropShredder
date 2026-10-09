import assert from 'node:assert/strict';
import test from 'node:test';
import {collectLocalLabelResults} from '../src/forensics/local-label-reader';

test('local shape detector output is bounded, checksum-filtered and unscored',()=>{
 const r=collectLocalLabelResults(['012345678905','012345678905','FAKE BARCODE'],
 ['Product model ACME','Product model ACME','Lot 007'],true,true);
 assert.equal(r.barcodes.length,2);
 assert.equal(r.gtins.length,1);
 assert.equal(r.textLines.length,2);
 assert.equal(r.barcodeAvailable,true);
});
test('label parser never invents OCR when unavailable',()=>{
 const r=collectLocalLabelResults([],[],false,false);
 assert.deepEqual(r.barcodes,[]);assert.equal(r.textAvailable,false);
});
