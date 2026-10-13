const {assert,reset}=require('./qa/gallery-shop-dom.cjs');const Module=require('node:module'),sharp=require('sharp');
const uploads=[];let quoteOutcome='Created',cost='10.00',body,fetches=0,quoteEnvironment;
const load=Module._load;Module._load=function(name,...args){
 if(name==='@/lib/storage/s3')return{getPrivateS3DownloadUrl:async key=>'https://s3.example.test/'+key,uploadToS3:async(bytes,key,mime,options)=>{uploads.push({bytes:Buffer.from(bytes),key,mime,options});return key;}};
 if(name==='./prodigi-orders'){const real=load.call(this,name,...args);return{...real,prodigiOrderRequest:async(environment)=>(quoteEnvironment=environment,({outcome:quoteOutcome,issues:null,quotes:[{shipmentMethod:'Budget',costSummary:{totalCost:{amount:cost,currency:'EUR'}}}]}))};}
 if(name==='./prodigi-fx'){const real=load.call(this,name,...args);return{...real,fetchProdigiFx:async()=>({available:true,source:'NBP',currency:'EUR',quoteCurrency:'PLN',mid:'4.0000',effectiveDate:'2026-10-02',tableNo:'192/A/NBP/2026'})};}
 return load.call(this,name,...args);
};
const {prepareProdigiOrder}=require('../src/lib/fulfillment/prodigi-preflight.ts');
const spec={version:1,provider:'prodigi',environment:'live',productId:50,sku:'GLOBAL-FAP-10X10',variant:{attributes:{paperType:'EMA'},printAreaSizes:{default:{horizontalResolution:100,verticalResolution:100}}},requiredAssets:['default'],shippingMethod:'Budget',ordersEnabled:true,liveQualified:true,destination:'PL'};
const order={id:50,gallery_id:12,total_amount:11900};const metadata={kind:'gallery_merchandise',version:1,lines:[{id:'one',kind:'product',productId:50,photoIds:[1],coverPhotoId:1,quantity:1,title:'Fine art',unitAmount:9900,lineTotal:9900,product:{prodigi:spec}}],delivery:{method:'courier',amount:2000,recipientName:'Anna Testowa',email:'qa@example.test',phone:'501222333',address:{street:'Testowa 1',postalCode:'00-001',city:'Warszawa'}},fulfillment:{status:'new',trackingNumber:null}};
const photos=[{id:1,download_source_url:'https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/hq.jpg'}];
global.fetch=async()=>{fetches++;return new Response(body,{status:200});};
(async()=>{
 body=await sharp({create:{width:120,height:120,channels:3,background:'#ffffff'}}).png().toBuffer();
 let result=await prepareProdigiOrder(order,metadata,photos);assert.equal(result.input.quote.providerCostGrosze,4000);assert.match(result.sources.one.objectKey,/shop-personalization\/production\/live\/12\/50\/[a-f0-9]{64}\.png$/);assert.equal(uploads[0].options.access,'private');assert.deepEqual(uploads[0].bytes,body);console.log('PASS real preflight hashes actual PNG and stores immutable private print source + EUR/PLN quote');
 let count=fetches;await assert.rejects(prepareProdigiOrder(order,metadata,[{id:1,download_source_url:null}]));await assert.rejects(prepareProdigiOrder(order,metadata,[{id:1,download_source_url:'https://evil.test/hq.jpg'}]));assert.equal(fetches,count);console.log('PASS missing HQ and foreign source rejected before fetching');
 quoteOutcome='ValidationFailed';await assert.rejects(prepareProdigiOrder(order,metadata,photos));quoteOutcome='Created';cost='10.01';await assert.rejects(prepareProdigiOrder(order,metadata,photos,result),/wzrósł/);console.log('PASS failed supplier quote and cost increase require new preparation');
 cost='10.00';
 const sandbox=structuredClone(metadata);sandbox.checkoutEnvironment='sandbox';sandbox.lines[0].product.prodigi={...spec,environment:'sandbox',ordersEnabled:false,liveQualified:false,sandboxOrdersEnabled:true};
 await assert.rejects(prepareProdigiOrder(order,sandbox,photos,undefined,'sandbox'),/QA/);
 process.env.NODE_ENV='test';process.env.GALLERY_QA_CONTEXT='deploy-preview';process.env.DATABASE_URL='postgresql://u:p@production.test/db';process.env.GALLERY_QA_DATABASE_URL='postgresql://u:p@qa.test/db';
 const previewOnly=structuredClone(sandbox);previewOnly.lines[0].product.prodigi.sandboxOrdersEnabled=false;await assert.rejects(prepareProdigiOrder(order,previewOnly,photos,undefined,'sandbox'),/kwalifikacji/);
 const qaResult=await prepareProdigiOrder(order,sandbox,photos,undefined,'sandbox');assert.equal(quoteEnvironment,'sandbox');assert.equal(qaResult.environment,'sandbox');assert.match(qaResult.sources.one.objectKey,/^shop-personalization\/production\/sandbox\//);
 await assert.rejects(prepareProdigiOrder(order,metadata,photos,undefined,'sandbox'),/testowego/);
 await assert.rejects(prepareProdigiOrder(order,sandbox,photos),/produkcji/);
 console.log('PASS sandbox requires isolated QA + explicit test checkout; quote stays sandbox and assets use protected non-staging prefix');
 delete process.env.GALLERY_QA_DATABASE_URL;delete process.env.GALLERY_QA_CONTEXT;
 const originalSpec=structuredClone(spec);
 for(const [sku,rw,rh,w,h] of [['GLOBAL-FAP-16X24',4800,7200,5405,3603],['GLOBAL-FAP-11X14',3307,4192,3024,4032],['GLOBAL-FAP-16X24',4800,7200,8000,6000]]){
  spec.sku=sku;spec.variant.printAreaSizes.default={horizontalResolution:rw,verticalResolution:rh};body=await sharp({create:{width:w,height:h,channels:3,background:'#445588'}}).jpeg().toBuffer();
  await prepareProdigiOrder(order,metadata,photos);assert.deepEqual(uploads.at(-1).bytes,body,'preflight must preserve HQ source bytes without invented pixel upscaling');const out=await sharp(uploads.at(-1).bytes).metadata();assert.equal(out.width,w);assert.equal(out.height,h);
 }
 spec.sku='GLOBAL-FAP-16X24';spec.variant.printAreaSizes.default={horizontalResolution:4800,verticalResolution:7200};body=await sharp({create:{width:960,height:640,channels:3,background:'#445588'}}).jpeg().toBuffer();const beforeLow=uploads.length;await assert.rejects(prepareProdigiOrder(order,metadata,photos),/rozdzielczość/);assert.equal(uploads.length,beforeLow);Object.assign(spec,originalSpec);console.log('PASS user examples and48MP HQ preflight pass unchanged; genuinely low source blocks before upload');
 const before=uploads.length;body=await sharp({create:{width:10,height:10,channels:3,background:'#ffffff'}}).png().toBuffer();await assert.rejects(prepareProdigiOrder(order,metadata,photos),/rozdzielczość/);assert.equal(uploads.length,before);console.log('PASS insufficient original resolution rejected before storing production asset');
 await reset();
})().catch(error=>{console.error(error);process.exitCode=1;});
