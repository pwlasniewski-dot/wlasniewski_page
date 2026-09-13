/* In-memory route + real React DOM tests; no credentials, paid calls, or live records. */
const {assert,check,log,mount,reset,button,click,flush,act}=require('./gallery-shop-dom.cjs');
const Module=require('node:module');
let adminAllowed=true,transactionCalls=0,writes=0,conflict=false,failAtProduct=0;
const settings=new Map();
let products=[];
const matches=(row,where)=>Object.entries(where).every(([key,value])=>value&&typeof value==='object'?'in' in value&&value.in.includes(row[key]):row[key]===value);
const tx={
 setting:{findUnique:async({where})=>settings.has(where.setting_key)?{setting_value:settings.get(where.setting_key)}:null,upsert:async({where,create,update})=>{writes++;const row=settings.has(where.setting_key)?update:create;settings.set(where.setting_key,row.setting_value);return row}},
 galleryProduct:{findFirst:async({where})=>products.find(row=>matches(row,where))??null,create:async({data})=>{if(failAtProduct===products.length+1)throw Error('Injected failure');writes++;const product={id:Math.max(0,...products.map(p=>p.id))+1,...data};products.push(product);return product}},
};
const db={$transaction:async(fn,options)=>{transactionCalls++;assert.equal(options.isolationLevel,'Serializable');if(conflict)throw {code:'P2034'};const savedProducts=structuredClone(products),savedSettings=[...settings];try{return await fn(tx)}catch(error){products=savedProducts;settings.clear();savedSettings.forEach(([key,value])=>settings.set(key,value));throw error}}};
const originalLoad=Module._load;
Module._load=function(request,parent,isMain){
 if(request==='@/lib/auth/middleware')return {withAuth:async(req,fn)=>adminAllowed?fn():require('next/server').NextResponse.json({error:'Unauthorized'},{status:401})};
 if(request==='@/lib/db/prisma')return {__esModule:true,default:db};
 if(request==='@/lib/galleries/merchandise-server')return {shopSettingKey:()=> 'gallery_shop_default',shopError:error=>require('next/server').NextResponse.json({success:false,error:error.message||'Conflict'},{status:error.status||500})};
 return originalLoad.apply(this,arguments);
};
const {NextRequest}=require('next/server');
const {defaultShopConfig}=require('../../src/lib/galleries/merchandise.ts');
const {nphotoStarters,nphotoLaunchKeys}=require('../../src/lib/nphoto/starter-catalog.ts');
const POST=require('../../src/app/api/admin/gallery-shop/nphoto-import/route.ts').POST;
const request=(body={key:'launch-five',mediaRightsConfirmed:true})=>new NextRequest('https://example.test/api/admin/gallery-shop/nphoto-import',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
const save=body=>POST(request(body));
const state=()=>JSON.stringify({products,settings:[...settings]});
function clear(){settings.clear();products=[];failAtProduct=0;conflict=false;adminAllowed=true;}

(async()=>{
 await check('launch contains five requested families, correct Lite name, canvas media and courier-only rule',async()=>{
  assert.deepEqual(nphotoLaunchKeys,['odbitki-15x21','harmonijka','fotoalbum-pro','lite-album','fotoobraz']);
  const lite=nphotoStarters.find(p=>p.key==='lite-album'),canvas=nphotoStarters.find(p=>p.key==='fotoobraz');
  assert.match(lite.title,/Lite Album/);assert.match(lite.description,/5 rozkładówek/);assert.match(lite.description,/A30/);assert.equal(lite.minPhotos,10);
  assert.match(canvas.image,/canvas/);assert.ok(!/akryl/i.test(canvas.image));assert.deepEqual(canvas.deliveryMethods,['courier']);assert.equal(canvas.maxPhotos,1);
  assert.ok(nphotoStarters.every(item=>!/(?:\d+ wybranych zdjęć|Wybierz \d+ zdjęć)/.test(item.description)),'dynamic photo limits must not become stale in descriptions');
 });
 await check('route authenticates before touching configuration or suppliers',async()=>{
  global.fetch=async()=>{throw Error('Unexpected external call')};adminAllowed=false;
  const count=transactionCalls;assert.equal((await save()).status,401);assert.equal(transactionCalls,count);assert.equal(writes,0);adminAllowed=true;
 });
 await check('unknown key and invalid media confirmation type fail before writes',async()=>{
  const count=transactionCalls;
  for(const body of [{key:'launch-five',mediaRightsConfirmed:'true'},{key:'launch-five',mediaRightsConfirmed:1},{key:'invented',mediaRightsConfirmed:true},{key:['fotoobraz'],mediaRightsConfirmed:true}])assert.equal((await save(body)).status,400);
  assert.equal(transactionCalls,count);assert.equal(products.length,0);
 });
 await check('one transaction creates four inactive zero-price products and exactly one 15×21 format',async()=>{
  const r=await save();assert.equal(r.status,200);const data=await r.json();assert.equal(data.kind,'batch');assert.equal(data.created,5);assert.deepEqual(data.counts,{createdProducts:4,existingProducts:0,createdFormats:1,existingFormats:0});
  assert.equal(products.length,4);assert.ok(products.every(p=>p.gallery_id===null&&!p.is_active&&p.price===0&&p.preview_images.length>=1));
  const config=JSON.parse(settings.get('gallery_shop_default'));assert.equal(config.enabled,false);assert.equal(config.formats.length,1);assert.deepEqual(config.formats[0],{id:'nphoto-15x21-silk',label:'15×21 cm',widthMm:152,heightMm:210,paper:'Fuji Silk',unitAmount:0,active:false});
  const canvas=products.find(p=>p.product_type==='wall-decor');assert.deepEqual(config.productRules[canvas.id],{minPhotos:1,maxPhotos:1,deliveryMethods:['courier']});
  assert.equal(config.delivery.courier.enabled,false);assert.equal(config.publicOffer,undefined);
 });
 await check('three repeat imports preserve prices, descriptions, rules and visibility without any write',async()=>{
  products[0].price=6700;products[0].is_active=true;products[0].description='Opis fotografa';
  const config=JSON.parse(settings.get('gallery_shop_default'));config.enabled=true;config.delivery.courier.enabled=true;config.formats[0].unitAmount=250;config.formats[0].active=true;config.productRules[products[0].id]={minPhotos:6,maxPhotos:18};settings.set('gallery_shop_default',JSON.stringify(config));
  const before=state(),count=writes;
  for(let round=0;round<3;round++){const r=await save();assert.equal(r.status,200);const data=await r.json();assert.equal(data.created,0);assert.equal(data.existingCount,5);assert.equal(state(),before);}
  assert.equal(writes,count);
 });
 await check('canonical URL deduplication recognises prior URL importer and preserves local products',async()=>{
  clear();const starter=nphotoStarters.find(p=>p.key==='lite-album');
  products=[{id:8,gallery_id:99,nphoto_url:starter.source,title:'Prywatny album',price:9000,is_active:true},{id:9,gallery_id:null,nphoto_url:starter.source.replace('https://','https://www.')+'/',title:'Własny Lite',price:18000,is_active:true}];
  const config=defaultShopConfig();config.productRules['9']={minPhotos:4,maxPhotos:25};settings.set('gallery_shop_default',JSON.stringify(config));
  const before=state();const r=await save({key:'lite-album',mediaRightsConfirmed:true});assert.equal(r.status,200);const data=await r.json();assert.equal(data.id,9);assert.equal(data.existing,true);assert.equal(state(),before);
  products.pop();const fresh=await (await save({key:'lite-album',mediaRightsConfirmed:true})).json();assert.equal(fresh.existing,false);assert.equal(products[0].price,9000);assert.equal(products[1].gallery_id,null);
 });
 await check('marker identity preserves merchant-edited source URL',async()=>{
  clear();products=[{id:14,gallery_id:null,nphoto_url:'https://nphoto.com/pl/wall-decor/akryl-klasyczny',title:'Zmieniony przez fotografa',price:33000,is_active:false}];settings.set('nphoto_starter_fotoobraz','14');
  const before=state(),count=writes;const result=await (await save({key:'fotoobraz',mediaRightsConfirmed:true})).json();assert.equal(result.id,14);assert.equal(result.existing,true);assert.equal(state(),before);assert.equal(writes,count);
 });
 await check('invalid existing configuration fails closed and is never reset',async()=>{
  for(const invalid of ['not json','{}',JSON.stringify({...defaultShopConfig(),formats:'broken'})]){
   clear();settings.set('gallery_shop_default',invalid);const before=state(),count=writes;assert.equal((await save()).status,409);assert.equal(state(),before);assert.equal(writes,count);
  }
 });
 await check('transaction failure rolls back partial batch including product rules and markers',async()=>{
  clear();failAtProduct=3;const before=state();assert.equal((await save()).status,500);assert.equal(state(),before);failAtProduct=0;
 });
 await check('format limit prevents invalid configuration and rolls back the batch',async()=>{
  clear();const config=defaultShopConfig();config.formats=Array.from({length:100},(_,i)=>({id:'existing'+i,label:'Odbitka',widthMm:100,heightMm:150,paper:'mat',unitAmount:100,active:true}));settings.set('gallery_shop_default',JSON.stringify(config));
  const before=state();assert.equal((await save()).status,400);assert.equal(state(),before);
 });
 await check('legacy calendar and three-format import remain available without overwriting 15×21',async()=>{
  clear();await save({key:'odbitki-15x21',mediaRightsConfirmed:true});const config=JSON.parse(settings.get('gallery_shop_default'));config.formats[0].unitAmount=555;config.formats[0].active=true;settings.set('gallery_shop_default',JSON.stringify(config));
  const prints=await (await save({key:'odbitki',mediaRightsConfirmed:true})).json();assert.equal(prints.created,2);assert.equal(prints.existingCount,1);const next=JSON.parse(settings.get('gallery_shop_default'));assert.equal(next.formats.length,3);assert.equal(next.formats.find(f=>f.id==='nphoto-15x21-silk').unitAmount,555);
  assert.equal((await save({key:'kalendarz-basic',mediaRightsConfirmed:true})).status,200);assert.equal(products[0].product_type,'calendar');assert.equal(products[0].is_active,false);
 });
 await check('serializable conflict returns actionable409 with no retry or external side effects',async()=>{
  conflict=true;const before=state();const response=await save();assert.equal(response.status,409);assert.match((await response.json()).error,/równocześnie/);assert.equal(state(),before);conflict=false;
 });
 const Catalog=require('../../src/components/admin/NphotoStarterCatalog.tsx').default;
 let fetchCalls=0,reloads=0;const busy=[];
 global.fetch=async(url,options)=>{fetchCalls++;assert.equal(url,'/api/admin/gallery-shop/nphoto-import');return POST(request(JSON.parse(options.body)))};
 const props={onImported:async()=>{reloads++},onBusyChange:value=>busy.push(value)};
 await check('unconfirmed media creates safe empty-image drafts; replay cannot silently add supplier images',async()=>{
  for(const body of [{key:'launch-five'},{key:'launch-five',mediaRightsConfirmed:false}]){
   clear();const response=await save(body);assert.equal(response.status,200);assert.equal(products.length,4);assert.ok(products.every(p=>p.image_url===null&&p.preview_images.length===0&&!p.is_active&&p.price===0));
   const before=state();assert.equal((await save({key:'launch-five',mediaRightsConfirmed:true})).status,200);assert.equal(state(),before);
  }
 });
 await check('admin UI defaults to safe no-media import and offers explicit optional media confirmation',async()=>{
  clear();await mount(Catalog,props);const primary=button('Przygotuj 5 propozycji jako szkice');assert.equal(primary.disabled,false);assert.equal(fetchCalls,0);
  assert.match(document.body.textContent,/cztery produkty oraz jeden format/);
  await click(primary);assert.equal(fetchCalls,1);assert.equal(reloads,1);assert.ok(products.every(p=>p.image_url===null&&p.preview_images.length===0));assert.match(document.querySelector('[role="status"]').textContent,/bez zdjęć producenta/);
  clear();
  await click(document.querySelector('input[type="checkbox"]'));assert.equal(button('Przygotuj 5 propozycji jako szkice').disabled,false);
  await click(button('Przygotuj 5 propozycji jako szkice'));assert.equal(fetchCalls,2);assert.equal(reloads,2);assert.deepEqual(busy,[true,false,true,false]);assert.match(document.querySelector('[role="status"]').textContent,/5 nowych szkiców/);assert.equal(products.length,4);assert.ok(products.every(p=>p.image_url&&p.preview_images.length>=1));
 });
 await check('UI error keeps unsaved view and never reloads after failed import',async()=>{
  const before=reloads;settings.set('gallery_shop_default','broken');await click(button('Przygotuj 5 propozycji jako szkice'));assert.equal(reloads,before);assert.match(document.querySelector('[role="alert"]').textContent,/nie nadpisze/);assert.equal(document.querySelector('[role="status"]'),null);
 });
 await check('parent dirty-state lock prevents imports and supplier calls',async()=>{
  await reset();await mount(Catalog,{...props,disabled:true});assert.equal(button('Przygotuj 5 propozycji jako szkice').disabled,true);assert.equal(document.querySelector('input[type="checkbox"]').disabled,true);assert.match(document.body.textContent,/Najpierw zapisz/);
 });
 await reset();
 console.log(JSON.stringify({checks:log.length,transactionCalls,fetchCalls,liveSupplierCalls:0,liveDatabaseWrites:0}));
})().catch(error=>{console.error(error);process.exitCode=1});
