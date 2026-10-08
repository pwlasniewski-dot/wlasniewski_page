import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import sharp from 'sharp';
import {prepareShopPhoto,photoFormat,checkHeifDimensions} from '../../src/lib/uploads/prepare-shop-photo';
const limits={fileBytes:20*1024*1024,maxPixels:60_000_000,minDimension:100};
const heic=readFileSync(new URL('../fixtures/shop-upload/portrait.heic',import.meta.url));
test('HEIC header and spatial extents checked before converter; output is renamed and typed JPEG',async()=>{
 const jpg=await sharp({create:{width:160,height:240,channels:3,background:'red'}}).jpeg().toBuffer();
 for(const type of ['image/heic','image/heif','']){
  let calls=0,stages=0;
  const result=await prepareShopPhoto(new File([heic],'IMG_1234.HEIC',{type}),limits,()=>stages++,async()=>{calls++;return new Blob([jpg],{type:'image/jpeg'});});
  assert.equal(result.name,'IMG_1234.jpg');assert.equal(result.type,'image/jpeg');assert.equal(calls,1);assert.equal(stages,1);assert.deepEqual(Buffer.from(await result.arrayBuffer()),jpg);
 }
});
test('JPEG/PNG preserve bytes and need no decoder even with missing or incorrect iPhone MIME/name',async()=>{
 for(const format of ['jpeg','png'] as const){
  const bytes=await sharp({create:{width:120,height:120,channels:3,background:'red'}})[format]().toBuffer();
  const result=await prepareShopPhoto(new File([bytes],'IMG.heic',{type:''}),limits,()=>assert.fail(),async()=>{assert.fail();});
  assert.equal(result.type,`image/${format}`);assert.deepEqual(Buffer.from(await result.arrayBuffer()),bytes);
 }
});
test('invalid file, empty/oversized input, spatial bombs and invalid converter output never proceed',async()=>{
 const noConvert=async()=>{assert.fail('decoder should not execute');return new Blob();};
 for(const input of [new File([],'a.heic'),new File(['invalid'],'a.heic'),new File([new Uint8Array(limits.fileBytes+1)],'a.heic')])await assert.rejects(()=>prepareShopPhoto(input,limits,()=>{},noConvert));
 const huge=Buffer.from(heic);const at=huge.indexOf('ispe');assert.ok(at>0);huge.writeUInt32BE(100000,at+8);huge.writeUInt32BE(100000,at+12);
 await assert.rejects(()=>prepareShopPhoto(new File([huge],'big.heic'),limits,()=>{},noConvert),/Rozdzielczość/);
 await assert.rejects(()=>prepareShopPhoto(new File([heic],'a.heic'),limits,()=>{},async()=>new Blob(['not jpeg'])),/poprawnego JPG/);
 await assert.rejects(()=>prepareShopPhoto(new File([heic],'a.heic'),limits,()=>{},async()=>{throw Error('decoder');}),/Nie udało się przekształcić/);
 await assert.rejects(()=>prepareShopPhoto(new File([heic],'a.heic'),limits,()=>{},async()=>new Blob([new Uint8Array(limits.fileBytes+1)])),/po zamianie/);
});
test('truncated HEIF does not enter decoder; synthetic 48MP spatial extents are supported',()=>{
 assert.equal(photoFormat(heic),'heif');
 const photo=Buffer.from(heic),at=photo.indexOf('ispe');photo.writeUInt32BE(8064,at+8);photo.writeUInt32BE(6048,at+12);checkHeifDimensions(photo,limits.maxPixels);
 assert.throws(()=>checkHeifDimensions(heic.subarray(0,heic.length-100),limits.maxPixels));
});
