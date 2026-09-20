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
 if(name==='@/lib/db/prisma') return {__esModule:true,default:{
  adminUser:{findUnique:async()=>adminRole?{role:adminRole}:null},
  user:{findUnique:async({where})=>where.id===7?client:null},
  clientGallery:{findMany:async()=>[
   {id:70,access_code:'individual-70',gallery_mode:'INDIVIDUAL',group_access_code:null,client_name:'Sesja indywidualna',standard_count:20,expires_at:null,created_at:new Date('2026-01-01'),_count:{photos:40}},
   {id:71,access_code:'internal-71',gallery_mode:'GROUP',group_access_code:'KLASAB',client_name:'Komunia klasa B',standard_count:5,expires_at:null,created_at:new Date('2026-01-02'),_count:{photos:80}},
  ]},
  offer:{findUnique:async({where})=>where.id===101?{id:101,client_id:7,client_email:client.email,title:'Oferta testowa',status:'sent',total_price:1200,sections:[],negotiations:[],contract:null}:null},
 }};
 if(name==='@/lib/auth/middleware') return {withAuth:async(req,fn)=>allowed?fn({user:{id:2}}):NextResponse.json({error:'Unauthorized'},{status:401})};
 return original.call(this,name,...args);
};
const {generateToken,generateClientPreviewToken,verifyToken}=require('../../src/lib/auth/jwt.ts');
const {verifyClientReadToken}=require('../../src/lib/auth/client-preview.ts');
const {revalidateActiveClient}=require('../../src/lib/auth/active-client.ts');
const {POST}=require('../../src/app/api/admin/clients/[id]/preview/route.ts');
const {GET:getClientGalleries}=require('../../src/app/api/galleries/client/route.ts');
const previewDetails=require('../../src/app/api/admin/clients/[id]/preview/details/[kind]/[resourceId]/route.ts');
const previewContractPdf=require('../../src/app/api/admin/clients/[id]/preview/details/contract/[resourceId]/pdf/route.ts');
const ClientPreview=require('../../src/app/admin/clients/[id]/preview/page.tsx').default;
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
 await check('only an administrator preview can inspect an inactive or not-yet-activated client',async()=>{
  const previewToken=await generateClientPreviewToken({id:7,email:client.email},2);
  const previewIdentity=await verifyClientReadToken(previewToken,req());
  const normalIdentity={id:7,email:client.email,role:'CLIENT',type:'client'};
  client.password_reset_required=true;
  assert.equal(await revalidateActiveClient(normalIdentity),null);
  assert.equal((await revalidateActiveClient(previewIdentity)).id,7);
  client.password_reset_required=false;client.is_active=false;
  assert.equal(await revalidateActiveClient(normalIdentity),null);
  assert.equal((await revalidateActiveClient(previewIdentity)).id,7);
  client.is_active=true;
 });
 await check('preview issuance requires admin, validates client, uses no cookies, and includes accounts awaiting activation',async()=>{
  const call=(id='7')=>POST(req('/api/admin/clients/7/preview','POST'),{params:Promise.resolve({id})});
  allowed=false;assert.equal((await call()).status,401);allowed=true;
  assert.equal((await call('NaN')).status,400);assert.equal((await call('8')).status,404);
  const response=await call();assert.equal(response.headers.get('set-cookie'),null);assert.equal(response.headers.get('cache-control'),'private, no-store');
  const data=await response.json();assert.ok(data.token);assert.equal(data.user.id,7);
  client.password_reset_required=true;{const pending=await (await call()).json();assert.ok(pending.token);assert.match(pending.blockedReason,/nie ustawił/);}client.password_reset_required=false;
  client.is_active=false;{const inactive=await (await call()).json();assert.ok(inactive.token);assert.match(inactive.blockedReason,/nieaktywne/);}client.is_active=true;
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
 await check('group and individual galleries are distinguishable and use the correct client entry paths',async()=>{
  await reset();
  const token=await generateClientPreviewToken({id:7,email:client.email},2);
  assert.equal((await getClientGalleries(req('/api/galleries/client'))).status,401);
  const authorizedRequest=new NextRequest('https://example.test/api/galleries/client',{headers:{Authorization:`Bearer ${token}`}});
  const galleryData=await (await getClientGalleries(authorizedRequest)).json();
  assert.deepEqual(galleryData.galleries.map(g=>[g.gallery_mode,g.group_access_code]),[['INDIVIDUAL',null],['GROUP','KLASAB']]);
  global.fetch=async(url,init={})=>{
   if(url==='/api/shop/catalog') return Response.json({success:true,catalog:null});
   assert.equal(init.headers.Authorization,'Bearer readonly-test');
   if(url==='/api/user/action-summary') return Response.json({nextAction:null,counts:{offers:0,contracts:0,galleries:2,challenges:0,bookings:0,giftCards:0},modules:{workshops:false,galleries:true}});
   if(url==='/api/galleries/client') return Response.json(galleryData);
   if(url==='/api/photo-challenge/client/challenges') return Response.json({challenges:[]});
   throw new Error(`Unexpected read ${url}`);
  };
  const {AuthenticatedAccountPage}=require('../../src/components/client/AccountPage.tsx');
  await mount(AuthenticatedAccountPage,{user:{id:7,email:client.email,name:'Klient',role:'CLIENT'},token:'readonly-test',readOnly:true,logout:async()=>{}});
  await click(button(/Galerie/));
  assert.ok(document.body.textContent.includes('Galeria indywidualna'));
  assert.ok(document.body.textContent.includes('Galeria grupowa'));
  const groupLink=[...document.querySelectorAll('a')].find(a=>a.textContent.includes('Otwórz galerię grupową'));
  assert.equal(groupLink?.getAttribute('href'),'/galeria/grupowa?code=KLASAB');
 });
 await check('dedicated detail API is GET-only, bound to the client and rejects every mutation method',async()=>{
  const token=await generateClientPreviewToken({id:7,email:client.email},2);
  const call=(method='GET',clientId='7',resourceId='101')=>previewDetails.GET(new NextRequest(`https://example.test/api/admin/clients/${clientId}/preview/details/offer/${resourceId}`,{method,headers:{Authorization:`Bearer ${token}`}}),{params:Promise.resolve({id:clientId,kind:'offer',resourceId})});
  assert.equal((await call()).status,200);
  for(const method of ['POST','PUT','PATCH','DELETE']) assert.equal((await call(method)).status,401);
  assert.equal((await call('GET','8')).status,401);
  assert.equal(previewDetails.POST,undefined);assert.equal(previewDetails.PATCH,undefined);assert.equal(previewDetails.DELETE,undefined);
  const pdfCall=method=>previewContractPdf.GET(new NextRequest('https://example.test/api/admin/clients/7/preview/details/contract/201/pdf',{method,headers:{Authorization:`Bearer ${token}`}}),{params:Promise.resolve({id:'7',resourceId:'201'})});
  for(const method of ['POST','PUT','PATCH','DELETE']) assert.equal((await pdfCall(method)).status,401);
  assert.equal(previewContractPdf.POST,undefined);assert.equal(previewContractPdf.PATCH,undefined);assert.equal(previewContractPdf.DELETE,undefined);
  adminRole=null;assert.equal((await call()).status,401);adminRole='ADMIN';
 });
 await check('admin preview opens offer, contract and both gallery modes without storing the preview token',async()=>{
  await reset();localStorage.setItem('admin_token','admin-session');sessionStorage.clear();
  const detailBodies={
   'offer/101':{kind:'offer',offer:{id:101,title:'Oferta testowa',status:'sent',total_price:1200,sections:[],negotiations:[]}},
   'contract/201':{kind:'contract',contract:{id:201,contract_number:'U/201',status:'sent',content:'Treść umowy testowej'},bank:null},
   'gallery/70':{kind:'gallery',gallery:{id:70,client_name:'Sesja indywidualna',gallery_mode:'INDIVIDUAL',description:null,expires_at:null,photos:[],participants:[]}},
   'gallery/71':{kind:'gallery',gallery:{id:71,client_name:'Komunia klasa B',gallery_mode:'GROUP',description:null,expires_at:null,photos:[],participants:[]}},
  };
  const calls=[];
  global.fetch=async(url,init={})=>{calls.push({url,init});assert.equal(init.method||'GET',url.includes('/preview')&&url.endsWith('/preview')?'POST':'GET');
   if(url==='/api/admin/clients/7/preview') return Response.json({user:{id:7,email:client.email,name:'Klient Test',role:'CLIENT'},token:'preview-memory-only',blockedReason:null});
   if(url==='/api/shop/catalog') return Response.json({success:true,catalog:null});
   if(url==='/api/user/action-summary') return Response.json({nextAction:null,counts:{offers:1,contracts:1,galleries:2,challenges:0,bookings:0,giftCards:0},modules:{workshops:false,galleries:true}});
   if(url==='/api/user/me') return Response.json({user:{gift_cards:[],bookings:[],offers:[{id:101,title:'Oferta testowa',status:'sent',total_price:1200,created_at:'2026-01-01'}],contracts:[{id:201,contract_number:'U/201',status:'sent',content:'Treść umowy testowej'}],photo_orders:[],permissions:{}}});
   if(url==='/api/galleries/client') return Response.json({galleries:[{id:70,access_code:'individual-70',gallery_mode:'INDIVIDUAL',group_access_code:null,client_name:'Sesja indywidualna',standard_count:20,photo_count:0,expires_at:null},{id:71,access_code:'internal-71',gallery_mode:'GROUP',group_access_code:'KLASAB',client_name:'Komunia klasa B',standard_count:5,photo_count:0,expires_at:null}]});
   if(url==='/api/photo-challenge/client/challenges') return Response.json({challenges:[]});
   const match=String(url).match(/\/preview\/details\/(offer|contract|gallery)\/(\d+)$/);if(match)return Response.json(detailBodies[`${match[1]}/${match[2]}`]);
   throw new Error(`Unexpected read ${url}`);
  };
  await mount(ClientPreview,{params:Promise.resolve({id:'7'})});await act(async()=>{await new Promise(resolve=>setTimeout(resolve,30));});await flush();
  const tab=label=>[...document.querySelectorAll('[data-account-tab]')].find(element=>element.textContent.includes(label));
  await click(tab('Oferty i Umowy'));await click([...document.querySelectorAll('a')].find(a=>a.dataset.previewKind==='offer'));
  assert.ok(document.body.textContent.includes('Oferta testowa'));await click(button('← Wróć do panelu klienta'));
  await click(tab('Oferty i Umowy'));await click([...document.querySelectorAll('a')].find(a=>a.dataset.previewKind==='contract'));
  assert.ok(document.body.textContent.includes('Treść umowy testowej'));await click(button('← Wróć do panelu klienta'));
  await click(tab('Galerie'));for(const id of ['70','71']){await click([...document.querySelectorAll('a')].find(a=>a.dataset.previewKind==='gallery'&&a.dataset.previewId===id));assert.ok(document.body.textContent.includes(id==='70'?'Galeria indywidualna':'Galeria grupowa'));await click(button('← Wróć do panelu klienta'));if(id==='70')await click(tab('Galerie'));}
  assert.equal(localStorage.getItem('client_token'),null);assert.equal(localStorage.getItem('user_token'),null);assert.equal(sessionStorage.length,0);assert.ok(calls.filter(call=>String(call.url).includes('/preview/details/')).every(call=>(call.init.method||'GET')==='GET'&&call.init.headers.Authorization==='Bearer preview-memory-only'));
 });
 await reset();
})().catch(e=>{console.error(e);process.exitCode=1;void reset();});
