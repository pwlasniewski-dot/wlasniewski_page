const {assert,check,reset,mount,button,click,act,flush}=require('./gallery-shop-dom.cjs');
global.Element=window.Element;global.SVGElement=window.SVGElement;global.getComputedStyle=window.getComputedStyle;
const Module=require('node:module');
const {NextRequest,NextResponse}=require('next/server');
process.env.JWT_SECRET='preview-regression-test-secret-at-least-32-characters';
let adminRole='ADMIN',allowed=true;
let client={id:7,email:'client@example.test',name:'Klient',role:'CLIENT',is_active:true,deleted_at:null,password_reset_required:false};
const original=Module._load;
Module._load=function(name,...args){
 if(name==='next/navigation') return {useRouter:()=>({push:()=>{}})};
 if(name==='@/context/AuthContext') return {useAuth:()=>({token:null,user:null})};
 if(name==='@/lib/db/prisma') return {__esModule:true,default:{adminUser:{findUnique:async()=>adminRole?{role:adminRole}:null},user:{findUnique:async({where})=>where.id===7?client:null}}};
 if(name==='@/lib/auth/middleware') return {withAuth:async(req,fn)=>allowed?fn({user:{id:2}}):NextResponse.json({error:'Unauthorized'},{status:401})};
 return original.call(this,name,...args);
};
const {generateToken,generateClientPreviewToken,verifyToken}=require('../../src/lib/auth/jwt.ts');
const {verifyClientReadToken}=require('../../src/lib/auth/client-preview.ts');
const {POST}=require('../../src/app/api/admin/clients/[id]/preview/route.ts');
const req=(path='/api/user/me',method='GET')=>new NextRequest(`https://example.test${path}`,{method});
(async()=>{
 await check('preview credential is short lived, accepted only for allowed reads, never normal client authentication',async()=>{
  const token=await generateClientPreviewToken({id:7,email:client.email},2);
  const claims=JSON.parse(Buffer.from(token.split('.')[1],'base64url'));
  assert.equal(claims.exp-claims.iat,600);
  assert.equal(await verifyToken(token),null);
  assert.equal((await verifyClientReadToken(token,req())).id,7);
  for(const method of ['POST','PUT','PATCH','DELETE']) assert.equal(await verifyClientReadToken(token,req('/api/client/offer-addons',method)),null);
  assert.equal(await verifyClientReadToken(token,req('/api/admin/clients')),null);
  assert.equal(await verifyClientReadToken(token,req('/api/galleries/7/shop')),null);
  adminRole=null;assert.equal(await verifyClientReadToken(token,req()),null);adminRole='ADMIN';
  const normal=await generateToken({id:7,email:client.email,role:'CLIENT',type:'client'});assert.equal((await verifyToken(normal)).id,7);
 });
 await check('preview issuance requires admin, validates client, uses no cookies, and respects blocked account state',async()=>{
  const call=(id='7')=>POST(req('/api/admin/clients/7/preview','POST'),{params:Promise.resolve({id})});
  allowed=false;assert.equal((await call()).status,401);allowed=true;
  assert.equal((await call('NaN')).status,400);assert.equal((await call('8')).status,404);
  const response=await call();assert.equal(response.headers.get('set-cookie'),null);assert.equal(response.headers.get('cache-control'),'private, no-store');
  const data=await response.json();assert.ok(data.token);assert.equal(data.user.id,7);
  client.password_reset_required=true;assert.equal((await (await call()).json()).token,null);client.password_reset_required=false;
  client.is_active=false;assert.match((await (await call()).json()).blockedReason,/nieaktywne/);client.is_active=true;
 });
 await check('real account preview switches to orders using preview identity without writing telemetry or changing account URL',async()=>{
  const {AuthenticatedAccountPage}=require('../../src/components/client/AccountPage.tsx');
  const calls=[];
  global.fetch=async(url,init={})=>{
   calls.push({url,init});assert.equal(init.method||'GET','GET');
   if(url==='/api/shop/catalog') return Response.json({success:true,catalog:null});
   assert.equal(init.headers.Authorization,'Bearer readonly-test');
   if(url==='/api/user/action-summary') return Response.json({nextAction:null,counts:{offers:0,contracts:0,galleries:0,challenges:0,bookings:0,giftCards:0},modules:{workshops:false,galleries:true}});
   if(url==='/api/account/orders') return Response.json({orders:[],nextCursor:null});
   throw new Error(`Unexpected read ${url}`);
  };
  await mount(AuthenticatedAccountPage,{user:{id:7,email:client.email,name:'Klient',role:'CLIENT'},token:'readonly-test',readOnly:true,logout:async()=>{}});
  await click(button('Moje zamówienia'));
  await act(async()=>{await new Promise(resolve=>setTimeout(resolve,700));});await flush();
  assert.ok(document.body.textContent.includes('Nie masz jeszcze zamówień'));
  assert.equal(window.location.pathname,'/qa');
  assert.ok(calls.some(c=>c.url==='/api/account/orders'));
  assert.ok(!calls.some(c=>c.url==='/api/user/events'));
 });
 await reset();
})().catch(e=>{console.error(e);process.exitCode=1;void reset();});
