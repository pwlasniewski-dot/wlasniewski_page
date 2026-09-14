const h=require('./gallery-shop-dom.cjs');
const {assert,check,mount,reset,button,click}=h;
const Module=require('node:module');
const {NextRequest,NextResponse}=require('next/server');
let allowed=true,providerDenied=false,transactionFails=false,transport=[];
let products=[{id:6,gallery_id:null,title:'Harmonijka',description:'8×8 cm, 12 stron',price:4154,is_active:false,image_url:'https://nphoto.com/accordion.jpg'},{id:7,gallery_id:null,title:'Album',description:'20 stron',price:25770,is_active:false,image_url:'https://nphoto.com/album.jpg'},{id:99,gallery_id:1,title:'Prywatny',description:'Nie publikuj',price:900,is_active:false,image_url:'https://nphoto.com/private.jpg'}];
const settings=new Map();
const db={setting:{findFirst:async()=>({payu_merchant_pos_id:'test-pos',payu_client_id:'test-pos',payu_client_secret:'oauth-test-secret',payu_md5_key:'md5-test-secret',payu_environment:'sandbox'}),upsert:async({where,create,update})=>{if(transactionFails)throw Error('write failed');const row=settings.has(where.setting_key)?update:create;settings.set(where.setting_key,row.setting_value);return row;}},galleryProduct:{findMany:async({where})=>products.filter(p=>p.gallery_id===where.gallery_id&&where.id.in.includes(p.id)),updateMany:async({where,data})=>{const selected=products.filter(p=>p.gallery_id===where.gallery_id&&where.id.in.includes(p.id)&&p.is_active===where.is_active);selected.forEach(p=>Object.assign(p,data));return {count:selected.length};}},clientGallery:{findUnique:async()=>({id:1})},$transaction:async(fn,options)=>{assert.equal(options.isolationLevel,'Serializable');const previous=structuredClone(products);try{return await fn(db);}catch(e){products=previous;throw e;}}};
const original=Module._load;
Module._load=function(name,...args){if(name==='@/lib/db/prisma')return {__esModule:true,default:db};if(name==='@/lib/auth/middleware')return {withAuth:async(req,fn)=>allowed?fn():NextResponse.json({error:'Unauthorized'},{status:401})};return original.call(this,name,...args);};
const integrations=require('../../src/app/api/admin/gallery-shop/integrations/route.ts');
const shop=require('../../src/app/api/admin/galleries/[id]/shop/route.ts');
const {defaultShopConfig}=require('../../src/lib/galleries/merchandise.ts');
const {defaultPublicOffer,publicShopCatalog}=require('../../src/lib/galleries/public-offer.ts');
const PublicSettings=require('../../src/components/admin/PublicShopOfferSettings.tsx').default;
const {visibleOfferCount}=require('../../src/lib/galleries/shop-publication.ts');
const config={...defaultShopConfig(),enabled:true,delivery:{locker:{enabled:true,amount:1700},courier:{enabled:true,amount:2500}},publicOffer:{...defaultPublicOffer(),enabled:true,productIds:[6,7],formatIds:['print']},formats:[{id:'print',label:'15×21',paper:'Fuji Silk',widthMm:152,heightMm:210,unitAmount:0,active:false}]};
const req=(path='/api/admin/gallery-shop/integrations')=>new NextRequest(`https://shop.example.test${path}`,{headers:{'x-forwarded-for':'192.0.2.99'}});
const publish=(id='default')=>shop.PUT(new NextRequest('https://shop.example.test/api/admin/galleries/default/shop',{method:'PUT',body:JSON.stringify({config,publishSelected:true})}),{params:Promise.resolve({id})});
(async()=>{
 await check('publication explains empty active shop and offers explicit grouped activation',async()=>{
  let published=0;await mount(PublicSettings,{value:config.publicOffer,formats:config.formats,products,shopEnabled:true,delivery:config.delivery,productRules:{},disabled:false,onChange:()=>{},onPublish:()=>published++});
  assert.ok(document.querySelector('[role=alert]').textContent.includes('nie pokazuje jeszcze żadnego produktu'));
  assert.equal(visibleOfferCount(config,[...products,{id:1,price:30000,is_active:true}]),0);
  await click(button('Aktywuj i pokaż 2 wycenione produkty'));assert.equal(published,1);await reset();
 });
 await check('publication is authenticated, atomic, shared-only, repeatable and leaves zero-price prints hidden',async()=>{
  allowed=false;assert.equal((await publish()).status,401);allowed=true;
  assert.equal((await publish('1')).status,400);assert.equal(products[0].is_active,false);
  transactionFails=true;assert.equal((await publish()).status,500);assert.equal(products[0].is_active,false);transactionFails=false;
  let result=await (await publish()).json();assert.equal(result.activatedProducts,2);assert.equal(products[2].is_active,false);
  const saved=JSON.parse(settings.get('gallery_shop_default'));assert.equal(saved.publicOffer.enabled,true);assert.equal(visibleOfferCount(saved,products),2);
  const visible=publicShopCatalog(saved,products.filter(p=>p.is_active).map(p=>({...p,minPhotos:1,maxPhotos:20})));
  assert.equal(visible.products.length,2);assert.equal(visible.formats.length,0);
  result=await (await publish()).json();assert.equal(result.activatedProducts,0);
 });
 process.env.INPOST_API_TOKEN='test-carrier-secret';process.env.INPOST_ORGANIZATION_ID='123';process.env.INPOST_ENVIRONMENT='sandbox';process.env.NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN='test-public-map';
 global.fetch=async(url,init={})=>{transport.push({url:String(url),method:init.method||'GET'});if(providerDenied)return Response.json({error:'test-carrier-secret'},{status:401});if(String(url).includes('/oauth/'))return Response.json({access_token:'test-oauth-secret'});if(String(url).includes('/organizations/'))return Response.json({id:123,services:['inpost_locker_standard'],tax_id:'private-tax-id'});return Response.json({items:[]});};
 await check('integration check proves independent provider access without purchases or leaking credentials',async()=>{
  allowed=false;assert.equal((await integrations.GET(req())).status,401);assert.equal(transport.length,0);allowed=true;
  const response=await integrations.GET(req());const result=await response.json();assert.equal(result.inpost.connected,true);assert.equal(result.inpost.locker,true);assert.equal(result.inpost.courier,false);assert.equal(result.inpost.pointsConnected,true);assert.equal(result.inpost.mapConfigured,true);assert.equal(result.payment.connected,true);
  assert.equal(transport.length,3);assert.ok(transport.every(c=>c.method==='GET'||c.url.includes('/oauth/')));assert.doesNotMatch(JSON.stringify(result),/secret|private-tax-id/);
  providerDenied=true;const failed=await (await integrations.GET(req())).json();assert.equal(failed.inpost.connected,false);assert.equal(failed.inpost.pointsConnected,false);assert.equal(failed.payment.connected,false);providerDenied=false;
 });
 await check('isolated QA blocks production shipment mutations and suppresses outbound emails',async()=>{
  process.env.GALLERY_QA_DATABASE_URL='postgresql://test:test@qa.example.test/db';process.env.CONTEXT='deploy-preview';process.env.INPOST_ENVIRONMENT='production';
  const before=transport.length;await assert.rejects(()=>require('../../src/lib/shipping/inpost.ts').shipX('/shipments','POST',{}),/Nadanie produkcyjne jest zablokowane/);assert.equal(transport.length,before);
  const sent=await require('../../src/lib/email/sender.ts').sendEmail({to:'not-a-recipient@example.test',subject:'Test',html:'Test'});assert.equal(sent.messageId,'isolated-review-not-sent');assert.equal(transport.length,before);
  delete process.env.GALLERY_QA_DATABASE_URL;delete process.env.CONTEXT;
 });
 for(const key of ['INPOST_API_TOKEN','INPOST_ORGANIZATION_ID','INPOST_ENVIRONMENT','NEXT_PUBLIC_INPOST_GEOWIDGET_TOKEN'])delete process.env[key];
 console.log('Shop launch readiness: 4 groups PASS (provider transport and database mocked).');
})().catch(e=>{console.error(e);process.exitCode=1});
