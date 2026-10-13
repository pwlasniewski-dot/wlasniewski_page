const {assert,reset}=require('./qa/gallery-shop-dom.cjs');const Module=require('node:module');const {NextRequest}=require('next/server');
let payload=null,calls=0;const load=Module._load;
Module._load=function(name,...args){
 if(name==='./jwt')return{extractToken:()=>payload?'test':null,verifyToken:async()=>payload};
 if(name==='@/lib/db/prisma')return{__esModule:true,default:{adminUser:{findUnique:async()=>({id:1,email:'admin@example.test',role:'ADMIN'})},setting:{findUnique:async()=>null}}};
 if(name==='@/lib/storage/shop-diagnostics')return{checkShopStorage:async()=>{calls++;return{head:'ok',read:'ok',lifecycle:'denied',enabledLifecycleRules:null,privateStorageConfirmed:false};}};
 if(name==='@/lib/shipping/inpost')return{inpostConfiguration:()=>({organizationId:'1',environment:'sandbox',missing:[]}),shipX:async()=>({id:1,services:[]})};
 if(name==='@/lib/shipping/inpost-points')return{fetchInpostPoints:async()=>[]};
 if(name==='@/lib/payu')return{checkPayUConnection:async()=>({connected:false})};
 if(name==='@/lib/shipping/inpost-widget')return{inpostWidgetToken:()=>''};
 if(name==='@/lib/shop-qa')return{isShopQa:()=>true};
 if(name==='@/lib/rate-limit')return{getClientIp:()=>'',rateLimit:()=>({ok:true})};
 return load.call(this,name,...args);
};
const {GET}=require('../src/app/api/admin/gallery-shop/integrations/route.ts');const req=()=>new NextRequest('https://example.test/api/admin/gallery-shop/integrations');
(async()=>{
 assert.equal((await GET(req())).status,401);assert.equal(calls,0);
 payload={id:1,email:'admin@example.test',type:'client',role:'CLIENT'};assert.equal((await GET(req())).status,403);assert.equal(calls,0);
 payload={id:1,email:'admin@example.test',type:'admin',role:'ADMIN'};const response=await GET(req());assert.equal(response.status,200);assert.equal(calls,1);assert.match(response.headers.get('cache-control'),/private, no-store/);const data=await response.json();assert.equal(data.storage.read,'ok');assert.equal(data.storage.lifecycle,'denied');console.log('PASS existing real admin auth denies anonymous/customer before storage calls; admin receives private no-store diagnostics');await reset();
})().catch(e=>{console.error(e);process.exitCode=1;});
