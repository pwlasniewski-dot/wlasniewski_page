import test from 'node:test';import assert from 'node:assert/strict';
import {qualifyProdigiProduct} from '../src/lib/fulfillment/prodigi-qualification';
const spec={version:1,provider:'prodigi',environment:'sandbox',productId:50,sku:'GLOBAL-FAP-10X10',variant:{attributes:{paperType:'EMA'},printAreaSizes:{default:{horizontalResolution:1000,verticalResolution:1000}}},requiredAssets:['default'],shippingMethod:'Budget',ordersEnabled:false,liveQualified:false,destination:'PL'};
function fixture(){let writes=0,cost='50.00';const product:any={id:50,gallery_id:null,archived_at:null,product_type:'prodigi_sandbox',price:9900,title:'Fine art',description:'Wydruk artystyczny',image_url:'https://images.example.com/product.jpg',updated_at:new Date('2026-10-03T12:00:00Z'),is_active:true};let value=JSON.stringify(spec);
 const db:any={galleryProduct:{findUnique:async()=>({...product}),update:async({data}:any)=>{writes++;Object.assign(product,data);return product;}},setting:{findUnique:async()=>({setting_value:value}),update:async({data}:any)=>{writes++;value=data.setting_value;}}};db.$transaction=async(fn:any)=>fn(db);
 const prepare:any=async()=>({variant:spec.variant,quote:{costSummary:{totalCost:{amount:'11.70',currency:'EUR'}}},fx:{mid:'4.3745'},pln:{amount:cost,currency:'PLN'},checkedAt:'2026-10-03T12:00:00Z'});
 return {db,product,prepare,writes:()=>writes,setting:()=>JSON.parse(value),raiseCost:()=>cost='50.01'};}
test('QA live qualification preview performs no persistence; explicit approval stays hidden',async()=>{
 const f=fixture();const preview=await qualifyProdigiProduct(f.db,{productId:50},f.prepare);assert.equal(preview.qualified,false);assert.equal(f.writes(),0);
 await qualifyProdigiProduct(f.db,{productId:50,approve:true,reviewHash:preview.reviewHash},f.prepare);assert.equal(f.setting().environment,'live');assert.equal(f.setting().liveQualified,true);assert.equal(f.product.is_active,false);assert.equal(f.product.product_type,'prodigi_live');
});
test('QA stale qualification review after cost or product price change cannot publish',async()=>{
 for(const mutate of [(f:any)=>f.raiseCost(),(f:any)=>f.product.price=10000]){const f=fixture();const preview=await qualifyProdigiProduct(f.db,{productId:50},f.prepare);mutate(f);await assert.rejects(qualifyProdigiProduct(f.db,{productId:50,approve:true,reviewHash:preview.reviewHash},f.prepare));assert.equal(f.writes(),0);}
});
test('QA missing merchandising and archived products cannot qualify',async()=>{
 for(const patch of [{description:''},{image_url:null},{price:0},{archived_at:new Date()}]){const f=fixture();Object.assign(f.product,patch);await assert.rejects(qualifyProdigiProduct(f.db,{productId:50},f.prepare));assert.equal(f.writes(),0);}
});
