import test from 'node:test';
import assert from 'node:assert/strict';
import {canDisplayProdigiProduct,readProdigiProduct} from '../../src/lib/fulfillment/prodigi-catalog';
const sandbox=readProdigiProduct({version:1,provider:'prodigi',environment:'sandbox',productId:1,sku:'GLOBAL-FAP-11X14',variant:{attributes:{paperType:'EMA'},printAreaSizes:{default:{horizontalResolution:3307,verticalResolution:4192}}},requiredAssets:['default'],shippingMethod:'Budget',ordersEnabled:false,liveQualified:false,destination:'PL'})!;
test('sandbox display is restricted to isolated QA and remains disabled for ordering',()=>{
 assert.equal(canDisplayProdigiProduct(sandbox,1,true,false),true);
 assert.equal(canDisplayProdigiProduct(sandbox,1,false,true),false);
 assert.equal(canDisplayProdigiProduct(sandbox,2,true,false),false);
 assert.equal(canDisplayProdigiProduct({...sandbox,ordersEnabled:true},1,true,false),false);
 assert.equal(canDisplayProdigiProduct({...sandbox,requiredAssets:['front','back']},1,true,false),false);
});
test('live products still require all live release gates and never appear in QA',()=>{
 const live={...sandbox,environment:'live' as const,ordersEnabled:true,liveQualified:true};
 assert.equal(canDisplayProdigiProduct(live,1,false,true),true);
 assert.equal(canDisplayProdigiProduct(live,1,false,false),false);
 assert.equal(canDisplayProdigiProduct({...live,liveQualified:false},1,false,true),false);
 assert.equal(canDisplayProdigiProduct(live,1,true,true),false);
});
