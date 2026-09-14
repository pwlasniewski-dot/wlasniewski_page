import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultShopConfig, validateShopConfig, printUnitAmount, merchandisePrintEntries, priceShopCart, type ShopCatalog, type ShopLine, type ShopDelivery } from '../../src/lib/galleries/merchandise';
const catalog:ShopCatalog={galleryId:12,enabled:true,title:'Sklep',introduction:'Oferta',buttonLabel:'Zamów',formats:[{id:'p10',label:'10×15',widthMm:100,heightMm:150,unitAmount:350,active:true,paper:'mat'},{id:'p20',label:'20×30',widthMm:200,heightMm:300,unitAmount:1600,active:true,paper:'mat'}],products:[{id:10,title:'Album',description:'Album',price:9900,image_url:null,product_type:'album',minPhotos:2,maxPhotos:4}],delivery:{locker:{enabled:true,amount:1500},courier:{enabled:true,amount:2000}}};
const delivery:ShopDelivery={method:'locker',recipientName:'Anna Testowa',email:'anna@example.com',phone:'501222333',pointCode:'TOR01M'};
const print=(id='a',photoId=1,formatId='p10',quantity=2):ShopLine=>({id,kind:'print',photoId,formatId,quantity,crop:{mode:'fit',x:50,y:50,zoom:1},confirmed:true});
const product:ShopLine={id:'album',kind:'product',productId:10,photoIds:[1,2],coverPhotoId:1,quantity:1};
const price=(lines:ShopLine[],cat=catalog,del=delivery)=>priceShopCart(cat,lines,del,[1,2,3,4,5,6]);
test('batch prints: server uses catalog price, supports same photo in two formats plus product',()=>{const result=price([print(),print('b',1,'p20',1),product]);assert.equal(result.total,13700);assert.equal(result.lines.length,3);});
test('quantity must be bounded integer; reject 0, negative, fractional, huge, nonfinite',()=>{for(const n of [0,-1,1.5,1000000,NaN,Infinity])assert.throws(()=>price([print('a',1,'p10',n)]),String(n));});
test('only authorized gallery photos can be ordered, including product cover',()=>{assert.throws(()=>price([print('a',999)]));assert.throws(()=>price([{...product,photoIds:[1,999]}]));assert.throws(()=>price([{...product,coverPhotoId:999}]));});
test('reject unavailable format, product, disabled shop, disabled delivery',()=>{assert.throws(()=>price([print('a',1,'missing')]));assert.throws(()=>price([{...product,productId:999}]));assert.throws(()=>price([print()],{...catalog,enabled:false}));assert.throws(()=>price([print()],{...catalog,delivery:{...catalog.delivery,locker:{enabled:false,amount:0}}}));});
test('reject bad crop, unconfirmed prints, duplicate line identifiers, empty cart',()=>{assert.throws(()=>price([]));assert.throws(()=>price([print(),print()]));assert.throws(()=>price([{...print(),confirmed:false}] as ShopLine[]));for(const crop of [{mode:'fill',x:-1,y:50,zoom:1},{mode:'fill',x:50,y:50,zoom:10},{mode:'bogus',x:50,y:50,zoom:1}])assert.throws(()=>price([{...print(),crop}] as ShopLine[]));});
test('reject product image count outside bounds',()=>{assert.throws(()=>price([{...product,photoIds:[1]}]));assert.throws(()=>price([{...product,photoIds:[1,2,3,4,5]}]));});
test('delivery data required and courier address validated',()=>{assert.throws(()=>price([print()],catalog,{...delivery,pointCode:''}));assert.throws(()=>price([print()],catalog,{...delivery,email:'bad'}));assert.throws(()=>price([print()],catalog,{...delivery,method:'courier',address:undefined}));});
test('updated price is recalculated server side, never supplied client price',()=>{const altered={...catalog,formats:catalog.formats.map(f=>({...f,unitAmount:500}))};const line={...print(),unitAmount:1,total:1};assert.equal(price([line],altered).total,2500);});

test('merchandise lab export preserves quantity and paper; album photos are not extra prints',()=>{
 const priced=price([print(),print('b',1,'p20',3),product]);
 const raw=JSON.stringify({kind:'gallery_merchandise',version:1,lines:priced.lines});
 assert.deepEqual(merchandisePrintEntries(raw),[{photo_id:1,quantity:2,format:'10×15 · mat'},{photo_id:1,quantity:3,format:'20×30 · mat'}]);
 assert.deepEqual(merchandisePrintEntries(JSON.stringify({kind:'gallery_merchandise',version:1,lines:[priced.lines[2]]})),[]);
 for(const legacy of [null,'invalid','[1,2]',JSON.stringify({kind:'group_extra_prints',lines:[]})])assert.equal(merchandisePrintEntries(legacy),null);
});
test('product snapshot retains ordered specification after catalog edits',()=>{
 const ownCatalog=structuredClone(catalog);ownCatalog.products[0].nphoto_product_id='nphoto-123';ownCatalog.products[0].nphoto_url='https://nphoto.example/product/123';
 const ordered=price([product],ownCatalog).lines[0];
 ownCatalog.products[0].description='Changed variant';ownCatalog.products[0].price=1;
 assert.equal(ordered.unitAmount,9900);assert.equal(ordered.product?.description,'Album');assert.equal(ordered.product?.nphoto_product_id,'nphoto-123');
});


test('print tiers count all photos of a format, never products or another format',()=>{
 const cat=structuredClone(catalog);cat.formats[0].unitAmount=317;cat.formats[0].priceTiers=[{minQuantity:3,unitAmount:247},{minQuantity:6,unitAmount:157},{minQuantity:100,unitAmount:140}];
 for(const [qty,expected] of [[1,317],[2,317],[3,247],[5,247],[6,157],[99,157],[100,140]]) assert.equal(printUnitAmount(cat.formats[0],qty),expected);
 const result=price([print('a',1,'p10',2),print('b',2,'p10',4),print('c',3,'p20',5),product],cat);
 assert.equal(result.lines[0].unitAmount,157);assert.equal(result.lines[1].lineTotal,628);assert.equal(result.lines[2].unitAmount,1600);assert.equal(result.total,20342);
 const old=result.lines[0];cat.formats[0].priceTiers[1].unitAmount=999;
 assert.equal(old.unitAmount,157);assert.equal(old.format?.priceTiers?.[1].unitAmount,157);
});
test('tier validation rejects ambiguous or invalid price schedules',()=>{
 const config={...defaultShopConfig(),formats:[{...catalog.formats[0],priceTiers:[{minQuantity:3,unitAmount:200}]}]};
 assert.equal(validateShopConfig(config).formats[0].priceTiers?.[0].unitAmount,200);
 for(const tiers of [[{minQuantity:1,unitAmount:200}],[{minQuantity:3,unitAmount:0}],[{minQuantity:3,unitAmount:351}],[{minQuantity:3,unitAmount:200},{minQuantity:3,unitAmount:150}],[{minQuantity:3.5,unitAmount:200}],[{minQuantity:3,unitAmount:200},{minQuantity:6,unitAmount:250}]]) assert.throws(()=>validateShopConfig({...config,formats:[{...config.formats[0],priceTiers:tiers}]}));
});
