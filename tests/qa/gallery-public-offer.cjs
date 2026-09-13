const {assert,check,log,React,mount,reset,field,set,click}=require('./gallery-shop-dom.cjs');
const Module=require('node:module');
let adminAllowed=true,dbFails=false;
const settings=new Map();
const products=[
 {id:1,gallery_id:null,title:'Fotoalbum PRO',description:'20×20 cm · 10 rozkładówek',price:30000,is_active:true,product_type:'album',image_url:null,nphoto_url:'https://nphoto.com/pl/fotoalbumy/fotoalbum-pro',nphoto_product_id:'supplier-private-id'},
 {id:2,gallery_id:null,title:'Fotoobraz',description:'40×60 cm',price:20000,is_active:true,product_type:'wall-decor',image_url:null},
 {id:3,gallery_id:null,title:'Lite szkic',price:0,is_active:false},
 {id:99,gallery_id:12,title:'Tylko prywatna galeria',price:12300,is_active:true},
];
const matches=(p,where)=>Object.entries(where).every(([key,value])=>key==='OR'?value.some(branch=>matches(p,branch)):p[key]===value);
const db={
 setting:{findUnique:async({where})=>{if(dbFails)throw Error('DB offline');return settings.has(where.setting_key)?{setting_value:settings.get(where.setting_key)}:null},upsert:async({where,create,update})=>{const row=settings.has(where.setting_key)?update:create;settings.set(where.setting_key,row.setting_value);return row}},
 galleryProduct:{findMany:async({where})=>products.filter(p=>matches(p,where))},
 clientGallery:{findUnique:async()=>({id:12})},nphotoAlbum:{findMany:async()=>[]},photoOrder:{findMany:async()=>[]},
};
const original=Module._load;
Module._load=function(request,parent,isMain){
 if(request==='@/lib/db/prisma')return {__esModule:true,default:db};
 if(request==='@/lib/auth/middleware')return {withAuth:async(req,fn)=>adminAllowed?fn():require('next/server').NextResponse.json({error:'Unauthorized'},{status:401})};
 if(request==='@/lib/shipping/inpost-point')return {verifyParcelPoint:async()=>{throw Error('Unexpected carrier call')}};
 if(request==='./individual-access')return {authorizeIndividualGallery:async()=>({allowed:true})};
 if(request==='@/lib/auth/parent-jwt')return {};
 if(request==='@/lib/payu')return {createPayUOrder:async()=>{throw Error('Unexpected payment call')}};
 return original.apply(this,arguments);
};
const {NextRequest}=require('next/server');
const {defaultPublicOffer,validatePublicOffer}=require('../../src/lib/galleries/public-offer.ts');
const {defaultShopConfig,validateShopConfig,priceShopCart}=require('../../src/lib/galleries/merchandise.ts');
const {availableShopDelivery}=require('../../src/lib/galleries/shop-delivery.ts');
const {loadGalleryShop}=require('../../src/lib/galleries/merchandise-server.ts');
const {PUT,GET}=require('../../src/app/api/admin/galleries/[id]/shop/route.ts');
const publicGET=require('../../src/app/api/shop/catalog/route.ts').GET;
const ctx={params:Promise.resolve({id:'default'})};
const req=config=>new NextRequest('https://example.test/api/admin/shop',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({config})});
const config={...defaultShopConfig(),enabled:true,formats:[{id:'nphoto-15x21-silk',label:'15×21 cm',paper:'Fuji Silk',widthMm:152,heightMm:210,unitAmount:350,active:true}],productRules:{1:{minPhotos:2,maxPhotos:20},2:{minPhotos:1,maxPhotos:1,deliveryMethods:['courier']}},delivery:{locker:{enabled:true,amount:1500},courier:{enabled:true,amount:2200}},publicOffer:{...defaultPublicOffer(),enabled:true,productIds:[2,1,3,99],formatIds:['nphoto-15x21-silk']}};
(async()=>{
 await check('old shop config remains valid and public presentation is opt-in',async()=>{
  assert.equal(validateShopConfig(defaultShopConfig()).publicOffer,undefined);
  settings.set('gallery_shop_default',JSON.stringify({...config,publicOffer:undefined}));assert.equal((await(await publicGET()).json()).catalog,null);
  settings.set('gallery_shop_default',JSON.stringify({...config,enabled:false}));assert.equal((await(await publicGET()).json()).catalog,null);
 });
 await check('public presentation validates IDs, media, content and layout',async()=>{
  for(const patch of [{enabled:'true'},{title:''},{productIds:[1,1]},{productIds:[-1]},{formatIds:['../../private']},{layout:'arbitrary-css'},{printImageUrl:'javascript:alert(1)'},{printImageUrl:'https://user:pass@example.test/a.jpg'},{printImageUrl:'https://example.test/a.jpg',printImageAlt:''}])assert.throws(()=>validatePublicOffer({...defaultPublicOffer(),...patch}));
  assert.equal(validatePublicOffer({...defaultPublicOffer(),adminSecret:'not-public'}).adminSecret,undefined);
  for(const deliveryMethods of [[],['drone'],['locker','locker']])assert.throws(()=>validateShopConfig({...config,productRules:{2:{minPhotos:1,maxPhotos:1,deliveryMethods}}}));
 });
 await check('actual admin save is authorized; reread and public endpoint use same prices and ordered data',async()=>{
  const before=settings.get('gallery_shop_default');adminAllowed=false;assert.equal((await PUT(req(config),ctx)).status,401);assert.equal(settings.get('gallery_shop_default'),before);adminAllowed=true;
  assert.equal((await PUT(req(config),ctx)).status,200);
  const reread=await(await GET(req(config),ctx)).json();assert.equal(reread.config.publicOffer.title,config.publicOffer.title);
  const response=await publicGET();assert.equal(response.headers.get('cache-control'),'no-store');const result=await response.json();
  assert.deepEqual(result.catalog.products.map(p=>p.id),[2,1]);assert.deepEqual(result.catalog.offer.productIds,[2,1]);assert.equal(result.catalog.formats[0].unitAmount,350);
  assert.equal(result.catalog.products[1].price,30000);assert.equal(result.catalog.products[1].nphoto_product_id,undefined);assert.equal(result.catalog.products[1].nphoto_url,undefined);assert.ok(!JSON.stringify(result).includes('Tylko prywatna'));
 });
 await check('price edits propagate to public and new galleries; existing local overrides are preserved',async()=>{
  products[0].price=32000;
  assert.equal((await(await publicGET()).json()).catalog.products[1].price,32000);assert.equal((await loadGalleryShop(45)).catalog.products[0].price,32000);
  settings.set('gallery_shop_12',JSON.stringify({...config,title:'Własna oferta',formats:[{...config.formats[0],unitAmount:400}],productRules:{2:{minPhotos:1,maxPhotos:1}}}));
  const local=await loadGalleryShop(12);assert.equal(local.catalog.title,'Własna oferta');assert.equal(local.catalog.formats[0].unitAmount,400);assert.equal((await(await publicGET()).json()).catalog.formats[0].unitAmount,350);
  assert.deepEqual(local.catalog.products.find(p=>p.id===2).deliveryMethods,['courier']);
 });
 await check('mixed basket requires courier for large canvas, validates on server, and preserves print pricing',async()=>{
  const {catalog}=await loadGalleryShop(45);
  const lines=[{id:'print',kind:'print',photoId:1,formatId:'nphoto-15x21-silk',quantity:2,crop:{mode:'fit',x:50,y:50,zoom:1},confirmed:true},{id:'canvas',kind:'product',productId:2,photoIds:[1],coverPhotoId:1,quantity:1}];
  const delivery={method:'locker',recipientName:'Anna Testowa',email:'anna@example.test',phone:'501222333',pointCode:'TOR01M',address:{street:'Testowa 1',postalCode:'87-100',city:'Toruń'}};
  assert.equal(availableShopDelivery(catalog,lines).locker.enabled,false);assert.equal(availableShopDelivery(catalog,lines).courier.enabled,true);
  assert.throws(()=>priceShopCart(catalog,lines,delivery,[1]),/dostawa nie obsługuje/);
  const priced=priceShopCart(catalog,lines,{...delivery,method:'courier'},[1]);assert.equal(priced.total,22900);assert.equal(priced.lines[1].coverPhotoId,1);
  assert.equal(availableShopDelivery(catalog,[lines[0]]).locker.enabled,true);
  assert.equal(availableShopDelivery(catalog,[{...lines[1],productId:999}]).courier.enabled,false);
 });
 await check('hidden or removed products immediately disappear and an empty public offer renders nothing',async()=>{
  const saved=settings.get('gallery_shop_default');settings.set('gallery_shop_default',JSON.stringify({...config,publicOffer:{...config.publicOffer,formatIds:[],productIds:[3,99]}}));
  assert.equal((await(await publicGET()).json()).catalog,null);settings.set('gallery_shop_default',saved);
 });
 await check('courier-only product is not offered when courier is unavailable',async()=>{
  const saved=settings.get('gallery_shop_default');settings.set('gallery_shop_default',JSON.stringify({...config,delivery:{...config.delivery,courier:{enabled:false,amount:2200}}}));
  assert.equal((await loadGalleryShop(45)).catalog.products.some(p=>p.id===2),false);
  assert.equal((await(await publicGET()).json()).catalog.products.some(p=>p.id===2),false);settings.set('gallery_shop_default',saved);
 });
 await check('CMS edits and ordering controls update serializable public settings',async()=>{
  const Editor=require('../../src/components/admin/PublicShopOfferSettings.tsx').default;
  let current=config.publicOffer;
  function View(){const [value,setValue]=React.useState(current);return React.createElement(Editor,{value,formats:config.formats,products:products.filter(p=>p.gallery_id===null),shopEnabled:true,delivery:config.delivery,productRules:config.productRules,disabled:false,onChange:v=>{current=v;setValue(v)}})}
  await mount(View,{});await set(field('Tytuł prezentacji'),'Pamiątki po Twojemu');await set(field('Przycisk wyboru zdjęć'),'Wybieram fotografie');
  assert.equal(current.title,'Pamiątki po Twojemu');assert.equal(current.buttonLabel,'Wybieram fotografie');
  await click(document.querySelector('[aria-label="Przesuń produkt 1 wyżej"]'));assert.deepEqual(current.productIds.slice(0,2),[1,2]);
  const checked=validateShopConfig({...config,publicOffer:current});assert.equal((await PUT(req(checked),ctx)).status,200);
  const actual=await(await publicGET()).json();assert.equal(actual.catalog.offer.title,'Pamiątki po Twojemu');assert.equal(actual.catalog.products[0].id,1);await reset();
 });
 await check('temporary catalogue failure is explicit and does not leak internals',async()=>{
  dbFails=true;const response=await publicGET();assert.equal(response.status,503);assert.ok(!JSON.stringify(await response.json()).includes('DB offline'));dbFails=false;
 });
 console.log(JSON.stringify({checks:log.length,externalOrders:0}));
})().catch(e=>{console.error(e);process.exitCode=1});
