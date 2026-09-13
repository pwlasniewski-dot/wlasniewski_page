const {assert,check,log}=require('./gallery-shop-dom.cjs');
const fs=require('node:fs');
const Module=require('node:module');
let adminAllowed=true,fetchCalls=0,transactionCalls=0;
const settings=new Map();
const products=[];
const tx={
 setting:{findUnique:async({where})=>settings.has(where.setting_key)?{setting_value:settings.get(where.setting_key)}:null,upsert:async({where,create,update})=>{const row=settings.has(where.setting_key)?update:create;settings.set(where.setting_key,row.setting_value);return row}},
 galleryProduct:{findFirst:async({where})=>products.find(p=>p.gallery_id===where.gallery_id&&p.nphoto_url===where.nphoto_url)||null,create:async({data})=>{const product={id:products.length+1,...data};products.push(product);return product}},
};
const db={$transaction:async(fn,options)=>{transactionCalls++;assert.equal(options.isolationLevel,'Serializable');return fn(tx)}};
const originalLoad=Module._load;
Module._load=function(request,parent,isMain){
 if(request==='@/lib/auth/middleware')return {withAuth:async(req,fn)=>adminAllowed?fn():require('next/server').NextResponse.json({error:'Unauthorized'},{status:401})};
 if(request==='@/lib/db/prisma')return {__esModule:true,default:db};
 if(request==='@/lib/galleries/merchandise-server')return {shopSettingKey:()=> 'gallery_shop_default',shopError:error=>require('next/server').NextResponse.json({success:false,error:error.message},{status:error.status||500})};
 return originalLoad.apply(this,arguments);
};
const {NextRequest}=require('next/server');
const {validateNphotoProductUrl,parseNphotoOffer,fetchNphotoOffer,safeNphotoImage,validateNphotoDraftInput,readNphotoRequestBody}=require('../../src/lib/nphoto/offer-import-server.ts');
const fixture=fs.readFileSync(require('node:path').join(__dirname,'../fixtures/nphoto-product.html'),'utf8');
const source='https://nphoto.com/pl/fotoalbumy/fotoalbum-pro';
const draft=parseNphotoOffer(fixture,source,new Date('2026-09-13T12:00:00Z'));
const input={draft,price:24900,pageCount:10,pageUnit:'spreads',format:'20 × 20 cm',minPhotos:20,maxPhotos:30,mediaConfirmed:true};
const request=body=>new NextRequest('https://example.com/api/admin/gallery-shop/nphoto-drafts',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
const htmlResponse=()=>new Response(fixture,{headers:{'content-type':'text/html; charset=utf-8'}});
(async()=>{
 await check('strict product URL allowlist blocks SSRF, credentials, query, category and account paths',async()=>{
  for(const url of ['http://nphoto.com/pl/harmonijka','https://nphoto.com.evil.test/pl/harmonijka','https://127.0.0.1/pl/harmonijka','https://[::1]/pl/harmonijka','https://nphoto.com:444/pl/harmonijka','https://user:pass@nphoto.com/pl/harmonijka','https://nphoto.com/pl/harmonijka?url=https://evil.test','https://nphoto.com/pl/harmonijka#foo','https://nphoto.com/pl/%2e%2e/account','https://nphoto.com/pl/fotoalbumy','https://nphoto.com/pl/sklep','https://nphoto.com/pl/user/login','https://nphoto.com/pl/linia/classic','https://nphoto.com/pl/aktualnosci/artykul'])assert.throws(()=>validateNphotoProductUrl(url),url);
  assert.equal(validateNphotoProductUrl('https://www.nphoto.com/pl/harmonijka/').href,'https://nphoto.com/pl/harmonijka');
 });
 await check('product parser uses verified DOM fields, filters promos/related media and never executes HTML',async()=>{
  assert.equal(draft.title,'Fotoalbum testowy & matowy');assert.equal(draft.images.length,2);assert.match(draft.description,/Sztywne rozkładówki/);assert.equal(draft.images[0].alt,'Album w oprawie testowej');
  assert.equal(draft.specifications.length,3);assert.match(draft.specifications[0].value,/20 cm x 20 cm/);assert.equal(draft.specifications.some(s=>s.label==='Cena'),false);
  assert.ok(!JSON.stringify(draft).includes('alert'));assert.equal(global.bad,undefined);assert.ok(draft.warnings.length>=3);assert.equal(draft.fetchedAt,'2026-09-13T12:00:00.000Z');
 });
 await check('unrecognised pages fail closed, missing optional fields yield explicit warnings',async()=>{
  for(const html of ['<main><h1>Katalog</h1></main>','<article class="node--type-product"><h1>Logowanie</h1></article>','<article class="node--type-product"></article>'])assert.throws(()=>parseNphotoOffer(html,source));
  const sparse=parseNphotoOffer('<article class="node--type-product"><h1>Album</h1></article>',source);assert.equal(sparse.images.length,0);assert.equal(sparse.specifications.length,0);assert.ok(sparse.warnings.length>=6);
 });
 await check('images reject executable, external, credentialed, tracking or traversal URLs',async()=>{
  for(const url of ['javascript:alert(1)','data:image/png;base64,AA','https://evil.com/sites/default/files/a.jpg','https://nphoto.com/sites/default/files/a.svg','https://nphoto.com/sites/default/files/a.jpg?redirect=x','https://a:b@nphoto.com/sites/default/files/a.jpg','https://nphoto.com/sites/default/files/%2f/a.jpg'])assert.equal(safeNphotoImage(url,source),null);
 });
 await check('bounded public fetch uses manual redirects without cookies and stops offsite targets',async()=>{
  let calls=0;
  const good=await fetchNphotoOffer(source,async(url,options)=>{calls++;assert.equal(options.credentials,'omit');assert.equal(options.redirect,'manual');assert.equal(options.headers.Authorization,undefined);return calls===1?new Response(null,{status:302,headers:{location:'/pl/harmonijka'}}):htmlResponse()});
  assert.equal(calls,2);assert.equal(good.sourceUrl,'https://nphoto.com/pl/harmonijka');
  calls=0;await assert.rejects(fetchNphotoOffer(source,async()=>{calls++;return new Response(null,{status:302,headers:{location:'https://evil.example/pl/harmonijka'}})}));assert.equal(calls,1);
  calls=0;await assert.rejects(fetchNphotoOffer(source,async()=>{calls++;return new Response(null,{status:302,headers:{location:'/pl/harmonijka'}})}));assert.equal(calls,3);
 });
 await check('fetch rejects non HTML, blocked pages and oversized decoded streams without fallback',async()=>{
  for(const response of [new Response('Forbidden',{status:403}),new Response('{}',{headers:{'content-type':'application/json'}}),new Response('x',{headers:{'content-type':'text/html','content-length':String(3*1024*1024)}}),new Response('x'.repeat(2*1024*1024+1),{headers:{'content-type':'text/html'}})])await assert.rejects(fetchNphotoOffer(source,async()=>response));
 });
 await check('8-second deadline also aborts an unresponsive supplier',async()=>{
  const set=global.setTimeout,clear=global.clearTimeout;let timeout;
  global.setTimeout=(fn,ms)=>{timeout=ms;queueMicrotask(fn);return 1};global.clearTimeout=()=>{};
  try {await assert.rejects(fetchNphotoOffer(source,async(_,options)=>new Promise((resolve,reject)=>{if(options.signal.aborted)reject(new Error('aborted'));else options.signal.addEventListener('abort',()=>reject(new Error('aborted')))})),/8 sekund/);assert.equal(timeout,8000)}finally{global.setTimeout=set;global.clearTimeout=clear}
 });
 await check('draft validation requires media rights and valid photographer choices, strips markup',async()=>{
  for(const extra of [{mediaConfirmed:false},{price:-1},{price:1.5},{pageCount:0},{pageUnit:'fake'},{maxPhotos:1},{draft:{...draft,images:[{url:'https://evil.com/a.jpg',alt:'x'}]}}])assert.throws(()=>validateNphotoDraftInput({...input,...extra}));
  const clean=validateNphotoDraftInput({...input,price:0,draft:{...draft,title:'<b>Album</b><script>bad</script>',description:'<img onerror=bad src=x>Opis'}});assert.equal(clean.price,0);assert.equal(clean.draft.title,'Album');assert.equal(clean.draft.description,'Opis');
  const paragraphs=validateNphotoDraftInput({...input,draft:{...draft,description:'Pierwszy akapit.\n\nDrugi akapit.<script>bad</script>'}});assert.equal(paragraphs.draft.description,'Pierwszy akapit.\n\nDrugi akapit.');
  const {nphotoOfferDescription}=require('../../src/lib/nphoto/offer-import.ts');
  const longest=validateNphotoDraftInput({...input,format:'f'.repeat(120),pageCount:500,minPhotos:499,maxPhotos:500,draft:{...draft,description:'a'.repeat(4500)}});assert.ok(nphotoOfferDescription(longest).length<=5000);
  assert.throws(()=>validateNphotoDraftInput({...input,draft:{...draft,description:'a'.repeat(4501)}}));
 });
 await check('preview and draft routes authenticate before fetch or persistence',async()=>{
  const preview=require('../../src/app/api/admin/gallery-shop/nphoto-preview/route.ts').POST;
  const save=require('../../src/app/api/admin/gallery-shop/nphoto-drafts/route.ts').POST;
  global.fetch=async()=>{fetchCalls++;return htmlResponse()};adminAllowed=false;
  assert.equal((await preview(request({url:source}))).status,401);assert.equal((await save(request(input))).status,401);assert.equal(fetchCalls,0);assert.equal(transactionCalls,0);adminAllowed=true;
  const response=await preview(request({url:source}));assert.equal(response.status,200);assert.equal((await response.json()).draft.title,draft.title);assert.equal(products.length,0);assert.equal(settings.size,0);
 });
 await check('draft save atomically persists inactive shared offer and rules without changing publication settings',async()=>{
  const save=require('../../src/app/api/admin/gallery-shop/nphoto-drafts/route.ts').POST;
  const r=await save(request(input));assert.equal(r.status,200);assert.equal((await r.json()).existing,false);assert.equal(products.length,1);
  assert.equal(products[0].is_active,false);assert.equal(products[0].gallery_id,null);assert.equal(products[0].price,24900);assert.equal(products[0].preview_images.length,2);assert.match(products[0].description,/Liczba rozkładówek: 10/);
  const config=JSON.parse(settings.get('gallery_shop_default'));assert.equal(config.enabled,false);assert.deepEqual(config.productRules['1'],{minPhotos:20,maxPhotos:30});assert.ok([...settings.keys()].some(k=>k.startsWith('nphoto_offer_')));
 });
 await check('re-import preserves existing merchant prices, content, rules and original source observations',async()=>{
  products[0].price=30000;products[0].description='Własny opis';const before=JSON.stringify([...settings]);const save=require('../../src/app/api/admin/gallery-shop/nphoto-drafts/route.ts').POST;
  const result=await (await save(request({...input,price:1,minPhotos:1,maxPhotos:2}))).json();assert.equal(result.existing,true);assert.equal(result.id,1);assert.equal(products.length,1);assert.equal(products[0].price,30000);assert.equal(products[0].description,'Własny opis');assert.equal(JSON.stringify([...settings]),before);
 });
 await check('oversized incoming payload is rejected before persistence',async()=>{
  await assert.rejects(readNphotoRequestBody(request({description:'a'.repeat(70000)})));const count=transactionCalls;const save=require('../../src/app/api/admin/gallery-shop/nphoto-drafts/route.ts').POST;assert.equal((await save(request({...input,mediaConfirmed:false}))).status,400);assert.equal(transactionCalls,count);
 });
 await check('invalid existing shared config is preserved without inserting an orphan offer',async()=>{
  const save=require('../../src/app/api/admin/gallery-shop/nphoto-drafts/route.ts').POST;const previous=settings.get('gallery_shop_default');settings.set('gallery_shop_default','broken existing config');const count=products.length;
  const result=await save(request({...input,draft:{...draft,sourceUrl:'https://nphoto.com/pl/harmonijka'}}));assert.equal(result.status,409);assert.equal(products.length,count);assert.equal(settings.get('gallery_shop_default'),'broken existing config');settings.set('gallery_shop_default',previous);
 });
 console.log(JSON.stringify({checks:log.length,products:products.length,fetchCalls,transactionCalls}));
})().catch(error=>{console.error(error);process.exitCode=1});
