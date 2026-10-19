import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {prodigiPrintQuality,prodigiMinimumResolutionRatio,hasProdigiPrintResolution} from '../../src/lib/fulfillment/prodigi-image-size';
import {normalizeShopImage} from '../../src/lib/galleries/shop-uploads';
const portrait={horizontalResolution:4800,verticalResolution:7200};
const ratio=prodigiMinimumResolutionRatio('GLOBAL-FAP-16X24');
test('landscape source orients print field consistently and is acceptable below recommendation',()=>{
 const q=prodigiPrintQuality(5405,3603,portrait,ratio);
 assert.equal(q.status,'acceptable');assert.equal(q.rotated,true);
 assert.equal(q.recommendedWidth,7200);assert.equal(q.recommendedHeight,4800);
 assert.equal(q.minimumWidth,4800);assert.equal(q.minimumHeight,3200);
 assert.ok(Math.abs(q.resolutionRatio-0.7506944444)<0.00001);
 assert.equal(hasProdigiPrintResolution(5405,3603,portrait,ratio),true);
});
test('iPhone portrait meets shop policy without reaching supplier recommendation',()=>{
 const q=prodigiPrintQuality(3024,4032,{horizontalResolution:3307,verticalResolution:4192},prodigiMinimumResolutionRatio('GLOBAL-FAP-11X14'));
 assert.equal(q.status,'acceptable');assert.equal(q.rotated,false);assert.ok(q.resolutionRatio>0.96);
});
test('whole-image fit uses limiting extent, exact rounded floor, and conservative unknown SKU',()=>{
 const square={horizontalResolution:1000,verticalResolution:1000};
 assert.equal(prodigiPrintQuality(667,100,square,ratio).status,'acceptable');
 assert.equal(prodigiPrintQuality(666,666,square,ratio).status,'blocked');
 assert.equal(prodigiPrintQuality(1000,999,square,ratio).status,'recommended');
 assert.equal(prodigiPrintQuality(5405,3603,portrait,prodigiMinimumResolutionRatio('UNKNOWN')).status,'blocked');
 assert.equal(prodigiPrintQuality(960,640,portrait,ratio).status,'blocked');
 const q=prodigiPrintQuality(960,640,portrait,ratio);assert.equal(q.sourceMinimumWidth,4800);assert.equal(q.sourceMinimumHeight,3200);
 for(const dimension of [null,undefined,0,-1,NaN,Infinity,100.5])assert.equal(prodigiPrintQuality(dimension,640,portrait,ratio).status,'blocked');
 assert.equal(prodigiPrintQuality(960,640,undefined,ratio).status,'blocked');
 assert.equal(prodigiPrintQuality(960,640,portrait,0.01).status,'blocked','invalid policy cannot bypass floor');
});
test('actual normalization preserves user original dimensions, large HQ and iPhone EXIF orientation',async()=>{
 for(const [w,h,orientation,expectedW,expectedH] of [[5405,3603,1,5405,3603],[4032,3024,6,3024,4032],[8000,6000,1,8000,6000]]){
  const bytes=await sharp({create:{width:w,height:h,channels:3,background:'#426588'}}).withMetadata({orientation}).jpeg().toBuffer();
  const normalized=await normalizeShopImage(bytes,'image/jpeg',createHash('sha256').update(bytes).digest('hex'));
  assert.equal(normalized.width,expectedW);assert.equal(normalized.height,expectedH);
  const hq=await sharp(normalized.hq).metadata();assert.equal(hq.width,expectedW);assert.equal(hq.height,expectedH);assert.equal(hq.orientation,undefined);
  const thumbnail=await sharp(normalized.thumbnail).metadata();assert.ok(thumbnail.width!<=640 && thumbnail.height!<=640);
 }
});
