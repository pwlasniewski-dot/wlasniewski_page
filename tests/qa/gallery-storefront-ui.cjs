const h = require('./gallery-shop-dom.cjs');
const { assert, act, mount, reset, button, field, click, check } = h;
const Storefront = require('../../src/components/shop/PhotoProductStorefront.tsx').default;
const Client = require('../../src/components/galleries/GalleryShoppingPanel.tsx').default;
const { parseShopIntent, shopAccountHref, shopGalleryHref, replaceShopIntent } = require('../../src/lib/galleries/shop-intent.ts');
const { safeReturnTo } = require('../../src/lib/auth/return-to.ts');
const { publicShopCatalog, defaultPublicOffer } = require('../../src/lib/galleries/public-offer.ts');
const { validateShopConfig } = require('../../src/lib/galleries/merchandise.ts');
const Module = require('node:module');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
// Replace framework-only image/link/animation adapters, never the actual page,
// GiftCard, shared offer component or their data-fetching business logic.
const originalLoad = Module._load;
const plainElement = tag => ({ children, fill, priority, whileHover, animate, initial, exit, transition, ...props }) => h.React.createElement(tag, props, children);
Module._load = function(request, ...args) {
  if (request === 'next/image') return { __esModule: true, default: plainElement('img') };
  if (request === 'next/link') return { __esModule: true, default: plainElement('a') };
  if (request === 'framer-motion') return { motion: { div: plainElement('div') } };
  return originalLoad.call(this, request, ...args);
};
let DestinationPage;
const clone = value => JSON.parse(JSON.stringify(value));
let config = { version: 1, enabled: true, title: 'Zakupy klienta', introduction: 'Wspólna oferta', buttonLabel: 'Zamów zdjęcia', formats: [{ id: 'nphoto-15x21-silk', label: 'Odbitki 15×21', paper: 'Fuji Silk', widthMm: 152, heightMm: 210, unitAmount: 300, active: true }], productRules: {}, productDelivery: {}, delivery: { locker: { enabled: true, amount: 1500 }, courier: { enabled: true, amount: 2000 } }, publicOffer: { ...defaultPublicOffer(), enabled: true, title: 'Wspomnienia w pięknej oprawie', buttonLabel: 'Wybierz zdjęcia', formatIds: ['nphoto-15x21-silk'], productIds: [11, 12, 13, 14] } };
let products = [
  { id: 11, title: 'Harmonijka', description: '8×8, V6, 12 stron', price: 12900, image_url: 'https://nphoto.com/accordion.jpg', product_type: 'accordion', minPhotos: 12, maxPhotos: 12 },
  { id: 12, title: 'Album PRO', description: '20×20, 10 rozkładówek', price: 32900, image_url: 'https://nphoto.com/pro.jpg', preview_images: ['https://nphoto.com/pro-open.jpg'], product_type: 'album', minPhotos: 20, maxPhotos: 20 },
  { id: 13, title: 'Lite Album', description: '20×20, 5 rozkładówek, A30', price: 22900, image_url: null, product_type: 'album', minPhotos: 10, maxPhotos: 10 },
  { id: 14, title: 'Fotoobraz na płótnie', description: '40×60, rama 2 cm', price: 18900, image_url: 'https://nphoto.com/wall.jpg', product_type: 'wall_decor', minPhotos: 1, maxPhotos: 1, deliveryMethods: ['courier'] },
];
const photos = Array.from({ length: 25 }, (_, index) => ({ id: index + 1, file_url: `/photo-${index + 1}.jpg` }));
let publicCatalog, galleries, clientCatalog, failClient = false, requests = [], actions = [], giftCardsResponse;
const reply = (body, status = 200) => ({ ok: status < 400, status, json: async () => clone(body) });
global.fetch = async (url, init = {}) => {
  requests.push({ url, method: init.method || 'GET', headers: init.headers });
  if (url === '/api/shop/catalog') return reply({ success: true, catalog: publicCatalog });
  if (url === '/api/gift-cards/shop') return giftCardsResponse;
  if (url === '/api/galleries/client') { assert.equal(init.headers.Authorization, 'Bearer own-account-token'); return reply({ galleries }); }
  if (url === '/api/galleries/26/shop') { if (failClient) throw new Error('Offline'); return reply({ success: true, catalog: clientCatalog }); }
  throw new Error(`Unexpected request: ${url}`);
};
async function fresh(url = '/qa') {
  await reset(); sessionStorage.clear(); window.history.replaceState(null, '', url);
  requests = []; actions = []; failClient = false;
  publicCatalog = publicShopCatalog(config, products);
  clientCatalog = { ...clone(config), galleryId: 26, products: clone(products) };
  galleries = [{ id: 26, access_code: 'own-gallery-code', client_name: 'Moja sesja', photo_count: 25, created_at: '2026-09-01T12:00:00Z' }];
  giftCardsResponse = reply({ cards: [{ id: 81, code: 'PRIVATE-CODE', value: 750, price: 675, theme: 'gold', available: true, card_title: 'Karta rodzinna', description: 'Istniejący opis karty z API' }] });
}
async function clickLink(link) { link.addEventListener('click', event => event.preventDefault(), { once: true }); await act(async () => link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))); }

(async () => {
  await check('Storefront route: actual redirects resolve both shop aliases to the page containing gift cards and 5 shared offers', async () => {
    const { default: nextConfig } = await import(pathToFileURL(path.resolve('next.config.mjs')).href);
    const redirects = await nextConfig.redirects();
    for (const alias of ['/sklep', '/sklep-karty-podarunkowe']) {
      const redirect = redirects.find(item => item.source === alias);
      assert.equal(redirect?.destination, '/karta-podarunkowa'); assert.equal(redirect?.permanent, true);
      DestinationPage = require(path.resolve(`src/app${redirect.destination}/page.tsx`)).default;
      await fresh(redirect.destination); await mount(DestinationPage, {});
      const photoSection = document.getElementById('produkty-fotograficzne'); const cardsSection = document.getElementById('wybierz-karte');
      assert.ok(photoSection); assert.ok(cardsSection);
      assert.equal(photoSection.querySelectorAll('article').length, 5);
      assert.equal(cardsSection.querySelector('a[href="/karta-podarunkowa/81/kup"]').textContent.trim(), 'Kup tę kartę');
      assert.ok(cardsSection.textContent.includes('Karta rodzinna')); assert.ok(cardsSection.textContent.includes('675 zł')); assert.ok(cardsSection.textContent.includes('Istniejący opis karty z API'));
      assert.ok(!cardsSection.textContent.includes('PRIVATE-CODE'));
      const howTo = [...document.querySelectorAll('h2')].find(node => node.textContent === 'Jak kupić kartę').closest('section');
      assert.ok(cardsSection.compareDocumentPosition(photoSection) & Node.DOCUMENT_POSITION_FOLLOWING);
      assert.ok(photoSection.compareDocumentPosition(howTo) & Node.DOCUMENT_POSITION_FOLLOWING);
      const schema = JSON.parse(photoSection.querySelector('script').textContent);
      assert.ok(schema.itemListElement.every(item => item.item.url.startsWith('https://wlasniewski.pl/karta-podarunkowa#') && item.item.offers.url === item.item.url));
      assert.ok(requests.some(request => request.url === '/api/shop/catalog'));
      assert.ok(requests.some(request => request.url === '/api/gift-cards/shop'));
    }
    Module._load = originalLoad;
    assert.ok(fs.readFileSync('src/components/admin/PublicShopOfferSettings.tsx', 'utf8').includes('href="/karta-podarunkowa#produkty-fotograficzne"'));
  });
  await check('Storefront route: gift card request may remain pending without blocking the five photo offers', async () => {
    await fresh('/karta-podarunkowa'); let finishCards;
    giftCardsResponse = new Promise(resolve => { finishCards = resolve; });
    await mount(DestinationPage, {});
    assert.ok(document.querySelector('[aria-label="Ładowanie kart"]'));
    assert.equal(document.querySelectorAll('#produkty-fotograficzne article').length, 5);
    await act(async () => finishCards(reply({ cards: [{ id: 82, code: 'HIDDEN', value: 500, price: 500, theme: 'gold', available: true, card_title: 'Karta po odczycie' }] })));
    assert.ok(document.querySelector('a[href="/karta-podarunkowa/82/kup"]'));
    assert.equal(document.querySelectorAll('#produkty-fotograficzne article').length, 5);
  });
  await check('Storefront route: gift card fetch failure preserves photo offers and existing card fallback', async () => {
    await fresh('/karta-podarunkowa'); let failCards;
    giftCardsResponse = new Promise((resolve, reject) => { failCards = reject; });
    await mount(DestinationPage, {});
    const previousError = console.error; let loggedFailure = false;
    console.error = (...args) => { if (args[0] === 'Failed to fetch gift cards') loggedFailure = true; else previousError(...args); };
    try { await act(async () => failCards(new Error('Card service temporarily unavailable'))); } finally { console.error = previousError; }
    assert.ok(loggedFailure); assert.ok(document.getElementById('wybierz-karte').textContent.includes('Karty są chwilowo niedostępne'));
    assert.equal(document.querySelectorAll('#produkty-fotograficzne article').length, 5);
  });
  await check('Storefront: safe intent rejects ambiguous IDs, hostile paths and redirects; login roundtrip', async () => {
    assert.deepEqual(parseShopIntent('?shopProduct=12'), { kind: 'product', productId: 12 });
    assert.deepEqual(parseShopIntent('?shopFormat=nphoto-15x21-silk'), { kind: 'print', formatId: 'nphoto-15x21-silk' });
    for (const query of ['shopProduct=0', 'shopProduct=-1', 'shopProduct=1.5', 'shopProduct=9007199254740992', 'shopProduct=12&shopProduct=13', 'shopProduct=12&shopFormat=x', 'shopFormat=../../secret', 'shopFormat=x%2Fy', 'redirect=https://evil.test']) assert.equal(parseShopIntent(query), null, query);
    const href = shopAccountHref({ kind: 'product', productId: 12 });
    assert.equal(safeReturnTo(new URLSearchParams(`returnTo=${encodeURIComponent(href)}`).get('returnTo')), '/konto?shopProduct=12');
    assert.equal(shopGalleryHref('own-gallery-code', { kind: 'product', productId: 12 }), '/galeria/own-gallery-code?shopProduct=12');
    assert.throws(() => shopGalleryHref('../admin', { kind: 'product', productId: 12 }));
    window.history.replaceState(null, '', '/qa?shopOrder=55&shopProduct=12&keep=1#photo');
    replaceShopIntent(null);
    assert.equal(window.location.search, '?shopOrder=55&keep=1'); assert.equal(window.location.hash, '#photo');
  });
  await check('Storefront: admin config save/reread renders same names, prices, CTA and structured data', async () => {
    await fresh();
    const saved = validateShopConfig({ ...clone(config), publicOffer: { ...clone(config.publicOffer), title: 'Oferta po zapisie w CMS', buttonLabel: 'Przejdź do moich zdjęć' } });
    publicCatalog = publicShopCatalog(JSON.parse(JSON.stringify(saved)), [{ ...products[0], title: 'Harmonijka rodzinna', price: 15900 }, ...products.slice(1)]);
    await mount(Storefront, {});
    assert.equal(document.querySelector('h2').textContent, 'Oferta po zapisie w CMS');
    assert.ok(document.body.textContent.includes('Harmonijka rodzinna')); assert.ok(document.body.textContent.includes('159,00'));
    const links = [...document.querySelectorAll('a[data-analytics]')]; assert.equal(links.length, 5);
    assert.equal(links[0].getAttribute('href'), '/konto?shopFormat=nphoto-15x21-silk');
    assert.ok(links.every(link => link.textContent.includes('Przejdź do moich zdjęć')));
    const schema = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
    assert.equal(schema.itemListElement.length, 5); assert.equal(schema.itemListElement[1].item.offers.price, '159.00');
    assert.equal(document.querySelector('#produkt-11 img').className, 'h-full w-full object-contain');
    await click(field('Szczegóły produktu: Album PRO')); assert.ok(button('Zamknij szczegóły'));
    await click(field('Pokaż ujęcie produktu 2'));
    assert.equal(document.querySelector('[role="dialog"] article img').getAttribute('src'), 'https://nphoto.com/pro-open.jpg');
    await click(button('Zamknij szczegóły'));
  });
  await check('Storefront: unpublished, zero-price and incompatible-delivery offers never invite purchase', async () => {
    await fresh(); publicCatalog = null; await mount(Storefront, {}); assert.equal(document.querySelector('section'), null);
    await fresh(); publicCatalog.products[0].price = 0; publicCatalog.formats[0].unitAmount = 0; publicCatalog.delivery.courier.enabled = false;
    await mount(Storefront, {});
    assert.equal(document.querySelector('#produkt-11'), null); assert.equal(document.querySelector('#format-nphoto-15x21-silk'), null); assert.equal(document.querySelector('#produkt-14'), null);
    assert.equal(JSON.parse(document.querySelector('script').textContent).itemListElement.length, 2);
  });
  await check('Storefront: account product selection only lists authenticated own galleries and tracks existing actions', async () => {
    await fresh('/konto?shopProduct=12'); await mount(Storefront, { mode: 'account', token: 'own-account-token', onAction: value => actions.push(value) });
    const ownLink = document.querySelector('a[href="/galeria/own-gallery-code?shopProduct=12"]'); assert.ok(ownLink);
    assert.equal(document.activeElement.getAttribute('aria-label'), 'Wybór galerii do produktu');
    assert.equal(document.querySelector('details').open, true);
    await clickLink(ownLink); assert.deepEqual(actions, ['gallery_open']);
    assert.equal(document.querySelector('script'), null);
    const chooseWall = document.querySelector('#produkt-14 button:last-child'); await click(chooseWall);
    assert.deepEqual(actions, ['gallery_open', 'offer_open']); assert.equal(window.location.search, '?shopProduct=14');
    assert.ok(document.querySelector('a[href="/galeria/own-gallery-code?shopProduct=14"]'));
    assert.ok(requests.every(request => request.method === 'GET'));
  });
  await check('Storefront: account offer is compact until opened; no gallery request without a selection', async () => {
    await fresh('/konto'); await mount(Storefront, { mode: 'account', token: 'own-account-token' });
    assert.equal(document.querySelector('details').open, false);
    assert.ok(document.querySelector('summary').textContent.includes(config.publicOffer.title));
    assert.ok(!requests.some(request => request.url === '/api/galleries/client'));
    await click(document.querySelector('summary')); assert.equal(document.querySelector('details').open, true);
    await click(document.querySelector('summary')); assert.equal(document.querySelector('details').open, false);
  });
  await check('Storefront: no-gallery message comes from CMS and empty account never gets another client gallery', async () => {
    await fresh('/konto?shopProduct=13'); galleries = []; publicCatalog.offer.emptyMessage = 'Wiadomość fotografa z CMS';
    await mount(Storefront, { mode: 'account', token: 'own-account-token' });
    assert.ok(document.body.textContent.includes('Wiadomość fotografa z CMS')); assert.equal(document.querySelector('a[href^="/galeria/"]'), null);
    await click(button('Anuluj wybór')); assert.equal(window.location.search, '');
  });
  await check('Storefront: product intent opens correct photo selection, never auto-adds or orders', async () => {
    await fresh('/galeria/own-gallery-code?shopProduct=12&keep=1');
    await mount(Client, { endpoint: '/api/galleries/26/shop', photos });
    assert.ok(document.body.textContent.includes('Album PRO — wybór zdjęć'));
    assert.ok(document.body.textContent.includes('Nic nie zostało jeszcze dodane do koszyka.'));
    assert.equal(window.location.search, '?keep=1'); assert.deepEqual(JSON.parse(sessionStorage.getItem('gallery-shop:/api/galleries/26/shop')), []);
    assert.ok(requests.every(request => request.method === 'GET'));
  });
  await check('Storefront: print intent uses current gallery price, no stale public amount', async () => {
    await fresh('/galeria/own-gallery-code?shopFormat=nphoto-15x21-silk'); clientCatalog.formats[0].unitAmount = 425;
    await mount(Client, { endpoint: '/api/galleries/26/shop', photos });
    assert.equal(field('Format dla zaznaczonych').value, 'nphoto-15x21-silk'); assert.ok(field('Format dla zaznaczonych').textContent.includes('4,25'));
    await click(field('Zaznacz zdjęcie 1')); await click(button('Dodaj zaznaczone do koszyka'));
    assert.equal(JSON.parse(sessionStorage.getItem('gallery-shop:/api/galleries/26/shop'))[0].formatId, 'nphoto-15x21-silk');
  });
  await check('Storefront: missing or disabled gallery product is explained and never silently replaced', async () => {
    await fresh('/galeria/own-gallery-code?shopProduct=999'); await mount(Client, { endpoint: '/api/galleries/26/shop', photos });
    assert.ok(document.body.textContent.includes('Wybrany produkt nie jest dostępny w tej galerii.')); assert.equal(document.querySelector('[aria-label="Zakupy w galerii"] h4')?.textContent, 'Harmonijka');
    assert.equal(window.location.search, ''); assert.deepEqual(JSON.parse(sessionStorage.getItem('gallery-shop:/api/galleries/26/shop')), []);
    await fresh('/galeria/own-gallery-code?shopProduct=12'); clientCatalog.enabled = false; await mount(Client, { endpoint: '/api/galleries/26/shop', photos });
    assert.ok(document.querySelector('[role="status"]').textContent.includes('Wybrany produkt nie jest dostępny')); assert.equal(document.querySelector('[role="dialog"]'), null);
  });
  await check('Storefront: transient network failure preserves intent; retry opens the selected product', async () => {
    await fresh('/galeria/own-gallery-code?shopProduct=12'); failClient = true; await mount(Client, { endpoint: '/api/galleries/26/shop', photos });
    assert.ok(document.body.textContent.includes('Twój wybór jest zachowany.')); assert.equal(window.location.search, '?shopProduct=12');
    failClient = false; await click(button('Wczytaj ofertę ponownie'));
    assert.ok(document.body.textContent.includes('Album PRO — wybór zdjęć')); assert.equal(window.location.search, '');
  });
  await check('Storefront: payment return has priority and does not consume an outstanding product choice', async () => {
    await fresh('/galeria/own-gallery-code?shopOrder=55&shopProduct=12'); await mount(Client, { endpoint: '/api/galleries/26/shop', photos });
    assert.ok(document.body.textContent.includes('Twój koszyk')); assert.ok(!document.body.textContent.includes('Album PRO — wybór zdjęć'));
    assert.equal(window.location.search, '?shopOrder=55&shopProduct=12'); assert.ok(requests.every(request => request.method === 'GET'));
  });
  await check('Storefront: Wall Decor selects exactly one photo and requires courier with correct total', async () => {
    await fresh('/galeria/own-gallery-code?shopProduct=14'); await mount(Client, { endpoint: '/api/galleries/26/shop', photos });
    await click(field('Zaznacz zdjęcie 1')); await click(field('Zaznacz zdjęcie 2'));
    assert.equal(field('Zaznacz zdjęcie 1').checked, false); assert.equal(field('Zaznacz zdjęcie 2').checked, true);
    assert.ok(document.body.textContent.includes('Zdjęcie produktu: 2')); assert.ok(!document.body.textContent.includes('Okładka'));
    await click(button(/Dodaj produkt do koszyka/));
    assert.deepEqual(JSON.parse(sessionStorage.getItem('gallery-shop:/api/galleries/26/shop'))[0].photoIds, [2]);
    await click(button('Dostawa i podsumowanie'));
    const methods = field('Sposób dostawy'); assert.equal(methods.options.length, 1); assert.equal(methods.value, 'courier');
    assert.ok(button('Zamawiam i płacę 209,00 zł')); assert.ok(document.body.textContent.includes('wymaga dostawy kurierem'));
  });
  await check('Storefront: a cart with no compatible delivery cannot submit payment', async () => {
    await fresh('/galeria/own-gallery-code?shopProduct=14'); clientCatalog.delivery.courier.enabled = false;
    await mount(Client, { endpoint: '/api/galleries/26/shop', photos }); await click(field('Zaznacz zdjęcie 1')); await click(button(/Dodaj produkt do koszyka/)); await click(button('Dostawa i podsumowanie'));
    assert.ok(document.body.textContent.includes('Brak wspólnego sposobu dostawy')); assert.ok(button(/Zamawiam i płacę/).disabled);
    assert.ok(requests.every(request => request.method === 'GET'));
  });
  console.log(`${h.log.length} grup testów storefront: PASS`);
  await reset();
})().catch(error => { console.error(error); process.exitCode = 1; });
