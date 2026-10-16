import assert from 'node:assert/strict';
import test from 'node:test';
import { averageHash,differenceHash,hashSimilarity } from '../src/forensics/image-hash';

function image(values:number[],width:number,height:number):ImageData{
 const bytes=new Uint8ClampedArray(width*height*4);
 values.forEach((v,i)=>{bytes[i*4]=v;bytes[i*4+1]=v;bytes[i*4+2]=v;bytes[i*4+3]=255;});
 return {data:bytes,width,height,colorSpace:'srgb'} as ImageData;
}

test('identical image hashes compare as identical',()=>{
 const data=image([0,30,60,90,120,150,180,210,240],3,3);
 assert.equal(hashSimilarity(averageHash(data),averageHash(data)),1);
 assert.equal(hashSimilarity(differenceHash(data),differenceHash(data)),1);
});

test('different hash kinds never create similarity evidence',()=>{
 const data=image([0,30,60,90],2,2);
 assert.equal(hashSimilarity(averageHash(data),differenceHash(data)),0);
});
