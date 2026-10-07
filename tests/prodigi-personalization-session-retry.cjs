const { assert, React, act, mount, reset, flush, click, button, field } = require('./qa/gallery-shop-dom.cjs');
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
let sessionMode = 'network-error';
let pending = [];
let photos = [];
let transfers = 0;
let sessions = 0;
const dimensions = { width: 1200, height: 1200 };
global.createImageBitmap = async () => ({ ...dimensions, close() {} });
URL.createObjectURL = () => 'blob:retained-session-photo';
URL.revokeObjectURL = () => {};
global.XMLHttpRequest = class {
  constructor() { this.upload = {}; this.status = 200; }
  open() {} setRequestHeader() {}
  send() { transfers++; queueMicrotask(() => this.onload()); }
  abort() { this.onabort?.(); }
};
global.fetch = async (url, init = {}) => {
  if (url === '/api/shop/catalog') return response({ success: true, catalog: publicCatalog });
  if (url.endsWith('/personalization/session')) { sessions++;
    if (sessionMode === 'pending') return new Promise(resolve => pending.push({ resolve, signal: init.signal }));
    if (sessionMode === 'network-error') throw new TypeError('Failed to fetch');
    if (sessionMode === 'aborted') throw new DOMException('Aborted', 'AbortError');
    if (sessionMode === 'http-error') return response({ success: false, error: 'Zbyt wiele prób. Spróbuj ponownie później.' }, 429);
    if (sessionMode === 'non-json') return { ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token < in JSON'); } };
    return response({ success: true, accessCode: 'private-qa', photos: [...photos], limits: { fileBytes: 20 * 1024 * 1024, totalBytes: 50 * 1024 * 1024, photos: 100, minDimension: 100, maxPixels: 60000000 } }); }
  if (url.endsWith('/personalization/upload')) return response({ success: true, uploadId: 'fixture', url: 'https://s3.example.test', headers: {} });
  if (url.endsWith('/personalization/complete')) { photos.push({ id: photos.length + 1, previewUrl: '/private/photo', width: 1200, height: 1200 }); return response({ success: true }); }
  if (url.endsWith('/shop')) return response({ success: true, catalog: shopCatalog });
  throw Error('Unexpected URL ' + url);
};
// Control session timeout; React/jsdom flush and catalog timers remain real.
const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;
const timeouts = new Map();
let timerId = 100000;
global.setTimeout = (callback, delay, ...args) => {
  if (delay !== 25000) return originalSetTimeout(callback, delay, ...args);
  const id = timerId++;
  timeouts.set(id, () => callback(...args));
  return id;
};
global.clearTimeout = id => { if (!timeouts.delete(id)) originalClearTimeout(id); };
async function expireSession() {
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
  window.history.replaceState(null, '', '/sklep/personalizacja?shopProduct=50');
  const file = new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0])], 'retained.png', { type: 'image/png' });
  await mount(GuestPreview, { product, onClose() {} });
  await pick(field('Zdjęcie do podglądu produktu'), file);
  await click(button('Przejdź do zamówienia'));
  await settle();
  assert.equal(sessions, 1);
  assert.equal(transfers, 0);
  assert.ok(document.body.textContent.includes('Nie udało się połączyć ze sklepem'));
  assert.ok(!document.body.textContent.includes('Failed to fetch'));
  assert.ok(document.querySelector('img[src="blob:retained-session-photo"]'));
  assert.ok(!document.body.textContent.includes('Ponów wczytywanie oferty'));
  await settle();
  assert.equal(sessions, 1, 'no automatic session retry or extra guest creation');
  sessionMode = 'success';
  await click(button('Ponów otwieranie zdjęcia'));
  await settle();
  assert.equal(transfers, 1, 'retained original uploads exactly once after manual recovery');
  assert.ok(document.body.textContent.includes('Wybrano 1 / 1 zdjęć'));
  await click(button(/^Dodaj produkt do koszyka/));
  assert.equal(document.querySelectorAll('article[aria-label^="Pozycja "]').length, 1);
  await click(button('Wróć do podglądu'));
  await click(button('Przejdź do zamówienia'));
  await settle();
  assert.equal(transfers, 1);
  assert.equal(document.querySelectorAll('article[aria-label^="Pozycja "]').length, 1);
  await reset();
  console.log('PASS failed guest start has manual recovery; original, product and cart retained without duplicate upload');

  sessionMode = 'pending';
  await mount(Personalization, { initialIntent: { kind: 'product', productId: 50 } });
  await click(button(offer.personalizationButtonLabel));
  const stale = pending.at(-1);
  await expireSession();
  assert.ok(stale.signal.aborted);
  assert.ok(document.body.textContent.includes('Serwer nie odpowiedział na czas'));
  assert.equal(timeouts.size, 0);
  sessionMode = 'success';
  await click(button('Ponów otwieranie zdjęcia'));
  await settle();
  assert.equal(field('Produkt do personalizacji').value, '50');
  assert.ok(document.querySelector('[aria-label="Twoje zdjęcia do personalizacji"]'));
  await act(async () => stale.resolve(response({ success: true, accessCode: 'stale', photos: [], limits: {} })));
  await settle();
  assert.ok(document.body.textContent.includes('Do 20 MB na plik'), 'late response cannot replace successful current session');
  await reset();
  console.log('PASS hanging session aborts at 25 seconds; explicit retry works and late response cannot overwrite it');

  for (const mode of ['http-error', 'non-json', 'aborted']) {
    sessionMode = mode;
    const count = sessions;
    await mount(Personalization, { initialIntent: { kind: 'product', productId: 50 } });
    await click(button(offer.personalizationButtonLabel));
    await settle();
    assert.equal(sessions, count + 1);
    assert.ok(!document.body.textContent.includes('Unexpected token'));
    assert.ok(!document.body.textContent.includes('Aborted'));
    if (mode === 'http-error') assert.ok(document.body.textContent.includes('Zbyt wiele prób. Spróbuj ponownie później.'));
    sessionMode = 'success';
    await click(button('Ponów otwieranie zdjęcia'));
    await settle();
    assert.equal(document.querySelector('[role="alert"]'), null);
    assert.ok(document.querySelector('[aria-label="Twoje zdjęcia do personalizacji"]'));
    await reset();
  }
  console.log('PASS server restrictions preserved; malformed JSON and interrupted transport localized; manual retry only');

  sessionMode = 'pending';
  await mount(Personalization, { initialIntent: { kind: 'product', productId: 50 } });
  await click(button(offer.personalizationButtonLabel));
  const unmounted = pending.at(-1);
  const count = sessions;
  const uploads = transfers;
  await reset();
  assert.ok(unmounted.signal.aborted);
  assert.equal(timeouts.size, 0);
  await act(async () => unmounted.resolve(response({ success: true, accessCode: 'late', photos: [], limits: {} })));
  await settle();
  assert.equal(sessions, count);
  assert.equal(transfers, uploads);
  assert.equal(document.querySelector('#root').textContent, '');
  console.log('PASS unmount cancels session, clears timer and ignores late completion');

  photos = [];
  sessionMode = 'success';
  const before = transfers;
  function StrictShop() { return React.createElement(React.StrictMode, null, React.createElement(Personalization, { initialFile: file, initialIntent: { kind: 'product', productId: 50 } })); }
  await mount(StrictShop, {});
  await settle();
  assert.equal(transfers, before + 1, 'StrictMode retained file auto-start uploads once');
  assert.ok(document.body.textContent.includes('Wybrano 1 / 1 zdjęć'));
  assert.equal(timeouts.size, 0);
  await reset();
  console.log('PASS React StrictMode auto-start completes retained original and chosen product without stuck lock');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { global.setTimeout = originalSetTimeout; global.clearTimeout = originalClearTimeout; });
