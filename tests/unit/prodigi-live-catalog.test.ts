import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectLiveCatalog } from '../../src/lib/fulfillment/prodigi-live-catalog';
test('live qualification requires live key; sandbox key cannot substitute', async () => {
 const saved = process.env.PRODIGI_API_KEY; delete process.env.PRODIGI_API_KEY;
 try { await assert.rejects(inspectLiveCatalog({ action: 'product', sku: 'GLOBAL-FAP-10X10' }, async () => { throw Error('must not fetch'); }), (e:any) => e.code === 'LIVE_NOT_CONFIGURED' && e.status === 503); }
 finally { if(saved === undefined) delete process.env.PRODIGI_API_KEY; else process.env.PRODIGI_API_KEY = saved; }
});
test('live read uses fixed host, no redirects, bounded result and accepts null issues', async () => {
 const saved = process.env.PRODIGI_API_KEY; process.env.PRODIGI_API_KEY = 'synthetic-live-key';
 try { const result = await inspectLiveCatalog({ action: 'product', sku: 'GLOBAL-FAP-10X10' }, async (url, init) => {
  assert.equal(String(url),'https://api.prodigi.com/v4.0/products/GLOBAL-FAP-10X10'); assert.equal(init?.method,'GET'); assert.equal(init?.redirect,'error');
  return new Response(JSON.stringify({ outcome:'Ok',issues:null,product:{sku:'GLOBAL-FAP-10X10',description:'Fine art',attributes:{},printAreas:{default:{required:true}},variants:[{attributes:{},shipsTo:['PL'],printAreaSizes:{default:{horizontalResolution:1000,verticalResolution:1000}}}]} }));
 }); assert.equal(result.action,'product'); }
 finally { if(saved === undefined) delete process.env.PRODIGI_API_KEY; else process.env.PRODIGI_API_KEY = saved; }
});
test('order action cannot enter read-only qualification adapter', async () => {
 await assert.rejects(inspectLiveCatalog({ action: 'order', recipient: {} }), (e:any) => e.code === 'INVALID_INPUT');
});
