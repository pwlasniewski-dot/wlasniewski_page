import assert from 'node:assert/strict';
import test from 'node:test';
import {prepareProdigiProduct} from '../src/lib/fulfillment/prodigi-catalog-import';

// A default print area alone does not prove that a SKU accepts one photograph.
// Photobooks and calendars need paginated PDF/layout support not present here.
for(const sku of ['BOOK-A4-L-HARD-M','CALENDAR-A4-L-UNDATED','UNKNOWN-NEW-PRODUCT']){
 test(`QA unsupported capability fails closed despite default area: ${sku}`,async()=>{
  const inspector:any=async(request:any)=>request.action==='product'?{action:'product',product:{sku,description:'Synthetic multi-page product',printAreas:{default:{required:true}},variants:[{attributes:{},shipsTo:['PL'],printAreaSizes:{default:{horizontalResolution:1000,verticalResolution:1000}}}]}}:{action:'quote',currency:'EUR',checkedAt:'2026-10-03T12:00:00Z',quotes:[{shipmentMethod:'Budget',costSummary:{totalCost:{amount:'10.00',currency:'EUR'}}}]};
  const fx:any=async()=>({available:true,source:'NBP',currency:'EUR',quoteCurrency:'PLN',mid:'4.0000',effectiveDate:'2026-10-02',tableNo:'192/A/NBP/2026'});
  await assert.rejects(prepareProdigiProduct({sku,attributes:{},title:'Fixture',price:9900,shipmentMethod:'Budget',copies:1},inspector,fx));
 });
}

test('QA stored unsupported supplier configuration fails closed for checkout, qualification and preflight',async()=>{
 const {readProdigiProduct,supportsProdigiSinglePhoto}=await import('../src/lib/fulfillment/prodigi-catalog');
 const base={version:1,provider:'prodigi',environment:'live',productId:50,variant:{attributes:{},printAreaSizes:{default:{horizontalResolution:1000,verticalResolution:1000}}},requiredAssets:['default'],shippingMethod:'Budget',ordersEnabled:true,liveQualified:true,destination:'PL'};
 for(const sku of ['BOOK-A4-L-HARD-M','CALENDAR-A4-L-UNDATED','GLOBAL-MUG-W','GLOBAL-FAP-10X10-PDF','GLOBAL-CAN-0X10','UNKNOWN-NEW-PRODUCT'])assert.equal(readProdigiProduct({...base,sku}),null);
 for(const sku of ['GLOBAL-FAP-10X10','GLOBAL-FAP-16X24','GLOBAL-CAN-10X10','GLOBAL-CAN-30X40']){assert.equal(supportsProdigiSinglePhoto(sku),true);assert.ok(readProdigiProduct({...base,sku}));}
});
