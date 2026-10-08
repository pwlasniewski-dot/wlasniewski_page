const {assert,React,mount,reset,click,field,set,flush}=require('./qa/gallery-shop-dom.cjs');
const Settings=require('../src/components/admin/PublicShopOfferSettings.tsx').default;
const Storefront=require('../src/components/shop/PhotoProductStorefront.tsx').default;
const ProductPage=require('../src/components/shop/ProductPersonalizationPage.tsx').default;
const {defaultShopConfig,validateShopConfig,readShopConfig}=require('../src/lib/galleries/merchandise.ts');
const {defaultPublicOffer,validatePublicOffer,publicShopCatalog}=require('../src/lib/galleries/public-offer.ts');
const {rememberGalleryProduct,readGalleryProduct,shopGalleryOfferHref}=require('../src/lib/galleries/shop-intent.ts');
let saved;
function Admin(){const[value,onChange]=React.useState(defaultPublicOffer());saved=value;return React.createElement(Settings,{value,onChange,formats:[],products:[],shopEnabled:true,delivery:defaultShopConfig().delivery,productRules:{},disabled:false});}
const spec={version:1,provider:'prodigi',environment:'sandbox',productId:50,sku:'GLOBAL-FAP-11X14',variant:{attributes:{},printAreaSizes:{default:{horizontalResolution:3307,verticalResolution:4192}}},requiredAssets:['default'],shippingMethod:'Budget',ordersEnabled:false,liveQualified:false,destination:'PL'};
(async()=>{
 await mount(Admin,{});
 const edits=[['Przycisk na kafelku produktu','Otwórz obraz'],['Nagłówek dodawania zdjęcia na produkcie','Zobacz swoją fotografię na obrazie'],['Przycisk wyboru własnego pliku','Moje zdjęcie'],['Przycisk wyboru zdjęcia z galerii','Moja galeria'],['Przycisk dodawania produktu do koszyka','Dodaj mój obraz'],['Tytuł propozycji galerii','Więcej kadrów'],['Opis propozycji galerii','Wybierz dodatkowe zdjęcia do swoich produktów.'],['Przycisk propozycji galerii','Otwórz moją galerię'],['Przycisk powrotu z galerii do produktu','Wróć do mojego obrazu'],['Informacja o zakupie zdjęć i produktów','Zdjęcia i produkty mają osobne płatności.']];
 for(const[label,value]of edits)await set(field(label),value);
 await click(field('Pozwól klientom dodawać własne zdjęcia do produktów'));
 const config=defaultShopConfig();config.enabled=true;config.delivery.courier={enabled:true,amount:2000};config.publicOffer={...saved,enabled:true,productIds:[50]};
 const reread=readShopConfig(JSON.stringify(validateShopConfig(config)));
 const catalog=publicShopCatalog(reread,[{id:50,title:'Fine art',description:'Opis produktu z CMS',price:9900,minPhotos:1,maxPhotos:1,image_url:'/product.jpg',prodigi:spec}]);
 assert.equal(catalog.offer.productOpenLabel,'Otwórz obraz');assert.equal(catalog.offer.galleryUpsellTitle,'Więcej kadrów');assert.equal(catalog.offer.productReturnLabel,'Wróć do mojego obrazu');assert.equal(catalog.offer.galleryPurchaseNotice,'Zdjęcia i produkty mają osobne płatności.');
 assert.throws(()=>validatePublicOffer({...catalog.offer,productAddToCartLabel:''}));
 assert.throws(()=>validatePublicOffer({...catalog.offer,galleryUpsellEnabled:'yes'}));
 let requests=[];global.fetch=async(url)=>{requests.push(url);return{ok:true,json:async()=>({success:true,catalog})}};
 await reset();window.history.replaceState(null,'','/karta-podarunkowa');await mount(Storefront,{});
 const triggers=[()=>document.querySelector('[aria-label="Zobacz produkt: Fine art"]'),()=>document.querySelector('article h3 button'),()=>document.querySelector('[aria-label="Szczegóły produktu: Fine art"]'),()=>[...document.querySelectorAll('button')].find(b=>b.textContent.startsWith('Otwórz obraz'))];
 for(const trigger of triggers){
  await click(trigger());const dialog=document.querySelector('[role="dialog"]');assert.ok(dialog);assert.ok(field('Zdjęcie do podglądu produktu'));assert.ok(dialog.textContent.includes('Zobacz swoją fotografię na obrazie'));assert.ok(dialog.textContent.includes('Moja galeria'));assert.ok(dialog.textContent.includes('Dodaj mój obraz'));assert.ok(dialog.textContent.includes('Opis produktu z CMS'));assert.equal(window.location.hash,'');
  assert.equal(requests.filter(url=>url.includes('/personalization/session')).length,0);
  await click(document.querySelector('[aria-label="Zamknij podgląd produktu"]'));
 }
 await reset();window.history.replaceState(null,'','/sklep/personalizacja?shopProduct=50');await mount(ProductPage,{});await flush();assert.ok(document.querySelector('[role="dialog"]'));assert.ok(field('Zdjęcie do podglądu produktu'));assert.equal(document.querySelector('[aria-label="Produkt do personalizacji"]'),null);assert.equal(document.querySelector('[aria-label="Twoje zdjęcia do personalizacji"]'),null);
 rememberGalleryProduct('own-gallery',{kind:'product',productId:50});assert.deepEqual(readGalleryProduct('own-gallery'),{kind:'product',productId:50});assert.equal(shopGalleryOfferHref('own-gallery',readGalleryProduct('own-gallery')),'/galeria/own-gallery?shopProduct=50&shopGalleryOffer=1#dodatkowe-zdjecia');assert.equal(readGalleryProduct('other-gallery'),null);
 sessionStorage.setItem('gallery-product-intent:tampered','shopProduct=0&next=https://example.com');assert.equal(readGalleryProduct('tampered'),null);
 await reset();console.log('PASS CMS controls → validated saved config → storefront all four entries → same immediate upload/product view; standalone deep link; digital purchase continuation');
})().catch(error=>{console.error(error);process.exitCode=1;});
