const h=require('./qa/gallery-shop-dom.cjs');const {assert,act,mount,reset,flush,click,button,field}=h;const {File}=require('node:buffer');
const UI=require('../src/components/shop/GuestProductPreview.tsx').default;
const product={id:50,title:'Fotoobraz',price:9900,image_url:null,personalizationEligible:true,personalizationPreview:{kind:'canvas',width:3307,height:4192}};
let network=[],created=[],revoked=[],closed=0;
global.fetch=async(url)=>{network.push(url);return {ok:true,json:async()=>({success:true,catalog:{offer:{personalizationEnabled:true},products:[product],formats:[]}})}};
global.createImageBitmap=async()=>({width:50,height:40,close(){}});
URL.createObjectURL=()=>{const url='blob:qa-'+created.length;created.push(url);return url;};URL.revokeObjectURL=url=>revoked.push(url);
const file=new File([new Uint8Array([137,80,78,71,13,10,26,10,0,0])],'small.png',{type:'image/png'});
async function pick(value){const input=field('Zdjęcie do podglądu produktu');Object.defineProperty(input,'files',{value:[value],configurable:true});await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));for(let n=0;n<4;n++)await flush();}
(async()=>{
 window.history.replaceState(null,'','/karta-podarunkowa?shopProduct=50&shopPersonalize=1');
 await mount(UI,{product,onClose:()=>closed++});assert.equal(network.length,0);assert.ok(document.querySelector('[role="dialog"]'));assert.equal(document.body.style.overflow,'hidden');
 await pick(file);assert.equal(network.length,0);assert.equal(created.length,1);assert.ok(document.querySelector('img[src="blob:qa-0"]'));assert.equal(button('Przejdź do zamówienia').disabled,false);assert.ok(!document.querySelector('[role="alert"]'));
 await pick(file);assert.deepEqual(revoked,['blob:qa-0']);await pick(new File(['bad'],'bad.jpg'));assert.ok(document.querySelector('[role="alert"]'));assert.equal(network.length,0);assert.deepEqual(revoked,['blob:qa-0']);
 await click(button('Przejdź do zamówienia'));assert.ok(network.every(url=>url==='/api/shop/catalog'));assert.equal(new URLSearchParams(window.location.search).get('shopProduct'),'50');assert.equal(new URLSearchParams(window.location.search).get('shopCheckout'),'1');assert.ok(document.body.textContent.includes('oryginalne zdjęcie do druku'));
 await click(button('Wróć do podglądu'));assert.ok(document.querySelector('img[src="blob:qa-1"]'));await reset();assert.deepEqual(revoked,['blob:qa-0','blob:qa-1']);assert.equal(document.body.style.overflow,'');
 console.log('PASS guest low-resolution local preview, zero auth/upload, replace/error blob cleanup, explicit order handoff + return');
 let finish;global.createImageBitmap=()=>new Promise(resolve=>finish=()=>resolve({width:50,height:40,close(){}}));await mount(UI,{product,onClose:()=>closed++});const input=field('Zdjęcie do podglądu produktu');Object.defineProperty(input,'files',{value:[file],configurable:true});await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));await flush();await reset();await act(async()=>finish());await flush();assert.equal(created.length,2);
 console.log('PASS async decoder completion after dialog close creates no leaked object URL');
})().catch(error=>{console.error(error);process.exitCode=1});
