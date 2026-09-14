// Verify the catalog read back from the isolated database. No provider calls or orders.
const h = require('../tests/qa/gallery-shop-dom.cjs');
const { assert, mount, reset, field, button, click } = h;
const Module = require('node:module');
const snapshot = require('../docs/NPHOTO_QA_CATALOG.json');
assert.equal(snapshot.environment, 'isolated-qa');
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === '@/lib/db/prisma') return { __esModule: true, default: {
    setting: { findUnique: async ({ where }) => ({ setting_value: JSON.stringify(where.setting_key === 'gallery_shop_26' ? snapshot.galleryConfig : snapshot.config) }) },
    galleryProduct: { findMany: async ({ where }) => snapshot.products.filter(p => where.OR ? where.OR.some(rule => p.gallery_id === rule.gallery_id) : p.gallery_id === where.gallery_id) },
  } };
  return originalLoad.call(this, name, ...args);
};
const { loadGalleryShop } = require('../src/lib/galleries/merchandise-server.ts');
const { publicShopCatalog } = require('../src/lib/galleries/public-offer.ts');
const { priceShopCart, validateShopConfig } = require('../src/lib/galleries/merchandise.ts');
const Storefront = require('../src/components/shop/PhotoProductStorefront.tsx').default;

(async () => {
  const shared = await loadGalleryShop(null);
  const client = await loadGalleryShop(26);
  validateShopConfig(shared.config);
  assert.deepEqual(client.catalog.products, shared.catalog.products);
  assert.deepEqual(client.config.formats.map(f => f.unitAmount), [250, 150]);
  assert.deepEqual(client.catalog.products.map(p => [p.id, p.minPhotos, p.maxPhotos]), [[6,12,12],[7,20,20],[8,16,16],[9,1,1]]);
  const publicCatalog = publicShopCatalog(shared.config, shared.catalog.products);
  assert.equal(publicCatalog.products.length, 4);
  assert.equal(publicCatalog.formats.length, 1);
  assert.equal(publicCatalog.formats[0].unitAmount, 250);
  const allowed = Array.from({length: 20}, (_, i) => i + 1);
  const locker = {method:'locker',recipientName:'Test Katalogu',email:'catalog-qa@example.test',phone:'500000000',pointCode:'TOR01M'};
  const courier = {...locker,method:'courier',address:{street:'Testowa 1',postalCode:'87-100',city:'Toruń'}};
  const lines = client.catalog.products.map(p => ({id:`product-${p.id}`,kind:'product',productId:p.id,photoIds:allowed.slice(0,p.minPhotos),coverPhotoId:1,quantity:1}));
  const print = (id,photoId,quantity) => ({id,kind:'print',photoId,formatId:'nphoto-15x21-silk',quantity,crop:{mode:'fit',x:50,y:50,zoom:1},confirmed:true});
  const totals = [5854,27470,15759,14424];
  lines.forEach((line, i) => assert.equal(priceShopCart(client.catalog,[line],i===3?courier:locker,allowed).total,totals[i]));
  assert.throws(() => priceShopCart(client.catalog,[lines[3]],locker,allowed));
  assert.throws(() => priceShopCart(client.catalog,[{...lines[1],photoIds:allowed.slice(0,5)}],courier,allowed));
  const prints = [print('print-a',1,2),print('print-b',2,8)];
  assert.equal(priceShopCart(client.catalog,prints,locker,allowed).total,4200);
  const mixed = priceShopCart(client.catalog,[...lines,...prints],courier,allowed);
  assert.equal(mixed.total,60907);
  assert.equal(mixed.delivery.amount,2500);
  assert.equal(mixed.lines.filter(l=>l.kind==='print').reduce((sum,l)=>sum+l.quantity,0),10);
  global.fetch = async url => {
    assert.equal(url,'/api/shop/catalog');
    return Response.json({success:true,catalog:publicCatalog});
  };
  await mount(Storefront, {});
  assert.equal(document.querySelectorAll('article').length,5);
  assert.equal(document.querySelectorAll('a[data-analytics]').length,5);
  for (const product of publicCatalog.products) {
    assert.ok(document.querySelector(`#produkt-${product.id} img`).getAttribute('src').includes('wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/'));
    await click(field(`Szczegóły produktu: ${product.title}`));
    const dialog=document.querySelector('[role="dialog"]');
    assert.ok(dialog.textContent.includes(product.description.split('\n\n')[1]));
    await click(button('Zamknij szczegóły'));
  }
  await reset();
  console.log(JSON.stringify({result:'PASS',source:'isolated database readback',publicItems:5,clientPrintFormats:2,individualTotals:totals.map(n=>n/100),tenPrintsWithLocker:42,mixedBasketWithCourier:609.07,providerCalls:0,ordersCreated:0}));
})().catch(error => {console.error(error);process.exitCode=1;});
