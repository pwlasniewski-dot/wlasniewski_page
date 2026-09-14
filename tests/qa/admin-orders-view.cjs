const {assert,act,mount,reset,flush,button,field,click,set,check}=require('./gallery-shop-dom.cjs');
const Module=require('node:module');
const original=Module._load;
const router={push:()=>{},replace:()=>{}};
Module._load=function(name){if(name==='next/navigation')return {useRouter:()=>router};return original.apply(this,arguments);};
const Orders=require('../../src/app/admin/bookings/orders/page.tsx').default;
const Shop=require('../../src/components/admin/GalleryShopAdmin.tsx').default;
const metadata={kind:'gallery_merchandise',version:1,lines:[{kind:'print',id:'p',photoId:4,quantity:2,title:'15×21',unitAmount:250,lineTotal:500,format:{label:'15×21',paper:'Silk'},crop:{mode:'fit'}}],delivery:{method:'courier',amount:2500,recipientName:'Test',email:'test@example.com'},fulfillment:{status:'new',trackingNumber:null}};
const row=(id,galleryId,status,extra={})=>({id:`GL-${id}`,rawId:id,type:'gallery_photo',galleryId,galleryName:`Galeria ${galleryId}`,customerName:'Test',customerEmail:'test@example.com',createdAt:'2026-09-14',amount:3000,currency:'PLN',status,...extra});
(async()=>{
 await check('gallery context and paid filter apply to one list and survive reload; saved stage survives reopening details',async()=>{
  window.history.replaceState({},'', '/admin/bookings/orders?gallery=26');
  let rows=[row(1,26,'paid',{merchandise:structuredClone(metadata)}),row(2,27,'pending'),{...row(3,26,'completed'),type:'gift_card'}];
  global.fetch=async(url,init={})=>{if(init.method==='PATCH'){rows[0].merchandise={...metadata,fulfillment:JSON.parse(init.body)};return Response.json({success:true,metadata:rows[0].merchandise});}return Response.json({success:true,orders:rows});};
  await mount(Orders,{});assert.equal(field('Galeria').value,'26');assert.equal(document.querySelectorAll('tbody tr').length,2);
  await set(field('Status płatności'),'paid');assert.equal(document.querySelectorAll('tbody tr').length,2);await click(document.querySelector('[title="Odśwież"]'));assert.equal(document.querySelectorAll('tbody tr').length,2);
  await set(field('Rodzaj zamówienia'),'merchandise');assert.equal(document.querySelectorAll('tbody tr').length,1);
  await click(document.querySelector('tbody button'));await set(document.querySelector('[aria-label="Etap realizacji"] select'),'ordered');await click(button('Zapisz etap realizacji'));
  assert.deepEqual([...document.querySelector('[aria-label="Etap realizacji"] select').options].map(o=>o.value),['ordered','received']);
  await click(document.querySelector('[aria-label="Zamknij szczegóły zamówienia"]'));await click(document.querySelector('tbody button'));assert.equal(document.querySelector('[aria-label="Etap realizacji"] select').value,'ordered');
  await click(document.querySelector('[aria-label="Zamknij szczegóły zamówienia"]'));await click(button('Wyczyść filtry'));assert.equal(document.querySelectorAll('tbody tr').length,3);
 });await reset();
 await check('a late gallery response cannot overwrite the newly selected gallery settings',async()=>{
  const config={version:1,enabled:false,title:'Galeria B',introduction:'',buttonLabel:'Kup',formats:[],productRules:{},delivery:{locker:{enabled:false,amount:1700},courier:{enabled:false,amount:2500}}};
  let resolve;global.fetch=url=>String(url).includes('/12/')?new Promise(r=>resolve=r):Promise.resolve(Response.json({success:true,config,products:[],sharedProducts:[],nphotoAlbums:[]}));
  await mount(Shop,{galleryId:12});await mount(Shop,{galleryId:13});
  await act(async()=>resolve(Response.json({success:true,config:{...config,title:'Galeria A'},products:[],sharedProducts:[],nphotoAlbums:[]})));await flush();
  assert.ok(document.querySelector('a[href="/admin/bookings/orders?gallery=13"]'));assert.ok([...document.querySelectorAll('input')].some(input=>input.value==='Galeria B'));assert.ok(![...document.querySelectorAll('input')].some(input=>input.value==='Galeria A'));
 });await reset();
})().catch(error=>{console.error(error);process.exitCode=1});
