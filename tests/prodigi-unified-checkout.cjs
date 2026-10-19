const h=require('./qa/gallery-shop-dom.cjs');
const {React,assert,act,mount,reset,flush,click,button}=h;
// Only external analytics is stubbed; provider, checkout, photo checkout and panel are real.
const analyticsPath=require.resolve('../src/hooks/useAnalytics.ts');
require.cache[analyticsPath]={id:analyticsPath,filename:analyticsPath,loaded:true,exports:{useAnalytics:()=>({trackEvent:()=>Promise.resolve()})}};
const {useCart,replacePhotoCartLines}=require('../src/context/CartContext.tsx');
const Checkout=require('../src/app/checkout/page.tsx').default;
const endpoint='/api/galleries/checkout-fixture/shop';
const other='/api/galleries/other-fixture/shop';
const photo={id:7,file_url:'/api/shop/personalization/photos/7',width:1200,height:1200};
const line={id:'product-fixture',kind:'product',productId:5,photoIds:[7],coverPhotoId:7,quantity:1};
const catalog={enabled:true,galleryId:1,title:'Oferta QA',introduction:'',buttonLabel:'Produkty',formats:[],products:[{id:5,title:'Album QA',description:'Test',price:12000,minPhotos:1,maxPhotos:4}],delivery:{locker:{enabled:false,amount:0},courier:{enabled:true,amount:2000},pickup:{enabled:false,amount:0,instructions:''}}};
const gift={id:'gift-one',type:'gift_card',title:'Karta QA',price:5000,quantity:1,metadata:{}};
let cart,requests=[],payment='pending';
function Shell(){cart=useCart();return React.createElement(Checkout);}
const response=data=>({ok:true,status:200,json:async()=>structuredClone(data)});
global.fetch=async(url,init={})=>{requests.push({url,init});if(url==='/api/settings/public')return response({settings:{}});if(url.endsWith('/shop'))return response({success:true,catalog});if(url.endsWith('/orders/42'))return response({success:true,order:{payment_status:payment}});if(url==='/api/basket/checkout')return response({paymentRequired:false,redirectUrl:'#confirmed'});throw Error('Unexpected request '+url);};
async function settle(){for(let n=0;n<7;n++)await flush();}
function seed(){let items=replacePhotoCartLines([gift],endpoint,[line],{catalog,photos:[photo]});items=replacePhotoCartLines(items,other,[{...line,id:'other'}],{catalog,photos:[photo]});localStorage.setItem('shopping_cart',JSON.stringify(items));}
(async()=>{
 localStorage.clear();sessionStorage.clear();seed();localStorage.setItem('client_token','current-session-fixture');
 window.history.replaceState(null,'','/checkout?shopOrder=42&shopEndpoint='+encodeURIComponent(endpoint));
 sessionStorage.setItem(`gallery-shop-pending:${endpoint}`,JSON.stringify({id:42,key:'private-order-fixture',lines:[line]}));
 await mount(Shell);await settle();
 assert.ok(document.body.textContent.includes('Jeden koszyk, oddzielne zamówienia'));
 assert.ok(document.querySelector('h1').textContent.includes('Jeden koszyk'));
 assert.ok(document.body.textContent.includes('oczekuje na potwierdzenie'));
 assert.equal(requests.find(r=>r.url===endpoint).init.headers.Authorization,'Bearer current-session-fixture');
 assert.ok(!localStorage.getItem('shopping_cart').includes('current-session-fixture'));
 assert.equal(cart.items.length,3);
 console.log('PASS payment return selects requested photo group and reads current credentials without persisting them');
 payment='paid';await click(button(/Sprawdź status płatności/));await settle();
 assert.ok(document.body.textContent.includes('opłacone'));
 assert.deepEqual(cart.items.map(i=>i.id).sort(),['gift-one',`${other}:other`].sort());
 console.log('PASS confirmed payment removes only paid photo snapshot and retains its success panel plus other groups');
 await click(button(/^1\. Karta QA/));await settle();
 const terms=[...document.querySelectorAll('input[type="checkbox"]')].find(input=>input.parentElement.textContent.toLowerCase().includes('regulamin'));
 assert.ok(terms);await click(terms);
 const bookingForm=[...document.querySelectorAll('form')].find(form=>form.querySelector('input[type="email"]'));
 await act(async()=>bookingForm.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));await settle();
 const submitted=JSON.parse(requests.find(r=>r.url==='/api/basket/checkout').init.body);
 assert.equal(submitted.items.length,1);assert.equal(submitted.items[0].id,'gift-one');
 assert.deepEqual(cart.items.map(i=>i.id),[`${other}:other`]);
 console.log('PASS existing basket checkout submits one selected gift and preserves the unrelated photo order');
 await reset();localStorage.clear();sessionStorage.clear();requests=[];payment='paid';
 window.history.replaceState(null,'','/checkout?shopOrder=42&shopEndpoint='+encodeURIComponent(endpoint));
 sessionStorage.setItem(`gallery-shop-pending:${endpoint}`,JSON.stringify({id:42,key:'private-order-fixture',lines:[line]}));
 await mount(Shell);await settle();assert.ok(document.body.textContent.includes('opłacone'));assert.equal(cart.items.length,0);
 console.log('PASS payment return without stored basket still checks the pending order and shows confirmation');
 await reset();
})().catch(error=>{console.error(error);process.exitCode=1;});
