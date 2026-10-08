const h=require('./qa/gallery-shop-dom.cjs');const {assert,React,act,mount,reset,flush,click,button,field,set}=h;const {File}=require('node:buffer');const {webcrypto,createHash}=require('node:crypto');const sharp=require('sharp');
Object.defineProperty(global,'crypto',{value:webcrypto,configurable:true});
let dimensions={width:1200,height:1200},transferFailure=false,sessionPhotos=[],calls=[],transfers=[],orders=[],completed=0;
global.createImageBitmap=async()=>({...dimensions,close(){}});
global.XMLHttpRequest=class{constructor(){this.upload={};this.headers={};this.status=200;}open(method,url){this.method=method;this.url=url;}setRequestHeader(k,v){this.headers[k]=v;}send(file){transfers.push({method:this.method,url:this.url,headers:this.headers,file});queueMicrotask(()=>{if(transferFailure)this.onerror();else{this.upload.onprogress?.({lengthComputable:true,loaded:file.size,total:file.size});this.onload();}});}abort(){this.onabort?.();}};
const spec={version:1,provider:'prodigi',environment:'live',productId:50,sku:'GLOBAL-FAP-10X10',variant:{attributes:{paperType:'EMA'},printAreaSizes:{default:{horizontalResolution:1000,verticalResolution:1000}}},requiredAssets:['default'],shippingMethod:'Budget',ordersEnabled:true,liveQualified:true,destination:'PL'};
const catalog={galleryId:12,enabled:true,title:'Produkty QA',introduction:'',buttonLabel:'Kup produkt',formats:[],delivery:{locker:{enabled:false,amount:1500},courier:{enabled:true,amount:2000},pickup:{enabled:false,amount:0,instructions:''}},products:[{id:50,personalizationEligible:true,title:'Fine art',description:'Fotografia Fine art',price:9900,image_url:null,product_type:'prodigi_live',minPhotos:1,maxPhotos:1,prodigi:spec}]};
const offer={personalizationEnabled:true,personalizationTitle:'Moje zdjęcia QA',personalizationIntroduction:'Własny tekst CMS',personalizationButtonLabel:'Otwórz moje zdjęcia'};
const session=()=>({success:true,galleryId:12,accessCode:'private-upload',photos:sessionPhotos,limits:{fileBytes:20*1024*1024,totalBytes:50*1024*1024,photos:100,minDimension:100,maxPixels:60000000}});
const response=(value,status=200)=>({ok:status<400,status,json:async()=>structuredClone(value)});
global.fetch=async(url,init={})=>{const method=init.method||'GET',body=init.body?JSON.parse(init.body):null;calls.push({url,method,body});
 if(url==='/api/shop/catalog')return response({success:true,catalog:{offer,products:catalog.products}});
 if(url.endsWith('/personalization/session'))return response(session());
 if(url.endsWith('/personalization/upload'))return response({success:true,uploadId:'00000000-0000-0000-0000-000000000001',url:'https://s3.example.test/staging',method:'PUT',headers:{'Content-Type':body.contentType,'x-amz-checksum-sha256':'fixture-checksum','If-None-Match':'*'}});
 if(url.endsWith('/personalization/complete')){completed++;const photo={id:sessionPhotos.length+1,previewUrl:'/api/shop/personalization/photos/'+(sessionPhotos.length+1),width:1200,height:1200};sessionPhotos.push(photo);return response({success:true,photo});}
 if(url.endsWith('/shop')&&method==='GET')return response({success:true,catalog});
 if(url.includes('/shop/orders/')&&method==='GET')return response({success:true,order:orders.find(o=>o.id===Number(url.split('/').pop()))});
 if(url.endsWith('/shop/orders')&&method==='POST'){const {priceShopCart}=require('../src/lib/galleries/merchandise.ts');const priced=priceShopCart(catalog,body.lines,body.delivery,sessionPhotos.map(p=>p.id));assert.equal(body.expectedTotal,priced.total);const key=init.headers['Idempotency-Key'];let order=orders.find(o=>o.key===key);if(!order){order={id:orders.length+1,key,payment_status:'pending',total_amount:priced.total,metadata:priced};orders.push(order);}return response({success:true,orderId:order.id,paymentUrl:'http://localhost/qa#payment'});}
 throw Error('Unexpected mock URL '+url);
};
const UI=require('../src/components/shop/PersonalizationShop.tsx').default;
const {useCart}=require('../src/context/CartContext.tsx');
const Drawer=require('../src/components/BasketDrawer.tsx').default;
let cart;
function Probe(){cart=useCart();return React.createElement('output',{'aria-label':'Global cart count'},cart.totalCount);}
function Shell(){return React.createElement(React.Fragment,null,React.createElement(Probe),React.createElement(UI),React.createElement(Drawer));}

async function open(){await reset();await mount(Shell,{});assert.ok(document.body.textContent.includes('Własny tekst CMS'));await set(field('Produkt do personalizacji'),50);await click(button('Otwórz moje zdjęcia'));}
async function upload(file){const input=field('Dodaj własne zdjęcie');Object.defineProperty(input,'files',{value:[file],configurable:true});await act(async()=>{input.dispatchEvent(new Event('change',{bubbles:true}));});for(let n=0;n<8;n++)await flush();}
async function choose(){await click(button('Wybierz produkt: Fine art'));if(!field('Zaznacz zdjęcie 1').checked)await click(field('Zaznacz zdjęcie 1'));const preview=document.querySelector('img[alt="Twoje zdjęcie dopasowane do pola druku"]');assert.ok(preview);assert.equal(preview.style.objectFit,'contain');assert.equal(preview.style.aspectRatio,'1000 / 1000');assert.ok(document.body.textContent.includes('nie wizualizacja ramy'));await click(button(/^Dodaj produkt do koszyka/));}
async function submit(){await click(button('Dostawa i podsumowanie'));await set(field('Imię i nazwisko'),'QA Klient');await set(field('E-mail'),'qa@example.test');await set(field('Telefon'),'501222333');await set(field('Ulica, numer domu i lokalu'),'Testowa 1');await set(field('Kod pocztowy'),'00-001');await set(field('Miejscowość'),'Warszawa');await click(button(/^Zamawiam i płacę/));}
(async()=>{
 localStorage.clear();sessionStorage.clear();
 const bytes=await sharp({create:{width:1200,height:1200,channels:3,background:'#eee'}}).png().toBuffer();
 await open();await upload(new File([bytes],'global-cart.png',{type:'image/png'}));await choose();
 assert.equal(cart.items.filter(i=>i.type==='photo_product').length,1);assert.equal(cart.totalCount,1);
 assert.equal(document.querySelector('[aria-label="Global cart count"]').textContent,'1');
 await act(async()=>cart.setIsOpen(true));await flush();assert.ok(document.body.textContent.includes('Twój Koszyk'));
 const item=cart.items.find(i=>i.type==='photo_product');assert.equal(item.metadata.endpoint,'/api/galleries/private-upload/shop');assert.equal(item.metadata.line.photoIds[0],1);
 assert.equal(sessionStorage.getItem('gallery-shop:/api/galleries/private-upload/shop'),null);
 assert.ok(JSON.parse(localStorage.getItem('shopping_cart')).some(i=>i.id===item.id));
 console.log('PASS actual upload→product selection→single global count/drawer/persistent store; no separate gallery cart');
 await set(field("Liczba sztuk: Fine art"),3);assert.equal(cart.totalCount,3);
 await open();assert.equal(cart.totalCount,3);assert.equal(cart.items.find(i=>i.id===item.id).quantity,3);
 await act(async()=>cart.addItem({type:'booking',title:'QA booking',price:5000,quantity:1,metadata:{packageId:1}}));await flush();assert.ok(cart.items.some(i=>i.id===item.id));assert.ok(cart.items.some(i=>i.type==='booking'));
 await act(async()=>cart.addItem({type:'gift_card',title:'QA gift',price:7000,quantity:1,metadata:{recipient_name:'QA'}}));await flush();assert.ok(cart.items.some(i=>i.id===item.id));assert.ok(cart.items.some(i=>i.type==='gift_card'));
 const other='/api/galleries/other-shop/shop';
 await act(async()=>cart.setPhotoLines(other,[{id:'other-line',kind:'product',productId:50,photoIds:[1],coverPhotoId:1,quantity:2}],{catalog,photos:[{id:1,file_url:'/other.jpg',width:1200,height:1200}]}));await flush();
 assert.ok(cart.items.some(i=>i.metadata?.endpoint===other));
 await act(async()=>cart.setPhotoLines('/api/galleries/private-upload/shop',[],{catalog,photos:[]}));await flush();
 assert.ok(!cart.items.some(i=>i.id===item.id));assert.ok(cart.items.some(i=>i.metadata?.endpoint===other));assert.ok(cart.items.some(i=>i.type==='gift_card'));
 await act(async()=>cart.setIsOpen(true));await flush();await click(field('Usuń z koszyka: Fine art'));assert.ok(!cart.items.some(i=>i.metadata?.endpoint===other));assert.ok(cart.items.some(i=>i.type==='booking'));assert.ok(cart.items.some(i=>i.type==='gift_card'));
 console.log('PASS quantity/reload and endpoint-local removal preserve other gallery and booking/gift choice');
 const printEndpoint='/api/galleries/prints/shop';const printCatalog={...catalog,formats:[{id:'p10',label:'10x15 QA',widthMm:100,heightMm:150,unitAmount:350,active:true,paper:'mat',priceTiers:[{minQuantity:3,unitAmount:250}]}]};
 await act(async()=>cart.setPhotoLines(printEndpoint,[{id:'print1',kind:'print',crop:{mode:'fit',x:0,y:0,zoom:1},confirmed:true,photoId:1,formatId:'p10',quantity:1},{id:'print2',kind:'print',crop:{mode:'fit',x:0,y:0,zoom:1},confirmed:true,photoId:2,formatId:'p10',quantity:1}],{catalog:printCatalog,photos:[{id:1,file_url:'/one.jpg'},{id:2,file_url:'/two.jpg'}]}));await flush();
 let prints=cart.items.filter(i=>i.type==='photo_print');assert.deepEqual(prints.map(i=>i.price),[350,350]);
 const quantityFields=[...document.querySelectorAll('[aria-label="Liczba sztuk: 10x15 QA"]')];assert.equal(quantityFields.length,2);await set(quantityFields[0],2);
 prints=cart.items.filter(i=>i.type==='photo_print');assert.deepEqual(prints.map(i=>i.price),[250,250]);assert.equal(prints.reduce((sum,i)=>sum+i.quantity*i.price,0),750);
 await open();prints=cart.items.filter(i=>i.type==='photo_print');assert.deepEqual(prints.map(i=>i.price),[250,250]);
 await act(async()=>cart.removeItem(prints[1].id));await flush();prints=cart.items.filter(i=>i.type==='photo_print');assert.equal(prints[0].price,350);assert.equal(prints[0].quantity,2);
 console.log('PASS global drawer quantity tier recalculates all format lines, survives reload and reverts after removal');
 await reset();
})().catch(error=>{console.error(error);process.exitCode=1;});
