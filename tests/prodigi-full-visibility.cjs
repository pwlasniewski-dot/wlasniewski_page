const {assert,reset}=require('./qa/gallery-shop-dom.cjs');
const Module=require('node:module');
const config={version:1,enabled:true,title:'Sklep',introduction:'',buttonLabel:'Kup',formats:[],productRules:{},delivery:{locker:{enabled:true,amount:1500},courier:{enabled:true,amount:2000}}};
const spec={version:1,provider:'prodigi',environment:'live',productId:50,sku:'GLOBAL-FAP-10X10',variant:{attributes:{paperType:'EMA'},printAreaSizes:{default:{horizontalResolution:1000,verticalResolution:1000}}},requiredAssets:['default'],shippingMethod:'Budget',ordersEnabled:true,liveQualified:true,destination:'PL'};
const product={id:50,gallery_id:null,title:'Fine art',description:null,price:9900,image_url:null,product_type:'prodigi_live',is_active:true,archived_at:null};
let current=structuredClone(spec);const setting={findUnique:async({where})=>({setting_key:where.setting_key,setting_value:JSON.stringify(where.setting_key.startsWith('prodigi')?current:config)})};
const load=Module._load;Module._load=function(request){if(request==='@/lib/db/prisma')return {__esModule:true,default:{setting,galleryProduct:{findMany:async()=>[product]}}};if(request==='./order-account')return {orderClient:async()=>null};if(request==='@/lib/payu')return {};return load.apply(this,arguments);};
global.fetch=async()=>{throw Error('Network forbidden in QA');};
const {loadGalleryShop}=require('../src/lib/galleries/merchandise-server.ts');
(async()=>{const env=['PRODIGI_ORDER_ENV','PRODIGI_LIVE_ORDERS_ENABLED','PRODIGI_API_KEY'];const original=env.map(key=>process.env[key]);
 try{
 process.env.PRODIGI_ORDER_ENV='live';process.env.PRODIGI_LIVE_ORDERS_ENABLED='true';process.env.PRODIGI_API_KEY='fixture-only';
 assert.equal((await loadGalleryShop(12)).catalog.products.length,1);
 for(const patch of [{environment:'sandbox'},{liveQualified:false},{ordersEnabled:false},{productId:99}]){current={...spec,...patch};assert.equal((await loadGalleryShop(12)).catalog.products.length,0);}
 current=structuredClone(spec);
 for(const key of env){const saved=process.env[key];delete process.env[key];assert.equal((await loadGalleryShop(12)).catalog.products.length,0);process.env[key]=saved;}
 product.product_type='prodigi_sandbox';current={...spec,environment:'sandbox'};assert.equal((await loadGalleryShop(12)).catalog.products.length,0);assert.equal((await loadGalleryShop(12)).sharedProducts.length,1);
 console.log('PASS public catalog hides sandbox/unqualified/disabled/mismatch/missing environment, flag or key; admin can still edit hidden draft');
 }finally{env.forEach((key,i)=>original[i]===undefined?delete process.env[key]:process.env[key]=original[i]);await reset();}
})().catch(error=>{console.error(error);process.exitCode=1;});
