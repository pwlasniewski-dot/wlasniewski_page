require('tsx/cjs');
const assert=require('node:assert/strict'); const Module=require('node:module');
let order={id:42,payment_id:'pay42',product_ids:JSON.stringify({kind:'gallery_merchandise',version:1,lines:[]}),total_amount:10000,payment_status:'paid'};
let payment={id:5,resource_type:'GALLERY',resource_id:42,currency:'PLN',amount:10000,refunded_amount:0}; const markers=new Map();
const tx={$queryRaw:async()=>[{acquired:1}],photoOrder:{findUnique:async()=>order,update:async({data})=>Object.assign(order,data)},paymentLedger:{findUnique:async()=>payment,update:async({data})=>Object.assign(payment,data)},setting:{findUnique:async({where})=>markers.has(where.setting_key)?{setting_value:markers.get(where.setting_key)}:null,create:async({data})=>{markers.set(data.setting_key,data.setting_value);}}};
let queue=Promise.resolve();const db={$transaction:fn=>{const run=queue.then(()=>fn(tx));queue=run.catch(()=>{});return run;}};
const orig=Module._load;Module._load=function(name,...rest){if(name==='@/lib/db/prisma')return {__esModule:true,default:db};return orig.call(this,name,...rest)};
const {handleMerchandiseRefund:refund}=require('../../src/lib/galleries/merchandise-refund.ts');
const ev=(id,amount,status='FINALIZED')=>({orderId:'pay42',extOrderId:'GALLERY_42_123',refund:{refundId:id,amount:String(amount),currencyCode:'PLN',status}});
(async()=>{
assert.equal(await refund({}),false);
await refund(ev('r1',2000));assert.equal(payment.refunded_amount,2000);assert.equal(order.payment_status,'partially_refunded');
await Promise.all([refund(ev('r1',2000)),refund(ev('r1',2000))]);assert.equal(payment.refunded_amount,2000);
await assert.rejects(refund(ev('r1',1000)));await assert.rejects(refund({...ev('x',500),orderId:'wrong'}));await assert.rejects(refund({...ev('x',500),refund:{...ev('x',500).refund,currencyCode:'EUR'}}));
await refund(ev('canceled',2000,'CANCELED'));assert.equal(payment.refunded_amount,2000);
await refund(ev('r2',8000));assert.equal(payment.refunded_amount,10000);assert.equal(order.payment_status,'refunded');
await assert.rejects(refund(ev('r3',1)));assert.equal(markers.size,2);
console.log('PASS refunds: partial, cumulative, replay, concurrent duplicate, provider/currency mismatch, canceled, full, over-refund; simulated DB, no payment calls.');
})().catch(e=>{console.error(e);process.exitCode=1});
