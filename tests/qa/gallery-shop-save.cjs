// Real React editor -> authenticated route -> shared catalog loader and client projection.
// Only authentication and database transport are replaced; no external writes.
const h = require('./gallery-shop-dom.cjs');
const { assert, check, mount, reset, button, field, click, set } = h;
const Module = require('node:module');
const { NextRequest, NextResponse } = require('next/server');
let allowed = true, failWrite = false, failRead = false, requests = [];
const clone = value => structuredClone(value);
let products = [
  { id: 1, gallery_id: null, title: 'Album 30×30', description: 'Album testowy', image_url: 'https://nphoto.com/album.jpg', price: 30000, is_active: false },
  { id: 3, gallery_id: null, title: 'Album PRO', description: 'Album testowy', image_url: 'https://nphoto.com/pro.jpg', price: 30000, is_active: false },
  { id: 10, gallery_id: 12, title: 'Album prywatny', description: 'Tylko w galerii', price: 10000, is_active: true },
];
let settings = new Map();
function matches(row, where) {
  return Object.entries(where).every(([key, value]) => key === 'OR' ? value.some(part => matches(row, part)) : value && typeof value === 'object' && 'in' in value ? value.in.includes(row[key]) : value && typeof value === 'object' && 'not' in value ? row[key] != value.not : value === null ? row[key] == null : row[key] === value);
}
const db = {
  setting: {
    findUnique: async ({ where }) => settings.has(where.setting_key) ? { setting_value: settings.get(where.setting_key) } : null,
    upsert: async ({ where, create, update }) => {
      if (failWrite) throw new Error('Simulated database failure');
      const row = settings.has(where.setting_key) ? update : create;
      settings.set(where.setting_key, row.setting_value); return clone(row);
    },
  },
  galleryProduct: {
    create: async ({data}) => { const product={id:Math.max(...products.map(p=>p.id))+1,archived_at:null,...clone(data)}; products.push(product);return clone(product); },
    findFirst: async ({where})=>clone(products.find(p=>matches(p,where)) || null),
    updateMany: async ({where,data})=>{const selected=products.filter(p=>matches(p,where));selected.forEach(p=>Object.assign(p,clone(data)));return {count:selected.length};},
    findMany: async ({ where }) => clone(products.filter(product => matches(product, where))),
    update: async ({ where, data }) => {
      const product = products.find(product => matches(product, where));
      assert.ok(product); Object.assign(product, clone(data)); return clone(product);
    },
  },
  clientGallery: { findUnique: async () => ({ id: 12 }) },
  nphotoAlbum: { findMany: async () => [] }, photoOrder: { findMany: async () => [] },
  $transaction: async (fn, options) => {
    assert.equal(options.isolationLevel, 'Serializable');
    const previousProducts = clone(products), previousSettings = clone(settings);
    try { return await fn(db); } catch (error) { products = previousProducts; settings = previousSettings; throw error; }
  },
};
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === '@/lib/db/prisma') return { __esModule: true, default: db };
  if (name === '@/lib/auth/middleware') return { withAuth: async (request, fn) => allowed ? fn() : NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  return originalLoad.call(this, name, ...args);
};
const route = require('../../src/app/api/admin/galleries/[id]/shop/route.ts');
const { loadGalleryShop } = require('../../src/lib/galleries/merchandise-server.ts');
const { defaultShopConfig } = require('../../src/lib/galleries/merchandise.ts');
const { defaultPublicOffer, publicShopCatalog } = require('../../src/lib/galleries/public-offer.ts');
const Admin = require('../../src/components/admin/GalleryShopAdmin.tsx').default;
const Client = require('../../src/components/galleries/GalleryShoppingPanel.tsx').default;
const config = { ...defaultShopConfig(), enabled: true, publicOffer: { ...defaultPublicOffer(), enabled: true, productIds: [1, 3] }, productRules: { 1: { minPhotos: 1, maxPhotos: 50 }, 3: { minPhotos: 1, maxPhotos: 50 } }, delivery: { locker: { enabled: true, amount: 1700 }, courier: { enabled: true, amount: 2500 } } };
settings.set('gallery_shop_default', JSON.stringify(config));
const send = (body, id = 'default') => route.PUT(new NextRequest('http://localhost/api/admin/galleries/default/shop', { method: 'PUT', body: JSON.stringify(body) }), { params: Promise.resolve({ id }) });
global.fetch = async (url, init = {}) => {
  const method = init.method || 'GET'; requests.push({ url, method, body: init.body && JSON.parse(init.body) });
  if (url === '/api/galleries/12/shop') return Response.json({ success: true, catalog: (await loadGalleryShop(12)).catalog });
  const itemMatch=String(url).match(/^\/api\/admin\/galleries\/(default|12)\/shop\/products(?:\/(\d+))?$/);
  if(itemMatch) { const handler=itemMatch[2]?require('../../src/app/api/admin/galleries/[id]/shop/products/[productId]/route.ts'):require('../../src/app/api/admin/galleries/[id]/shop/products/route.ts');return handler[method](new NextRequest(`http://localhost${url}`,init),{params:Promise.resolve({id:itemMatch[1],productId:itemMatch[2]})}); }
  const match = String(url).match(/^\/api\/admin\/galleries\/(default|12)\/shop$/); assert.ok(match, url);
  if (method === 'GET' && failRead) throw new Error('Simulated read failure');
  return route[method](new NextRequest(`http://localhost${url}`, init), { params: Promise.resolve({ id: match[1] }) });
};
const save = () => button('Zapisz ustawienia sklepu');
async function admin(id = 'default') { await reset(); await mount(Admin, { galleryId: id }); }
const changed = (id, patch) => { const expected = clone(products.find(product => product.id === id)); return { id, expected, data: { ...expected, ...patch } }; };

(async () => {
  await check('checkbox on/off/revert activates the one save and preserves drafts until saved', async () => {
    await admin(); assert.ok(save().disabled);
    await click(field('Produkt #1 widoczny')); assert.equal(save().disabled, false);
    assert.match(document.body.textContent, /Niezapisane zmiany/);
    assert.equal(products[0].is_active, false);
    await click(field('Produkt #1 widoczny')); assert.ok(save().disabled);
    await click(field('Produkt #1 widoczny')); await click(field('Produkt #3 widoczny'));
    await click(save()); assert.ok(save().disabled);
    assert.equal(products[0].is_active, true); assert.equal(products[1].is_active, true);
    const writes = requests.filter(request => request.method === 'PUT'); assert.equal(writes.length, 1); assert.equal(writes[0].body.productEdits.length, 2);
    assert.equal(writes[0].body.config, undefined);
    await admin(); assert.equal(field('Produkt #1 widoczny').checked, true); assert.ok(save().disabled);
    const shop = await loadGalleryShop(null); assert.equal(publicShopCatalog(shop.config, shop.catalog.products).products.length, 2);
  });
  await check('hiding saves and disappears from the real client product selector after reload', async () => {
    await click(field('Produkt #1 widoczny')); await click(save()); await admin(); assert.equal(field('Produkt #1 widoczny').checked, false);
    await reset(); sessionStorage.clear(); await mount(Client, { endpoint: '/api/galleries/12/shop', photos: [{ id: 1, file_url: '/one.jpg' }] });
    await click(button(config.buttonLabel)); await click(button('Produkty'));
    assert.ok(![...document.querySelectorAll('button')].some(button => button.textContent === 'Wybierz produkt: Album 30×30'));
    assert.ok(button('Wybierz produkt: Album PRO'));
  });
  await check('products, media, prices, photo limits and delivery commit together', async () => {
    await admin(); await click(field('Produkt #1 widoczny'));
    await set(field('Cena produktu #3 (zł)'), '350');
    await set(field('Produkt #1 minimum zdjęć'), 15);
    await set(field('Dodatkowe zdjęcia produktu #1 (adres w każdym wierszu)'), 'https://nphoto.com/inside.jpg\n\n');
    await set(field('Cena dostawy Paczkomat (zł)'), 17);
    await click(save()); assert.ok(save().disabled);
    const shop = await loadGalleryShop(null);
    assert.equal(shop.config.productRules[1].minPhotos, 15);
    assert.equal(shop.catalog.products.find(product => product.id === 3).price, 35000);
    assert.deepEqual(shop.catalog.products.find(product => product.id === 1).preview_images, ['https://nphoto.com/inside.jpg']);
  });
  await check('validation, failed transaction and failed authorization keep drafts and leave every stored value unchanged', async () => {
    await set(field('Cena produktu #3 (zł)'), 0); const before = requests.length;
    await click(save()); assert.equal(requests.length, before); assert.equal(save().disabled, false); assert.match(document.querySelector('[role=alert]').textContent, /Produkt #3/);
    await set(field('Cena produktu #3 (zł)'), 400); await set(field('Opis sklepu'), 'Opis po zmianie');
    const snapshot = clone(products), oldConfig = settings.get('gallery_shop_default');
    failWrite = true; await click(save()); failWrite = false;
    assert.deepEqual(products, snapshot); assert.equal(settings.get('gallery_shop_default'), oldConfig); assert.equal(field('Cena produktu #3 (zł)').value, '400'); assert.equal(save().disabled, false);
    allowed = false; await click(save()); allowed = true;
    assert.deepEqual(products, snapshot); assert.equal(save().disabled, false);
    await click(save()); assert.equal(products[1].price, 40000); assert.equal(JSON.parse(settings.get('gallery_shop_default')).introduction, 'Opis po zmianie');
  });
  await check('product-only save keeps an inherited gallery on the shared price list', async () => {
    await admin(12); assert.equal(settings.has('gallery_shop_12'), false);
    await click(field('Produkt #10 widoczny')); await click(save());
    assert.equal(settings.has('gallery_shop_12'), false); assert.equal((await loadGalleryShop(12)).inherited, true);
    await admin(12); assert.equal(field('Produkt #10 widoczny').checked, false);
  });
  await check('server rejects foreign products, duplicate edits, invalid later edits and stale concurrent edits atomically', async () => {
    const snapshot = clone(products), oldConfig = settings.get('gallery_shop_default');
    const edits = [changed(1, { price: 50000 }), changed(10, { is_active: true })];
    assert.equal((await send({ productEdits: edits, config })).status, 404);
    assert.equal((await send({ productEdits: [edits[0], edits[0]] })).status, 400);
    assert.equal((await send({ productEdits: [edits[0], changed(3, { price: -1 })] })).status, 400);
    assert.deepEqual(products, snapshot); assert.equal(settings.get('gallery_shop_default'), oldConfig);
    const stale = changed(3, { is_active: false }); products[1].price = 41000;
    assert.equal((await send({ productEdits: [edits[0], stale], config })).status, 409);
    assert.equal(products[0].price, snapshot[0].price); assert.equal(products[1].is_active, true); assert.equal(products[1].price, 41000);
  });
  await check('confirmed save followed by failed refresh reports saved state instead of offering a stale duplicate write', async () => {
    await admin(); await click(field('Produkt #3 widoczny')); failRead = true;
    await click(save()); failRead = false;
    assert.equal(products[1].is_active, false); assert.ok(save().disabled);
    assert.match(document.querySelector('[role=alert]').textContent, /Zmiany zostały zapisane/);
    await admin(); assert.equal(field('Produkt #3 widoczny').checked, false);
  });
  await check('own product create, media edit, publish, archive and restore in the same admin for three rounds',async()=>{
    for(let round=0;round<3;round++) {
      await admin();await set(field('Nazwa nowego produktu'),`Własny album ${round}`);await set(field('Cena nowego produktu (zł)'),125.50);
      await click(button('Dodaj własny produkt'));const product=products.at(-1),id=product.id;
      assert.equal(product.price,12550);assert.equal(product.is_active,false);
      await set(field(`Opis produktu #${id}`),'Opis własnego albumu');await set(field(`Adres zdjęcia produktu #${id}`),'https://example.com/album.jpg');
      await click(field(`Produkt #${id} widoczny`));await click(save());await admin();
      assert.equal(field(`Produkt #${id} widoczny`).checked,true);assert.ok((await loadGalleryShop(12)).catalog.products.some(p=>p.id===id));
      const originalTitle=product.title;
      await click(button(`Usuń produkt #${id}`));await click(button('Anuluj usunięcie'));assert.equal(products.at(-1).archived_at,null);
      await click(button(`Usuń produkt #${id}`));await click(button('Potwierdź usunięcie'));
      assert.ok(products.at(-1).archived_at);assert.equal(products.at(-1).is_active,false);assert.equal((await loadGalleryShop(12)).catalog.products.some(p=>p.id===id),false);
      await admin();assert.ok(!document.body.textContent.includes(`Nazwa produktu #${id}`));
      await click(button(`Przywróć produkt #${id}`));assert.equal(products.at(-1).archived_at,null);assert.equal(products.at(-1).is_active,false);
      assert.equal(field(`Opis produktu #${id}`).value,'Opis własnego albumu');assert.equal(products.find(p=>p.id===id).title,originalTitle);
    }
  });
  await check('archive rejects unauthorized, foreign and stale requests, is repeatable and blocks stale publication',async()=>{
    const handler=require('../../src/app/api/admin/galleries/[id]/shop/products/[productId]/route.ts');
    const product=products.at(-1), expected=clone(product);
    const remove=(id='default',snapshot=expected)=>handler.DELETE(new NextRequest('http://localhost/product',{method:'DELETE',body:JSON.stringify({expected:snapshot})}),{params:Promise.resolve({id,productId:String(product.id)})});
    allowed=false;assert.equal((await remove()).status,401);allowed=true;
    assert.equal((await remove('12')).status,404);products.find(p=>p.id===product.id).price+=1;assert.equal((await remove()).status,409);
    assert.equal((await remove('default',products.find(p=>p.id===product.id))).status,200);assert.equal((await remove('default',products.find(p=>p.id===product.id))).status,200);
    assert.equal((await send({productEdits:[{id:product.id,expected:products.find(p=>p.id===product.id),data:{...product,is_active:true}}]})).status,404);
    const {productsReadyToPublish}=require('../../src/lib/galleries/shop-publication.ts');
    assert.equal(productsReadyToPublish({...config,publicOffer:{...config.publicOffer,productIds:[product.id]}},[products.find(p=>p.id===product.id)]).length,0);
  });
  await reset(); console.log(`${h.log.length} unified shop save groups: PASS (database and authentication mocked).`);
})().catch(error => { console.error(error); process.exitCode = 1; });
