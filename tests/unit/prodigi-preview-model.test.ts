import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prodigiPreviewModel } from '../../src/lib/fulfillment/prodigi-preview-model';
import type { ProdigiProductConfig } from '../../src/lib/fulfillment/prodigi-catalog';
const spec={sku:'GLOBAL-CAN-12X16',variant:{attributes:{edge:'38mm',wrap:'Black'},printAreaSizes:{default:{horizontalResolution:3654,verticalResolution:4854}}}} as unknown as ProdigiProductConfig;
test('canvas physical front dimensions differ from print pixels and black 38mm sides are explicit',()=>{
 const m=prodigiPreviewModel(spec)!;
 assert.equal(m.kind,'canvas');assert.equal(m.edgeColor,'black');assert.equal(m.depthMm,38);
 assert.equal(m.physicalWidthMm,12*25.4);assert.equal(m.physicalHeightMm,16*25.4);
 assert.equal(m.width,3654);assert.notEqual(m.width/m.height,m.physicalWidthMm/m.physicalHeightMm);
 assert.equal('sku' in m,false);assert.equal('attributes' in m,false);
});
test('paper has no fabricated frame and unknown canvas edges are not invented',()=>{
 const paper=prodigiPreviewModel({...spec,sku:'GLOBAL-FAP-11X14'})!;
 assert.equal(paper.kind,'paper');assert.equal(paper.depthMm,undefined);assert.equal(paper.edgeColor,undefined);
 const unknown=prodigiPreviewModel({...spec,variant:{...spec.variant,attributes:{edge:'unknown',wrap:'unknown'}}})!;
 assert.equal(unknown.depthMm,undefined);assert.equal(unknown.edgeColor,undefined);
 assert.equal(prodigiPreviewModel({...spec,sku:'MUG'}),undefined);
});
