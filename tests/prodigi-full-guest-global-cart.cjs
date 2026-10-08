const h=require('./qa/gallery-shop-dom.cjs');const {assert,React,act,mount,reset,flush,click,button,field,set}=h;const {File}=require('node:buffer');const {webcrypto,createHash}=require('node:crypto');const sharp=require('sharp');
Object.defineProperty(global,'crypto',{value:webcrypto,configurable:true});
let dimensions={width:1200,height:1200},transferFailure=false,sessionPhotos=[],calls=[],transfers=[],orders=[],completed=0;
global.createImageBitmap=async()=>({...dimensions,close(){}});
global.XMLHttpRequest=class{constructor(){this.upload={};this.headers={};this.status=200;}open(method,url){this.method=method;this.url=url;}setRequestHeader(k,v){this.headers[k]=v;}send(file){transfers.push({method:this.method,url:this.url,headers:this.headers,file});queueMicrotask(()=>{if(transferFailure)this.onerror();else{this.upload.onprogress?.({lengthComputable:true,loaded:file.size,total:file.size});this.onload();}});}abort(){this.onabort?.();}};
const spec={version:1,provider:'prodigi',environment:'live',productId:50,sku:'GLOBAL-FAP-10X10',variant:{attributes:{paperType:'EMA'},printAreaSizes:{default:{horizontalResolution:1000,verticalResolution:1000}}},requiredAssets:['default'],shippingMethod:'Budget',ordersEnabled:true,liveQualified:true,destination:'PL'};
const catalog={galleryId:12,enabled:true,title:'Produkty QA',introduction:'',buttonLabel:'Kup produkt',formats:[],delivery:{locker:{enabled:false,amount:1500},courier:{enabled:true,amount:2000},pickup:{enabled:false,amount:0,instructions:''}},products:[{id:50,personalizationEligible:true,personalizationPreview:{kind:'canvas',width:1000,height:1000,physicalWidthMm:254,physicalHeightMm:254,depthMm:38,edgeColor:'black'},title:'Fine art',description:'Fotografia Fine art',price:9900,image_url:null,product_type:'prodigi_live',minPhotos:1,maxPhotos:1,prodigi:spec}]};
catalog.products.push({id:1,title:'Alnum 30x30',description:'Inny album',price:25000,minPhotos:10,maxPhotos:30});
const offer={personalizationEnabled:true,personalizationTitle:'Moje zdjęcia QA',personalizationIntroduction:'Własny tekst CMS',personalizationButtonLabel:'Otwórz moje zdjęcia'};
const session=()=>({success:true,galleryId:12,accessCode:'private-upload',photos:sessionPhotos,limits:{fileBytes:20*1024*1024,totalBytes:50*1024*1024,photos:100,minDimension:100,maxPixels:60000000}});
const response=(value,status=200)=>({ok:status<400,status,json:async()=>structuredClone(value)});
global.fetch=async(url,init={})=>{const method=init.method||'GET',body=init.body?JSON.parse(init.body):null;calls.push({url,method,body});
 if(url==='/api/shop/catalog')return response({success:true,catalog:{offer,products:catalog.products}});
 if(url.endsWith('/personalization/session'))return response(session());
 if(url.endsWith('/personalization/upload'))return response({success:true,uploadId:'00000000-0000-0000-0000-000000000001',url:'https://s3.example.test/staging',method:'PUT',headers:{'Content-Type':body.contentType,'x-amz-checksum-sha256':'fixture-checksum','If-None-Match':'*'}});
 if(url.endsWith('/personalization/complete')){completed++;const photo={id:sessionPhotos.length+1,previewUrl:'/api/shop/personalization/photos/'+(sessionPhotos.length+1),width:dimensions.width,height:dimensions.height};sessionPhotos.push(photo);return response({success:true,photo});}
 if(url.endsWith('/shop')&&method==='GET')return response({success:true,catalog});
 if(url.includes('/shop/orders/')&&method==='GET')return response({success:true,order:orders.find(o=>o.id===Number(url.split('/').pop()))});
 if(url.endsWith('/shop/orders')&&method==='POST'){const {priceShopCart}=require('../src/lib/galleries/merchandise.ts');const priced=priceShopCart(catalog,body.lines,body.delivery,sessionPhotos.map(p=>p.id));assert.equal(body.expectedTotal,priced.total);const key=init.headers['Idempotency-Key'];let order=orders.find(o=>o.key===key);if(!order){order={id:orders.length+1,key,payment_status:'pending',total_amount:priced.total,metadata:priced};orders.push(order);}return response({success:true,orderId:order.id,paymentUrl:'http://localhost/qa#payment'});}
 throw Error('Unexpected mock URL '+url);
};
const UI=require('../src/components/shop/GuestProductPreview.tsx').default;
URL.createObjectURL=()=> 'blob:retained-photo';URL.revokeObjectURL=()=>{};
async function choose(file){const input=field('Zdjęcie do podglądu produktu');Object.defineProperty(input,'files',{value:[file],configurable:true});await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})));for(let n=0;n<12;n++)await flush();}
async function settle(){for(let n=0;n<14;n++)await flush();}
const {useCart}=require('../src/context/CartContext.tsx');
const Drawer=require('../src/components/BasketDrawer.tsx').default;
let cart,closeCount=0;
function Shell(){cart=useCart();const [open,setOpen]=React.useState(true);return React.createElement(React.Fragment,null,React.createElement('output',{'aria-label':'Global count'},cart.totalCount),open&&React.createElement(UI,{product:catalog.products[0],onClose(){closeCount++;setOpen(false);}}),React.createElement(Drawer));}
(async()=>{
 localStorage.clear();sessionStorage.clear();
 const bytes=await sharp({create:{width:1200,height:1200,channels:3,background:'#eee'}}).png().toBuffer();
 await mount(Shell);await choose(new File([bytes],'guest.png',{type:'image/png'}));assert.equal(transfers.length,0);
 await click(button(/^Dodaj do koszyka/));await settle();
 assert.equal(transfers.length,1);assert.equal(completed,1);assert.equal(closeCount,1);assert.equal(document.querySelector('[aria-label="Zdjęcie do podglądu produktu"]'),null);
 assert.equal(cart.totalCount,1);assert.equal(cart.items[0].type,'photo_product');assert.ok(cart.isOpen);assert.ok(document.body.textContent.includes('Twój Koszyk'));
 assert.equal(document.querySelector('[aria-label="Global count"]').textContent,'1');
 await set(field('Liczba sztuk: '+catalog.products[0].title),2);assert.equal(cart.totalCount,2);assert.equal(cart.items[0].metadata.line.quantity,2);
 assert.equal(transfers.length,1);assert.equal(JSON.parse(localStorage.getItem('shopping_cart'))[0].quantity,2);
 await click(field('Usuń z koszyka: '+catalog.products[0].title));assert.equal(cart.totalCount,0);assert.deepEqual(JSON.parse(localStorage.getItem('shopping_cart')),[]);
 console.log('PASS actual guest modal add uploads once, closes preview, opens one global drawer; drawer quantity/removal persist');
 await reset();
})().catch(error=>{console.error(error);process.exitCode=1;});
