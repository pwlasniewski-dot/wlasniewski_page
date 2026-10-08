const { assert, act, mount, reset, flush, click, button, field } = require('./qa/gallery-shop-dom.cjs');
const { File } = require('node:buffer');
const { webcrypto } = require('node:crypto');
const { defaultPublicOffer } = require('../src/lib/galleries/public-offer.ts');
const GuestPreview = require('../src/components/shop/GuestProductPreview.tsx').default;
const Personalization = require('../src/components/shop/PersonalizationShop.tsx').default;
Object.defineProperty(global, 'crypto', { value: webcrypto, configurable: true });
const product = { id: 50, title: 'Fotoobraz QA', description: 'Test', image_url: null, price: 9900, minPhotos: 1, maxPhotos: 1, personalizationEligible: true, personalizationPreview: { kind: 'canvas', width: 1000, height: 1000 }, prodigi: { version: 1, provider: 'prodigi', environment: 'live', productId: 50, sku: 'GLOBAL-CAN-10X10', variant: { attributes: {}, printAreaSizes: { default: { horizontalResolution: 1000, verticalResolution: 1000 } } }, requiredAssets: ['default'], shippingMethod: 'Budget', ordersEnabled: true, liveQualified: true, destination: 'PL' } };
const offer = { ...defaultPublicOffer(), enabled: true, personalizationEnabled: true, productIds: [50] };
const publicCatalog = { offer, products: [product], formats: [] };
const shopCatalog = { galleryId: 12, enabled: true, title: 'Sklep QA', introduction: '', buttonLabel: 'Kup', formats: [], products: [product], delivery: { locker: { enabled: false, amount: 0 }, courier: { enabled: true, amount: 2000 }, pickup: { enabled: false, amount: 0 } } };
const response = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
let catalogMode = 'pending';
let pending = [];
let photos = [];
let transfers = 0;
let sessions = 0;
let dimensions = { width: 1200, height: 1200 };
global.createImageBitmap = async () => ({ ...dimensions, close() {} });
URL.createObjectURL = () => 'blob:retained-catalog-photo';
URL.revokeObjectURL = () => {};
global.XMLHttpRequest = class {
  constructor() { this.upload = {}; this.status = 200; }
  open() {} setRequestHeader() {}
  send() { transfers++; queueMicrotask(() => this.onload()); }
  abort() { this.onabort?.(); }
};
global.fetch = async (url, init = {}) => {
  if (url === '/api/shop/catalog') {
    if (catalogMode === 'pending') return new Promise(resolve => pending.push({ resolve, signal: init.signal }));
    if (catalogMode === 'http-error') return response({ success: false }, 503);
    if (catalogMode === 'network-error') throw new TypeError('Failed to fetch');
    if (catalogMode === 'non-json') return { ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token < in JSON'); } };
    if (catalogMode === 'null-catalog') return response({ success: true, catalog: null });
    return response({ success: true, catalog: publicCatalog });
  }
  if (url.endsWith('/personalization/session')) { sessions++; return response({ success: true, accessCode: 'private-qa', photos: [...photos], limits: { fileBytes: 20 * 1024 * 1024, totalBytes: 50 * 1024 * 1024, photos: 100, minDimension: 100, maxPixels: 60000000 } }); }
  if (url.endsWith('/personalization/upload')) return response({ success: true, uploadId: 'fixture', url: 'https://s3.example.test', headers: {} });
  if (url.endsWith('/personalization/complete')) { photos.push({ id: photos.length + 1, previewUrl: '/private/photo', width: 1200, height: 1200 }); return response({ success: true }); }
  if (url.endsWith('/shop')) return response({ success: true, catalog: shopCatalog });
  throw Error('Unexpected URL ' + url);
};
// Control only the catalogue timeout. React/jsdom flush and other request timers
// remain real; no 15-second wall-clock delay is needed for this regression.
const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;
const timeouts = new Map();
let timerId = 100000;
global.setTimeout = (callback, delay, ...args) => {
  if (delay !== 15000) return originalSetTimeout(callback, delay, ...args);
  const id = timerId++;
  timeouts.set(id, () => callback(...args));
  return id;
};
global.clearTimeout = id => { if (!timeouts.delete(id)) originalClearTimeout(id); };
async function expireCatalog() {
  assert.equal(timeouts.size, 1);
  const [id, timeout] = timeouts.entries().next().value;
  timeouts.delete(id);
  await act(async () => timeout());
  await flush();
}
async function settle() { for (let i = 0; i < 10; i++) await flush(); }
async function pick(input, file) {
  Object.defineProperty(input, 'files', { configurable: true, value: [file] });
  await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
  await settle();
}
(async () => {
  window.history.replaceState(null, '', '/karta-podarunkowa?shopProduct=50&shopPersonalize=1');
  const file = new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0])], 'retained.png', { type: 'image/png' });
  await mount(GuestPreview, { product, onClose() {} });
  await pick(field('Zdjęcie do podglądu produktu'), file);
  await click(button(/^Dodaj do koszyka/));
  assert.ok(document.body.textContent.includes('Wczytywanie oferty…'));
  const stale = pending.at(-1);
  await expireCatalog();
  assert.ok(stale.signal.aborted);
  assert.ok(!field('Zdjęcie do podglądu produktu').disabled,'catalog timeout releases source controls');
  assert.ok(!button(/^Dodaj do koszyka/).disabled,'catalog timeout releases add freeze');
  assert.ok(document.body.textContent.includes('trwało zbyt długo'));
  assert.ok(!document.body.textContent.includes('Wczytywanie oferty…'));
  assert.ok(document.querySelector('img[src="blob:retained-catalog-photo"]'), 'local photo survives catalogue timeout');
  assert.equal(transfers, 0);
  assert.equal(sessions, 0);
  catalogMode = 'success';
  await click(button('Ponów wczytywanie oferty'));
  await settle();
  assert.equal(transfers, 1, 'retry automatically uploads retained file exactly once');
  assert.equal(document.querySelectorAll('article[aria-label^="Pozycja "]').length,1);
  assert.equal([...document.querySelectorAll('button')].some(node => node.textContent === 'Ponów wczytywanie oferty'), false);
  await act(async () => stale.resolve(response({ success: true, catalog: { ...publicCatalog, offer: { ...offer, personalizationEnabled: false } } })));
  await settle();
  assert.ok(!document.body.textContent.includes('Dodawanie własnych zdjęć jest obecnie niedostępne.'), 'late timed-out response cannot replace successful retry');
  assert.equal(document.querySelectorAll('article[aria-label^="Pozycja "]').length, 1);
  await settle();
  assert.equal(transfers, 1);
  assert.equal(document.querySelectorAll('article[aria-label^="Pozycja "]').length, 1, 'cart survives returning to retained product');
  await reset();
  console.log('PASS hanging catalogue expires/aborts; retry preserves preview, chosen product, one upload and cart; stale response ignored');

  for (const mode of ['http-error', 'network-error', 'non-json']) {
    catalogMode = mode;
    await mount(Personalization, { initialIntent: { kind: 'product', productId: 50 } });
    assert.ok(document.querySelector('[role="alert"]'));
    assert.ok(!document.body.textContent.includes('Unexpected token'));
    assert.ok(!document.body.textContent.includes('Failed to fetch'));
    assert.ok(!document.body.textContent.includes('Dodawanie własnych zdjęć jest obecnie niedostępne.'), 'transport failure is not presented as disabled shop');
    assert.ok(!document.body.textContent.includes('Wczytywanie oferty…'));
    catalogMode = 'success';
    await click(button('Ponów wczytywanie oferty'));
    await settle();
    assert.equal(document.querySelector('[role="alert"]'), null);
    assert.equal(field('Produkt do personalizacji').value, '50');
    await reset();
  }
  console.log('PASS HTTP and network catalogue failures have independent retry; successful retry keeps chosen product');

  catalogMode = 'null-catalog';
  await mount(Personalization, {});
  assert.ok(document.body.textContent.includes('Dodawanie własnych zdjęć jest obecnie niedostępne.'));
  assert.equal(document.querySelector('[role="alert"]'),null);
  await reset();
  catalogMode = 'pending';
  await mount(Personalization, {});
  const unmounted = pending.at(-1);
  assert.equal(timeouts.size, 1);
  await reset();
  assert.ok(unmounted.signal.aborted);
  assert.equal(timeouts.size, 0, 'unmount clears timeout');
  await act(async () => unmounted.resolve(response({ success: true, catalog: publicCatalog })));
  await settle();
  assert.equal(document.querySelector('#root').textContent, '');
  console.log('PASS unmount aborts catalogue and clears timer; late completion makes no UI/session/upload changes');

  catalogMode = 'success';
  dimensions = { width: 50, height: 40 };
  await mount(GuestPreview, { product, onClose() {} });
  await pick(field('Zdjęcie do podglądu produktu'), new File([await file.arrayBuffer()], 'small.png', { type: 'image/png' }));
  assert.ok(button(/^Dodaj do koszyka/).disabled);
  assert.ok(document.body.textContent.includes('Dla tego zdjęcia wybierz oryginał co najmniej'));
  assert.equal([...document.querySelectorAll('button')].some(node => node.textContent === 'Ponów wczytywanie oferty'), false, 'photo quality failure does not invite catalogue retry');
  await reset();
  console.log('PASS photo quality errors retain their own action and never show catalogue retry');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { global.setTimeout = originalSetTimeout; global.clearTimeout = originalClearTimeout; });
