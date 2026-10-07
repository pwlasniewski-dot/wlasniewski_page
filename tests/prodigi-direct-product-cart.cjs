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
 window.history.replaceState(null,'','/sklep/personalizacja?shopProduct=50');
 const file=new File([new Uint8Array([137,80,78,71,13,10,26,10,0,0])],'direct.png',{type:'image/png'});
 sessionMode='success';
 await mount(GuestPreview,{product,onClose(){}});
 assert.ok(field('Zdjęcie do podglądu produktu'));
 assert.equal(sessions,0);
 await pick(field('Zdjęcie do podglądu produktu'),file);
 assert.equal(sessions,0,'local preview does not create session');
 await click(button(/^Dodaj do koszyka/));await settle();
 assert.equal(transfers,1);
 assert.equal(document.querySelectorAll('article[aria-label^="Pozycja "]').length,1,'one click prepares and adds one actual cart line');
 assert.ok(document.querySelector('img[src="blob:retained-session-photo"]'));
 assert.ok(!document.body.textContent.includes('Przejdź do zamówienia'));
 await click(button(/^Dodaj do koszyka/));await settle();
 assert.equal(transfers,1,'already uploaded original is reused');
 assert.equal(document.querySelectorAll('article[aria-label^="Pozycja "]').length,2,'second intentional click adds one additional line');
 await reset();
 await mount(GuestPreview,{product,onClose(){}});
 assert.ok(button(/^Dodaj do koszyka/).disabled);
 const beforeResume=transfers;await click(button('Zobacz koszyk'));await settle();
 assert.equal(document.querySelectorAll('article[aria-label^="Pozycja "]').length,2);
 assert.equal(transfers,beforeResume,'closing/reopening cart needs no File, new upload or new add');
 await reset();
 console.log('PASS direct local preview → session/upload → actual cart in one click, intentional re-add no reupload');
 sessionStorage.clear();photos=[];sessionMode='network-error';
 await mount(GuestPreview,{product,onClose(){}});await pick(field('Zdjęcie do podglądu produktu'),file);
 await click(button(/^Dodaj do koszyka/));await settle();
 assert.ok(document.body.textContent.includes('Nie udało się połączyć ze sklepem'));
 const before=transfers;sessionMode='success';await click(button('Ponów otwieranie zdjęcia'));await settle();
 assert.equal(transfers,before+1);
 assert.equal(document.querySelectorAll('article[aria-label^="Pozycja "]').length,1);
 await reset();
 console.log('PASS failed direct add preserves photo/product and manual retry completes requested single cart line');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{global.setTimeout=originalSetTimeout;global.clearTimeout=originalClearTimeout;});
