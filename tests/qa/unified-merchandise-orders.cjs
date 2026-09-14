const {assert,check}=require('./gallery-shop-dom.cjs');
const Module=require('node:module');
const {NextRequest,NextResponse}=require('next/server');
let authorized=true;
const metadata={kind:'gallery_merchandise',version:1,lines:[{id:'p',kind:'print',photoId:4,formatId:'15',quantity:2,title:'15×21',unitAmount:250,lineTotal:500,format:{label:'15×21'}},{id:'a',kind:'product',productId:7,photoIds:[4],coverPhotoId:4,quantity:1,title:'Album PRO',unitAmount:25770,lineTotal:25770}],delivery:{method:'courier',amount:2500,recipientName:'Test Odbiorca',email:'test@example.com'},fulfillment:{status:'packed',trackingNumber:null}};
const gallery={id:26,client_name:'Właściciel galerii',client_email:'owner@example.com',group_access_code:null};
const rows=[{id:1,photo_ids:'[4]',product_ids:JSON.stringify(metadata),gallery,participant_id:null,total_amount:28770,payment_status:'paid',created_at:new Date(),photo_count:1},{id:2,photo_ids:'[4]',product_ids:'[]',gallery,participant_id:null,total_amount:150,payment_status:'paid',created_at:new Date(),photo_count:1}];
const db={giftCardOrder:{findMany:async()=>[{id:3,customer_email:'gift@example.com',customer_name:'Karta',amount_paid:10000,currency:'PLN',payment_status:'completed',created_at:new Date(),gift_card:null}]},photoOrder:{findMany:async()=>rows},galleryPhoto:{findMany:async()=>[{id:4,file_url:'https://example.com/photo.jpg',thumbnail_url:null}]},galleryProduct:{findMany:async()=>[]}};
const original=Module._load;Module._load=function(name){if(name==='@/lib/db/prisma')return {__esModule:true,default:db};if(name==='@/lib/auth/middleware')return {requireAuth:async()=>authorized?{}:NextResponse.json({error:'Unauthorized'},{status:401})};return original.apply(this,arguments)};
const {GET}=require('../../src/app/api/admin/orders/route.ts');
(async()=>{
 await check('unified orders reject unauthenticated access',async()=>{authorized=false;assert.equal((await GET(new NextRequest('http://localhost'))).status,401);authorized=true});
 await check('one list preserves gifts and legacy orders and maps merchandise once from its paid snapshot',async()=>{const data=await (await GET(new NextRequest('http://localhost'))).json();assert.equal(data.success,true);assert.equal(data.orders.length,3);const order=data.orders.find(o=>o.id==='GL-1');assert.equal(order.customerName,'Test Odbiorca');assert.equal(order.amount,28770);assert.deepEqual(order.orderItems.map(i=>[i.title,i.quantity,i.totalAmount]),[['15×21',2,500],['Album PRO',1,25770]]);assert.equal(order.merchandise.delivery.amount,2500);assert.equal(order.merchandise.fulfillment.status,'packed');assert.equal(data.orders.find(o=>o.id==='GL-2').orderItems[0].totalAmount,150);assert.ok(data.orders.find(o=>o.id==='GC-3'));});
})().catch(e=>{console.error(e);process.exitCode=1});
