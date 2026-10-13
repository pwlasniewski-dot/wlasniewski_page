const {assert,reset}=require('./qa/gallery-shop-dom.cjs');const Module=require('node:module');
let order={id:42,payment_id:'pay42',gallery_id:12,total_amount:10000,payment_status:'refunded',product_ids:JSON.stringify({kind:'gallery_merchandise',version:1,lines:[],delivery:{email:'qa@example.test'}})};let payment={amount:10000,refunded_amount:10000,status:'COMPLETED'},mails=0;
const db={photoOrder:{findUnique:async()=>order,updateMany:async({where,data})=>{if(where.payment_status.in.includes(order.payment_status)){Object.assign(order,data);return{count:1};}return{count:0};}},paymentLedger:{upsert:async({update})=>Object.assign(payment,update)}};
const load=Module._load;Module._load=function(name,...args){if(name==='@/lib/db/prisma')return{__esModule:true,default:db};if(name==='@/lib/email/sender')return{sendEmail:async()=>{mails++;},getAdminEmail:async()=>null};return load.call(this,name,...args);};
const {handleMerchandisePayment}=require('../src/lib/galleries/merchandise-payment.ts');
(async()=>{const event={extOrderId:'GALLERY_42_123',orderId:'pay42',status:'COMPLETED',totalAmount:10000,currencyCode:'PLN'};
 for(const status of ['refunded','partially_refunded']){order.payment_status=status;assert.equal(await handleMerchandisePayment(event),true);assert.equal(order.payment_status,status);assert.equal(payment.refunded_amount,10000);}
 assert.equal(mails,0);console.log('PASS late COMPLETED notification never restores refunded or partially refunded order, preserves refund amount and sends no email');await reset();
})().catch(e=>{console.error(e);process.exitCode=1;});
