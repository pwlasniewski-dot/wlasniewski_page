const { assert, React, act, mount, reset, flush, click, button, field, set } = require('./qa/gallery-shop-dom.cjs');
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

const baseFetch=global.fetch;let denied=false;let ownerHasGallery=true;let galleryReads=0;let extraPaid=false;
global.fetch=async(url,init)=>{
 if(url==='/api/galleries/client') return denied?response({},401):response({success:true,galleries:ownerHasGallery?[{access_code:'owned',client_name:'Moja galeria',gallery_mode:'INDIVIDUAL'}]:[]});
 if(url==='/api/galleries/owned'){galleryReads++;return response({success:true,gallery:{standard_photos:[{id:101,file_url:'/web/101',width:320,height:200,print_width:1200,print_height:1200},{id:104,file_url:'/web/104',width:6000,height:6000}],premium_photos:[{id:102,file_url:'/web/102',print_width:1200,print_height:1200},{id:103,file_url:'/web/103',print_width:1200,print_height:1200}],paid_photo_ids:extraPaid?[102,103]:[102]}});}
 if(url==='/api/galleries/owned/shop')return response({success:true,catalog:shopCatalog});
 return baseFetch(url,init);
};
(async()=>{
 window.history.replaceState(null,'','/sklep/personalizacja?shopProduct=50');sessionMode='success';
 const file=new File([new Uint8Array([137,80,78,71,13,10,26,10,0,0])],'direct.png',{type:'image/png'});
 await mount(GuestPreview,{product,onClose(){}});await pick(field('Zdjęcie do podglądu produktu'),file);await click(button(/^Dodaj do koszyka/));await settle();
 const uploads=transfers;
 await click(button('Wybierz ze swojej galerii'));await settle();
 await set(field('Twoja galeria'),'owned');await settle();
 assert.ok(document.querySelector('[aria-label=\"Wybierz zdjęcie 101 do produktu\"]'));
 assert.ok(document.querySelector('[aria-label=\"Wybierz zdjęcie 102 do produktu\"]'));
 assert.equal(document.querySelector('[aria-label="Wybierz zdjęcie 103 do produktu"]'),null,'unpaid premium not usable');
 extraPaid=true;await click(button('Odśwież zdjęcia po zakupie'));await settle();assert.ok(document.querySelector('[aria-label="Wybierz zdjęcie 103 do produktu"]'),'refresh makes newly purchased photo available in same product');
 await click(document.querySelector('[aria-label=\"Wybierz zdjęcie 101 do produktu\"]'));await settle();
 assert.ok(document.body.textContent.includes('1200 × 1200 px'),'HQ dimensions used instead of 320px web');
 assert.equal(document.querySelectorAll('article[aria-label^="Pozycja "]').length,0,'choosing another source never transfers old add command');
 await click(button(/^Dodaj do koszyka/));await settle();
 assert.equal(document.querySelectorAll('article[aria-label^="Pozycja "]').length,1);
 assert.ok(document.body.textContent.includes('Zdjęcie produktu: 101'));
 assert.equal(transfers,uploads,'gallery selection does not download/reupload original');
 await click(button('Wybierz ze swojej galerii'));await settle();await set(field('Twoja galeria'),'owned');await settle();await click(document.querySelector('[aria-label=\"Wybierz zdjęcie 104 do produktu\"]'));await settle();
 assert.ok(document.body.textContent.includes('Nie potwierdzono wymiarów oryginału'));
 assert.ok(button(/^Dodaj do koszyka/).disabled,'large WEB dimensions never replace missing HQ');
 assert.equal(document.querySelectorAll('article[aria-label^="Pozycja "]').length,0);
 await reset();console.log('PASS owner gallery A survives close/reopen in exact A cart with no guest session/upload; HQ-only, paid filter and explicit add enforced');
 denied=true;const before=galleryReads;await mount(GuestPreview,{product,onClose(){}});await pick(field('Zdjęcie do podglądu produktu'),file);await click(button('Zobacz koszyk'));await settle();assert.ok(document.querySelector('img[src="blob:retained-session-photo"]'),'denied resume preserves local file');
 assert.ok(document.body.textContent.includes('Zaloguj się do swojego konta'));
 assert.equal(document.querySelector('[aria-label="Twoja galeria"]'),null);
 assert.equal(galleryReads,before,'denied list cannot fetch any gallery or photo');
 await reset();denied=false;ownerHasGallery=false;await mount(GuestPreview,{product,onClose(){}});await pick(field('Zdjęcie do podglądu produktu'),file);await click(button('Zobacz koszyk'));await settle();assert.ok(document.body.textContent.includes('Nie masz dostępu do galerii zapisanego koszyka'));assert.equal(galleryReads,before,'stored code alone never authorizes a gallery fetch');assert.ok(document.querySelector('img[src="blob:retained-session-photo"]'));await reset();sessionStorage.removeItem('product-cart-source:50');await mount(GuestPreview,{product,onClose(){}});assert.equal([...document.querySelectorAll('button')].some(node=>node.textContent==='Zobacz koszyk'),false,'unrelated global cart cannot activate this product continuation');await reset();console.log('PASS denied/absent owner gallery preserves local file; stored code and unrelated cart never authorize another source');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{global.setTimeout=originalSetTimeout;global.clearTimeout=originalClearTimeout;});
