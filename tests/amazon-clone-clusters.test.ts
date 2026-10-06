import assert from 'node:assert/strict';
import test from 'node:test';
import { amazonCloneClusterEvidence, clusterAmazonSearchCards, normalizeAmazonImageFamily } from '../src/analysis/amazon-clone-clusters';

test('normalizes Amazon image transformations to one family',()=>{
  const a='https://m.media-amazon.com/images/I/71ABCdefXYZ._AC_UL320_.jpg';
  const b='https://m.media-amazon.com/images/I/71ABCdefXYZ._AC_SX679_.jpg';
  assert.equal(normalizeAmazonImageFamily(a),normalizeAmazonImageFamily(b));
});

test('clusters distinct ASINs that reuse one primary image identity',()=>{
  const clusters=clusterAmazonSearchCards([
    {asin:'B000000001',title:'MewMew Cat Tunnel',imageUrl:'https://m.media-amazon.com/images/I/71ABCdefXYZ._AC_UL320_.jpg',price:29.99},
    {asin:'B000000002',title:'PawGo Cat Tunnel',imageUrl:'https://m.media-amazon.com/images/I/71ABCdefXYZ._AC_UL160_.jpg',price:49.99},
  ]);
  assert.equal(clusters.length,1);
  assert.equal(clusters[0]?.asins.length,2);
  assert.equal(clusters[0]?.brands.length,2);
});

test('large cross-brand family becomes strong evidence',()=>{
  const cards=[
    ['B000000001','MewMew Cat Tunnel',29.99],
    ['B000000002','PawGo Cat Tunnel',49.99],
    ['B000000003','ZORPLY Cat Tunnel',39.99],
    ['B000000004','KittyMax Cat Tunnel',59.99],
  ].map(([asin,title,price])=>({asin:String(asin),title:String(title),price:Number(price),imageUrl:'https://m.media-amazon.com/images/I/71ABCdefXYZ._AC_UL320_.jpg'}));
  const evidence=amazonCloneClusterEvidence(cards);
  assert.equal(evidence[0]?.severity,'strong');
  assert.match(evidence[0]?.observedValue ?? '',/4 ASINs/);
});

test('same ASIN repeated does not create clone cluster',()=>{
  const evidence=amazonCloneClusterEvidence([
    {asin:'B000000001',title:'Brand Cat Toy',imageUrl:'https://m.media-amazon.com/images/I/71ABCdefXYZ.jpg'},
    {asin:'B000000001',title:'Brand Cat Toy',imageUrl:'https://m.media-amazon.com/images/I/71ABCdefXYZ._AC_UL320_.jpg'},
  ]);
  assert.equal(evidence.length,0);
});
