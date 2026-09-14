const {assert,React,act,mount,reset,flush,click,button,check}=require('./gallery-shop-dom.cjs');
const Module=require('node:module');
let pathname='/admin/dashboard', redirects=[];
const router={replace:path=>redirects.push(path),refresh:()=>{},push:path=>redirects.push(path)};
const original=Module._load;
Module._load=function(name){
 if(name==='next/navigation') return {usePathname:()=>pathname,useRouter:()=>router};
 if(name==='@/components/admin/AdminDownloadDiagnostics')return {__esModule:true,default:()=>null};
 return original.apply(this,arguments);
};
const Layout=require('../../src/app/admin/layout.tsx').default;
const {logoutAdmin,publicAdminPaths}=require('../../src/lib/admin/session.ts');
const {POST}=require('../../src/app/api/auth/logout/route.ts');
const content=React.createElement('p',null,'Treść chroniona');
const response=(status=200)=>Response.json({success:status===200,user:status===200?{id:1}:undefined},{status});
(async()=>{
 await check('admin logout clears the server cookie only; default client logout is unchanged',async()=>{
  const admin=await POST(new Request('http://localhost/api/auth/logout?scope=admin'));
  assert.ok(admin.headers.get('set-cookie').includes('admin_token=;'));assert.ok(!admin.headers.get('set-cookie').includes('client_token'));
  const client=await POST(new Request('http://localhost/api/auth/logout'));assert.ok(client.headers.get('set-cookie').includes('client_token=;'));assert.ok(!client.headers.get('set-cookie').includes('admin_token'));
  assert.equal((await POST(new Request('http://localhost/api/auth/logout?scope=all'))).status,400);
 });
 await check('failed logout preserves identity for retry; successful logout clears admin only',async()=>{
  localStorage.setItem('admin_token','test');localStorage.setItem('admin_user','test');localStorage.setItem('client_token','client');
  global.fetch=async()=>response(500);await assert.rejects(logoutAdmin());assert.equal(localStorage.getItem('admin_token'),'test');
  global.fetch=async(url,init)=>{assert.equal(url,'/api/auth/logout?scope=admin');assert.equal(init.credentials,'include');return response();};await logoutAdmin();assert.equal(localStorage.getItem('admin_token'),null);assert.equal(localStorage.getItem('client_token'),'client');
 });
 await check('temporary authentication error keeps identity and retry recovers the panel',async()=>{
  localStorage.setItem('admin_token','test');global.fetch=async()=>response(503);await mount(Layout,{children:content});assert.equal(localStorage.getItem('admin_token'),'test');assert.equal(redirects.length,0);assert.ok(!document.body.textContent.includes('Treść chroniona'));
  global.fetch=async()=>response();await click(button('Spróbuj ponownie'));assert.ok(document.body.textContent.includes('Treść chroniona'));
 });await reset();
 await check('cookie-only session works and internal navigation does not recheck or erase open forms',async()=>{
  localStorage.removeItem('admin_token');let calls=0;global.fetch=async(url,init)=>{calls++;assert.equal(init.credentials,'include');assert.deepEqual(init.headers,{});return response();};pathname='/admin/bookings';await mount(Layout,{children:content});pathname='/admin/bookings/orders';await mount(Layout,{children:content});assert.equal(calls,1);assert.ok(document.body.textContent.includes('Treść chroniona'));assert.equal(document.querySelectorAll('[aria-current="page"]').length,1);
 });await reset();
 await check('a stale unauthorized response cannot delete a newer login',async()=>{
  let resolve;pathname='/admin/dashboard';localStorage.setItem('admin_token','old');global.fetch=()=>new Promise(r=>resolve=r);await mount(Layout,{children:content});pathname='/admin/login';await mount(Layout,{children:content});localStorage.setItem('admin_token','new');await act(async()=>resolve(response(401)));await flush();assert.equal(localStorage.getItem('admin_token'),'new');assert.equal(redirects.length,0);
 });await reset();
 await check('real unauthorized response blocks content and clears the rejected identity',async()=>{
  pathname='/admin/dashboard';global.fetch=async()=>response(401);await mount(Layout,{children:content});assert.deepEqual(redirects,['/admin/login']);assert.equal(localStorage.getItem('admin_token'),null);assert.ok(!document.body.textContent.includes('Treść chroniona'));assert.ok(!publicAdminPaths.has('/admin/login-extra'));
 });await reset();
})().catch(error=>{console.error(error);process.exitCode=1});
