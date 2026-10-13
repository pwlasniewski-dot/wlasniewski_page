import assert from 'node:assert/strict';
import test from 'node:test';
import {prepareProdigiProduct, importProdigiProduct} from '../src/lib/fulfillment/prodigi-catalog-import';
import {defaultShopConfig} from '../src/lib/galleries/merchandise';

// Independent QA. All supplier, rate and persistence dependencies are synthetic.
const input={sku:'GLOBAL-FAP-10X10',attributes:{paperType:'EMA'},title:'Fine art',price:9900,shipmentMethod:'Budget',copies:1};
const product={description:'Papier artystyczny',printAreas:{default:{required:true}},variants:[{attributes:{paperType:'EMA'},shipsTo:['PL'],printAreaSizes:{default:{horizontalResolution:1000,verticalResolution:1000}}}]};
const quote={shipmentMethod:'Budget',costSummary:{totalCost:{amount:'11.70',currency:'EUR'}}};
const fx={available:true,source:'NBP',currency:'EUR',quoteCurrency:'PLN',effectiveDate:'2026-10-02',tableNo:'192/A/NBP/2026',mid:'4.3745'};
const clone=<T>(value:T):T=>JSON.parse(JSON.stringify(value));
function dependencies(p=clone(product),q=clone(quote),f:any=fx){const calls:any[]=[];return {calls,inspect:async(request:any)=>{calls.push(request);return request.action==='product'?{action:'product',product:p}:{action:'quote',quotes:[q],currency:'EUR',checkedAt:'2026-10-03T12:00:00Z'};},fx:async()=>f};}
async function prepared(){const d=dependencies();return prepareProdigiProduct(input,d.inspect as any,d.fx as any);}
function persistence(){
 const settings=new Map<string,any>();const products=new Map<number,any>();let created=0;let isolation='';
 const tx={setting:{findUnique:async({where}:any)=>settings.get(where.setting_key)||null,create:async({data}:any)=>{assert.ok(!settings.has(data.setting_key));settings.set(data.setting_key,clone(data));return data;},upsert:async({where,create,update}:any)=>{const data=settings.has(where.setting_key)?{...settings.get(where.setting_key),...update}:create;settings.set(where.setting_key,clone(data));return data;}},galleryProduct:{findUnique:async({where}:any)=>products.get(where.id)||null,create:async({data}:any)=>{const row={id:++created,...clone(data)};products.set(row.id,row);return row;}}};
 return {settings,products,db:{$transaction:async(fn:any,options:any)=>{isolation=options.isolationLevel;return fn(tx);}},created:()=>created,isolation:()=>isolation};
}
test('QA catalogue accepts exact PL variant and converts full EUR total to integer-safe PLN',async()=>{
 const d=dependencies();const result=await prepareProdigiProduct(input,d.inspect as any,d.fx as any);
 assert.equal(result.pln.amount,'51.18');assert.equal(result.pln.currency,'PLN');assert.equal(result.request.price,9900);
 assert.deepEqual(d.calls[1],{action:'quote',items:[{sku:input.sku,copies:1,attributes:input.attributes,assets:[{printArea:'default'}]}]});
});
test('QA catalogue rejects unavailable PL variant and missing/extra required print areas',async()=>{
 for(const change of [(p:any)=>{p.variants[0].shipsTo=['US'];},(p:any)=>{p.printAreas.back={required:true};},(p:any)=>{p.variants[0].printAreaSizes={};},(p:any)=>{p.variants[0].attributes={paperType:'HGE'};}]){
  const p=clone(product);change(p);const d=dependencies(p);await assert.rejects(prepareProdigiProduct(input,d.inspect as any,d.fx as any));assert.equal(d.calls.length,1);
 }
});
test('QA catalogue rejects stale FX and absent provider total; never derives total from items',async()=>{
 let d=dependencies(product,quote,{available:false,source:'NBP',currency:'EUR',reason:'stale'});await assert.rejects(prepareProdigiProduct(input,d.inspect as any,d.fx as any));
 d=dependencies(product,{...quote,costSummary:{items:{amount:'6',currency:'EUR'}}} as any);await assert.rejects(prepareProdigiProduct(input,d.inspect as any,d.fx as any));
});
test('QA import persists inactive sandbox product and server-owned SKU/FX snapshot while preserving shop',async()=>{
 const p=persistence();const config=defaultShopConfig();config.title='Własny cennik';config.productRules['71']={minPhotos:12,maxPhotos:12};
 p.settings.set('gallery_shop_default',{setting_key:'gallery_shop_default',setting_value:JSON.stringify(config)});
 const result=await importProdigiProduct(p.db as any,input,prepared as any);
 assert.equal(p.isolation(),'Serializable');assert.equal(result.existing,false);const row=p.products.get(result.id);assert.equal(row.is_active,false);assert.equal(row.product_type,'prodigi_sandbox');assert.equal(row.price,9900);
 const saved=JSON.parse(p.settings.get('prodigi_product_v1_'+result.id).setting_value);assert.equal(saved.environment,'sandbox');assert.equal(saved.ordersEnabled,false);assert.equal(saved.liveQualified,false);assert.equal(saved.estimatedCostPln.amount,'51.18');
 const reread=JSON.parse(p.settings.get('gallery_shop_default').setting_value);assert.equal(reread.title,'Własny cennik');assert.deepEqual(reread.productRules['71'],config.productRules['71']);assert.deepEqual(reread.productRules[result.id],{minPhotos:1,maxPhotos:1,deliveryMethods:['courier']});
});
test('QA repeated import leaves manually edited price/title/archive state unchanged',async()=>{
 const p=persistence();const first=await importProdigiProduct(p.db as any,input,prepared as any);Object.assign(p.products.get(first.id),{title:'Moja nazwa',price:17700,archived_at:'2026-10-03'});
 const again=await importProdigiProduct(p.db as any,input,prepared as any);assert.equal(again.existing,true);assert.equal(again.archived,true);assert.equal(p.created(),1);assert.equal(p.products.get(first.id).price,17700);assert.equal(p.products.get(first.id).title,'Moja nazwa');
});
test('QA broken shop settings or orphan import marker fail closed before creating product',async()=>{
 const p=persistence();p.settings.set('gallery_shop_default',{setting_key:'gallery_shop_default',setting_value:'broken'});await assert.rejects(importProdigiProduct(p.db as any,input,prepared as any));assert.equal(p.created(),0);
 p.settings.clear();p.settings.set('prodigi_variant_v1_'+(await prepared()).identity,{setting_value:'999'});await assert.rejects(importProdigiProduct(p.db as any,input,prepared as any));assert.equal(p.created(),0);
});
