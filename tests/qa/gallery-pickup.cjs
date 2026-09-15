const {assert,mount,reset,button,field,click,set,check}=require('./gallery-shop-dom.cjs');
const Client=require('../../src/components/galleries/GalleryShoppingPanel.tsx').default;
const Admin=require('../../src/components/admin/GalleryShopAdmin.tsx').default;
const {defaultShopConfig,validateShopConfig,priceShopCart}=require('../../src/lib/galleries/merchandise.ts');
let config={...defaultShopConfig(),enabled:true,formats:[{id:'p10',label:'10×15',widthMm:100,heightMm:150,unitAmount:350,active:true,paper:'mat'}],delivery:{locker:{enabled:true,amount:1500},courier:{enabled:true,amount:2000},pickup:{enabled:true,amount:0,instructions:'Płużnica — ustal termin telefonicznie.'}}};
const catalog=()=>({...config,galleryId:12,products:[]});
let submitted=[];
const reply=value=>({ok:true,status:200,json:async()=>value});
global.fetch=async(url,init={})=>{
 if(String(url).includes('/admin/')) {if(init.method==='PUT'){config=validateShopConfig(JSON.parse(init.body).config);}return reply({success:true,config,products:[],sharedProducts:[],archivedProducts:[],nphotoAlbums:[]});}
 if(String(url).includes('/inpost/config'))return reply({token:null});
 if(init.method==='POST'){const body=JSON.parse(init.body);submitted.push(priceShopCart(catalog(),body.lines,body.delivery,[1]));assert.equal(body.expectedTotal,submitted.at(-1).total);return reply({success:true,orderId:submitted.length,paymentUrl:'http://localhost/qa#payment'});}
 return reply({success:true,catalog:catalog()});
};
const props={endpoint:'/api/galleries/12/shop',photos:[{id:1,file_url:'/photo1.jpg',width:1500,height:1000}]};
async function open(preserve=false){await reset();if(!preserve)sessionStorage.clear();await mount(Client,props);assert.ok(document.querySelector('.gallery-shop-invitation'));await click(button(new RegExp('^'+config.buttonLabel)));}
(async()=>{
 await check('shop invitation has finite gentle animation only when reduced motion is not requested',async()=>{
  const css=require('postcss').parse(require('node:fs').readFileSync('src/app/globals.css','utf8'));
  const animations=[];css.walkRules('.gallery-shop-invitation',rule=>rule.walkDecls(/^animation/,decl=>animations.push(decl)));
  assert.equal(animations.length,1);const animation=animations[0];assert.equal(animation.parent.parent.type,'atrule');assert.equal(animation.parent.parent.name,'media');assert.equal(animation.parent.parent.params,'(prefers-reduced-motion: no-preference)');assert.equal(animation.value,'gallery-shop-invitation-pulse 2.4s ease-in-out 2');
  css.walkAtRules('keyframes',rule=>{if(rule.params==='gallery-shop-invitation-pulse')rule.walkDecls(decl=>assert.ok(['border-color','box-shadow'].includes(decl.prop),'pulse must not flash text or move layout'));});
 });
 await check('admin pickup instructions save/read and on/off control',async()=>{await mount(Admin,{galleryId:12});await set(field('Informacja o odbiorze osobistym'),'Płużnica, termin uzgodniony telefonicznie.');await click(button('Zapisz ustawienia sklepu'));assert.equal(config.delivery.pickup.instructions,'Płużnica, termin uzgodniony telefonicznie.');const toggle=()=>field('Odbiór osobisty dostępny · bezpłatnie');await click(toggle());await click(button('Zapisz ustawienia sklepu'));assert.equal(config.delivery.pickup.enabled,false);await click(toggle());await click(button('Zapisz ustawienia sklepu'));assert.equal(config.delivery.pickup.enabled,true);});
 for(let round=1;round<=3;round++)await check(`pickup round ${round}: locker/courier/pickup, cart return, refresh, submit`,async()=>{
 await open();await click(field('Zaznacz zdjęcie 1'));await click(button('Dodaj zaznaczone do koszyka'));await click(button('Dostawa i podsumowanie'));
 assert.equal(field('Sposób dostawy').value,'locker');await set(field('Sposób dostawy'),'courier');assert.ok(field('Ulica, numer domu i lokalu'));
 await set(field('Sposób dostawy'),'pickup');assert.ok(!document.body.textContent.includes('Ulica, numer domu i lokalu'));assert.ok(!document.body.textContent.includes('Kod Paczkomatu'));assert.ok(document.body.textContent.includes(config.delivery.pickup.instructions));assert.ok(button(/^Zamawiam i płacę/).textContent.includes('3,50'));
 await click(button('Wróć do koszyka'));await click(button('Dostawa i podsumowanie'));assert.equal(field('Sposób dostawy').value,'pickup');
 await open(true);await click(button(/^Koszyk \(/));await click(button('Dostawa i podsumowanie'));assert.equal(field('Sposób dostawy').value,'pickup');
 await set(field('Imię i nazwisko'),'Anna Testowa');await set(field('E-mail'),'anna@example.com');await set(field('Telefon'),'501222333');await click(button(/^Zamawiam i płacę/));assert.equal(submitted.length,round);const d=submitted.at(-1).delivery;assert.equal(d.method,'pickup');assert.equal(d.amount,0);assert.equal(d.address,undefined);assert.equal(d.pointCode,undefined);assert.equal(d.instructions,config.delivery.pickup.instructions);
 });
 await reset();console.log('Pickup DOM checks passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
