import assert from 'node:assert/strict';
import test from 'node:test';
import {defaultShopConfig,priceShopCart,type ShopCatalog} from '../src/lib/galleries/merchandise';
import {availableShopDelivery} from '../src/lib/galleries/shop-delivery';
const spec={version:1 as const,provider:'prodigi' as const,environment:'live' as const,productId:50,sku:'GLOBAL-FAP-10X10',variant:{attributes:{paperType:'EMA'},printAreaSizes:{default:{horizontalResolution:1000,verticalResolution:1000}}},requiredAssets:['default'],shippingMethod:'Budget',ordersEnabled:true,liveQualified:true,destination:'PL' as const};
const product={id:50,title:'Fine art',description:'Papier artystyczny',price:9900,image_url:null,product_type:'prodigi_live',minPhotos:1,maxPhotos:1,prodigi:spec};
function catalog():ShopCatalog{return {...defaultShopConfig(),enabled:true,galleryId:12,delivery:{locker:{enabled:true,amount:1500},courier:{enabled:true,amount:2000},pickup:{enabled:true,amount:0,instructions:'Odbiór'}},products:[structuredClone(product)],formats:[{id:'p10',label:'10x15',widthMm:100,heightMm:150,unitAmount:350,active:true,paper:'mat'}]};}
const line={id:'one',kind:'product' as const,productId:50,photoIds:[1],coverPhotoId:1,quantity:2};
const delivery={method:'courier' as const,recipientName:'Anna Testowa',email:'qa@example.com',phone:'501222333',address:{street:'Testowa 1',postalCode:'00-001',city:'Warszawa'}};
test('QA checkout takes price and supplier specification only from server catalog, freezes snapshot',()=>{
 const c=catalog();const result=priceShopCart(c,[{...line,unitAmount:1,lineTotal:1,product:{prodigi:{...spec,sku:'FAKE'}}}],delivery,[1]);
 assert.equal(result.total,21800);assert.equal(result.lines[0].unitAmount,9900);assert.equal(result.lines[0].product?.prodigi?.sku,'GLOBAL-FAP-10X10');
 c.products[0].prodigi!.variant.attributes.paperType='OTHER';c.products[0].price=55500;assert.equal(result.lines[0].product?.prodigi?.variant.attributes.paperType,'EMA');assert.equal(result.total,21800);
});
test('QA checkout rejects sandbox, unqualified, disabled, wrong product ID or missing supplier specification',()=>{
 for(const change of [(p:any)=>{p.prodigi.environment='sandbox';},(p:any)=>{p.prodigi.ordersEnabled=false;},(p:any)=>{p.prodigi.liveQualified=false;},(p:any)=>{p.prodigi.productId=99;},(p:any)=>{delete p.prodigi;}]){const c=catalog();change(c.products[0]);assert.throws(()=>priceShopCart(c,[line],delivery,[1]));}
});
test('QA checkout never accepts another gallery photo or arbitrary extra print area',()=>{
 const c=catalog();assert.throws(()=>priceShopCart(c,[{...line,photoIds:[2],coverPhotoId:2}],delivery,[1]));c.products[0].prodigi!.requiredAssets.push('back');assert.throws(()=>priceShopCart(c,[line],delivery,[1]));
});
test('QA Prodigi delivery permits courier only even if pickup is enabled and no restriction set',()=>{
 const c=catalog(),allowed=availableShopDelivery(c,[line]);assert.equal(allowed.courier.enabled,true);assert.equal(allowed.pickup?.enabled,false);assert.equal(allowed.locker.enabled,false);
 for(const method of ['pickup','locker'])assert.throws(()=>priceShopCart(c,[line],{...delivery,method,pointCode:'TOR01M'},[1]));
});
test('QA mixed direct-ship supplier plus local prints or products rejects before payment',()=>{
 const c=catalog();c.products.push({id:51,title:'Album lokalny',description:null,price:9000,image_url:null,product_type:'album',minPhotos:1,maxPhotos:1});
 const print={id:'two',kind:'print',photoId:1,formatId:'p10',quantity:1,crop:{mode:'fit',x:50,y:50,zoom:1},confirmed:true};
 assert.throws(()=>priceShopCart(c,[line,print],delivery,[1]));assert.throws(()=>priceShopCart(c,[line,{...line,id:'two',productId:51}],delivery,[1]));
});

test('QA unsupported line count and incompatible supplier services reject before payment',()=>{
 const c=catalog();assert.throws(()=>priceShopCart(c,Array.from({length:11},(_,index)=>({...line,id:'line-'+index})),delivery,[1]));
 c.products.push({...structuredClone(product),id:51,prodigi:{...structuredClone(spec),productId:51,shippingMethod:'Express'}});assert.throws(()=>priceShopCart(c,[line,{...line,id:'two',productId:51}],delivery,[1]));
});

test('QA customer projection removes supplier spec, production sources and internal identifiers',async()=>{
 const {customerShopMetadata}=await import('../src/lib/galleries/merchandise');const priced=priceShopCart(catalog(),[line],delivery,[1]);
 const raw:any={kind:'gallery_merchandise',version:1,customerId:7,lines:priced.lines,delivery:priced.delivery,fulfillment:{status:'shipped',trackingNumber:'TRACK-123'},prodigiPrepared:{sources:{one:{objectKey:'secret-object-key',url:'https://private.test'}},input:{quote:{providerCostGrosze:5000}}},providerFulfillment:{idempotencyKey:'secret-idempotency-key',approvedBy:7}};
 const projected=customerShopMetadata(raw);assert.equal(projected.fulfillment.trackingNumber,'TRACK-123');assert.equal(projected.lines[0].product?.prodigi,undefined);assert.equal((projected as any).prodigiPrepared,undefined);assert.equal((projected as any).providerFulfillment,undefined);assert.equal((projected as any).customerId,undefined);assert.doesNotMatch(JSON.stringify(projected),/secret-object-key|secret-idempotency-key|providerCostGrosze/);assert.ok(raw.prodigiPrepared);
});
