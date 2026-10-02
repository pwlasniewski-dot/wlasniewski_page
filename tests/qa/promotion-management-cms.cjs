// Existing admin/API/public pricing with memory records. No production writes.
const h = require('./gallery-shop-dom.cjs');
const { assert, React, mount, reset, check, click, set, button, field } = h;
const Module = require('node:module');
const { NextRequest, NextResponse } = require('next/server');
const { renderToStaticMarkup } = require('react-dom/server');
const clone = value => structuredClone(value);
const now = Date.now(), day = 86400000;
const packages = [
 { id: 1, service_id: 1, name: 'Rodzinny Start', price: 75000, hours: 1, description: '<p>35 gotowych zdjęć</p><p>Galeria online</p><p>Zakres wybrany w CMS</p><p>Czwarty punkt</p>', features: '["Stara sprzeczna cecha"]', order: 0, is_active: true, created_at: new Date(now - 90*day), service: { id: 1, name: 'Sesja', order: 0, is_active: true } },
 { id: 2, service_id: 1, name: 'Rodzinny Komfort', price: 98000, hours: 2, description: '<p>55 gotowych zdjęć</p><p>Galeria online</p><p>Pendrive</p><p>Czwarty punkt</p>', features: '[]', order: 1, is_active: true, created_at: new Date(now - 90*day), service: { id: 1, name: 'Sesja', order: 0, is_active: true } },
 { id: 3, service_id: 4, name: 'Urodzinowy reportaż', price: 110000, hours: 3, description: '<p>Reportaż uroczystości</p><p>Zdjęcia według zakresu CMS</p><p>Galeria online</p>', features: '[]', order: 0, is_active: true, created_at: new Date(now - 90*day), service: { id: 4, name: 'Urodziny', order: 3, is_active: true } },
];
const make = (id, package_id, price, start, end) => ({ id, package_id, is_enabled: true, discount_type: 'fixed', discount_value: packages.find(pkg=>pkg.id===package_id).price-price,
 regular_price_snapshot: packages.find(pkg=>pkg.id===package_id).price, promotional_price: price, lowest_price_30d: package_id===2?78000:packages.find(pkg=>pkg.id===package_id).price,
 lowest_price_source: 'AUTO_HISTORY', lowest_price_period: 'THIRTY_DAYS', label: 'Promocja', starts_at: new Date(start), ends_at: new Date(end), allow_promo_code: false, show_on_home: true, updated_at: new Date(start) });
let promotions = [make(11,1,15500,now-120000,now+14*day),make(12,2,75000,now+day,now+14*day),make(13,2,78000,now-2*day,now-day)];
const history = packages.map(pkg=>({ id: pkg.id, package_id: pkg.id, price: pkg.price, valid_from: new Date(now-90*day), valid_to: null, source: 'BASELINE', verified: true }));
let authorized=true, updates=0, writes=0, mutateAtLock=null;
const matching = (row, where) => (!where.id || (typeof where.id==='object'?row.id!==where.id.not:row.id===where.id)) && (!where.package_id || row.package_id===where.package_id) && (where.is_enabled===undefined || row.is_enabled===where.is_enabled) && (!where.starts_at?.lt || row.starts_at<where.starts_at.lt) && (!where.OR || !row.ends_at || row.ends_at>where.OR[1].ends_at.gt);
const attach = row => ({...clone(row),package:clone(packages.find(pkg=>pkg.id===row.package_id))});
const db = {
 package: { findFirst: async ({where})=>clone(packages.find(pkg=>pkg.id===where.id)), findMany: async()=>packages.map(pkg=>({...clone(pkg),promotions:clone(promotions.filter(row=>row.package_id===pkg.id).sort((a,b)=>b.starts_at-a.starts_at)),price_history:clone(history.filter(row=>row.package_id===pkg.id))})) },
 packagePromotion: { findUnique: async ({where})=>clone(promotions.find(row=>row.id===where.id)||null), findFirst: async ({where})=>clone(promotions.find(row=>matching(row,where))||null),
  update: async ({where,data})=>{updates++;writes++;const row=promotions.find(row=>row.id===where.id);Object.assign(row,clone(data));return attach(row)}, create: async ({data})=>{writes++;const row={id:100+promotions.length,...clone(data)};promotions.push(row);return attach(row)} },
 $transaction: async callback=>callback(db),
 $queryRaw: async query=>{
  if(Array.isArray(query)){if(mutateAtLock){const apply=mutateAtLock;mutateAtLock=null;apply()}return[{acquired:1}]}
  const sql=query.sql, values=query.values, id=values.find(value=>typeof value==='number');
  if(sql.includes('FROM "package_price_history"'))return clone(history.filter(row=>row.package_id===id));
  if(sql.includes('SELECT pp."promotional_price"')){const dates=values.filter(value=>value instanceof Date);return clone(promotions.filter(row=>row.package_id===id&&row.is_enabled&&row.starts_at<dates[0]&&(!row.ends_at||row.ends_at>dates[1])&&row.id!==values.at(-1)).map(row=>({promotional_price:row.promotional_price})))}
  const future=sql.includes('pp."starts_at" >');
  return promotions.filter(row=>row.is_enabled&&(future?row.starts_at>new Date():row.starts_at<=new Date()&&(!row.ends_at||row.ends_at>new Date()))).map(row=>{const pkg=packages.find(pkg=>pkg.id===row.package_id);return {...clone(row),package_name:pkg.name,package_order:pkg.order,service_name:pkg.service.name,service_order:pkg.service.order,package_description:pkg.description,package_features:pkg.features,package_hours:pkg.hours}});
 }
};
const original=Module._load;
Module._load=function(request,parent,isMain){
 if(request==='@/lib/db/prisma')return{__esModule:true,default:db};
 if(request==='@/lib/auth/middleware')return{requireAdminAuth:async()=>authorized?null:NextResponse.json({error:'Unauthorized'},{status:401})};
 if(request==='next/cache')return{revalidatePath:()=>{},revalidateTag:()=>{},unstable_noStore:()=>{},unstable_cache:callback=>callback};
 if(request==='@/lib/logger')return{logSystem:async()=>{}};
 if(request==='@/hooks/useAnalytics')return{useAnalytics:()=>({trackEvent:async()=>{}})};
 return original.apply(this,arguments);
};
const api=require('../../src/app/api/admin/package-promotions/route.ts');
const Admin=require('../../src/app/admin/promocje/page.tsx').default;
const Promotions=require('../../src/components/promotions/ActivePromotionsSection.tsx').default;
const {loadHomepagePromotionState,resolveLowestPriceBeforePromotion}=require('../../src/lib/packagePromotions.ts');
const req=(method,body,id)=>new NextRequest(`http://localhost/api/admin/package-promotions${id?'?id='+id:''}`,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer test'},...(body?{body:JSON.stringify(body)}:{})});
let posted;
window.confirm=()=>true;
localStorage.setItem('admin_token','test');
global.fetch=async(url,init={})=>{assert.ok(String(url).startsWith('/api/admin/package-promotions'));const request=new NextRequest(`http://localhost${url}`,init);if(init.method==='POST'){posted=JSON.parse(init.body);return api.POST(request)}if(init.method==='DELETE')return api.DELETE(request);return api.GET(request)};
const deadline=setTimeout(()=>{console.error('Incomplete promotion QA: '+h.log.length);process.exit(1)},30000);
(async()=>{
 await check('admin authorization rejects reading, editing and stopping before any mutation',async()=>{authorized=false;for(const method of ['GET','POST','DELETE'])assert.equal((await api[method](req(method,method==='POST'?{packageId:1}:undefined,11))).status,401);assert.equal(writes,0);authorized=true;assert.equal((await api.POST(req('POST',{packageId:1,discountType:'fixed',discountValue:1000,startsAt:new Date().toISOString(),endsAt:'bad-date'}))).status,400);assert.equal(writes,0)});
 await check('existing admin exposes a clear stop action and preserves the 155 price and original end on retry',async()=>{await mount(Admin,{});assert.ok(document.body.textContent.includes('Błędna cena?'));await click(button('Zakończ teraz'));const ended=clone(promotions.find(row=>row.id===11));assert.equal(ended.promotional_price,15500);assert.equal(ended.is_enabled,true);const count=updates;assert.equal((await api.DELETE(req('DELETE',undefined,11))).status,200);assert.equal(updates,count);assert.deepEqual(promotions.find(row=>row.id===11),ended);const reference=await resolveLowestPriceBeforePromotion(1,new Date(),db,undefined,packages[0].created_at);assert.equal(reference.lowestPrice,15500);assert.ok(document.body.textContent.includes('Zakończona cena pozostaje w historii'))});
 await check('final price is visible before saving and a higher new promotion cannot erase the observed 155 reference',async()=>{await click([...document.querySelectorAll('article')].find(node=>node.querySelector('h3')?.textContent==='Rodzinny Start').querySelector('button'));await set(field('Cena po obniżce (zł)'),'600');assert.ok(document.body.textContent.includes('Cena po obniżce — klient zapłaci'));assert.ok(document.body.textContent.includes('Kwota rabatu od ceny zwykłej: 150 zł'));assert.ok(document.body.textContent.includes('155 zł'));assert.ok(button(/Zapisz promocję/).disabled);assert.ok(document.querySelector('[role="alert"]').textContent.includes('pozostają w historii'));await set(field('Co wpisujesz?'),'fixed');await set(field('Kwota rabatu (zł)'),'155');assert.ok(document.body.textContent.includes('595 zł'));assert.ok(button(/Zapisz promocję/).disabled);await click(document.querySelector('[aria-label="Zamknij"]'))});
 await check('scheduled price can be corrected through real admin POST and reloaded without editing ended history',async()=>{const before=clone(promotions[0]);await click(button('Edytuj cenę i okres'));assert.equal(field('Cena po obniżce (zł)').value,'750');await set(field('Cena po obniżce (zł)'),'700');await click(button(/Zapisz promocję/));assert.equal(posted.discountType,'fixed');assert.equal(posted.discountValue,28000);assert.equal(promotions.find(row=>row.id===12).promotional_price,70000);assert.deepEqual(promotions.find(row=>row.id===11),before);const data=await(await api.GET(req('GET'))).json();assert.equal(data.packages.find(pkg=>pkg.id===2).promotions[0].price,70000);const response=await api.POST(req('POST',{promotionId:11,packageId:1,discountType:'fixed',discountValue:15000,startsAt:new Date().toISOString(),manualLowestPrice:75000,confirmManualReference:true}));assert.equal(response.status,409);assert.deepEqual(promotions.find(row=>row.id===11),before)});
 await check('cancelling an unpublished future promotion keeps its record and a locked reread cannot extend ended history',async()=>{await click(button('Anuluj zaplanowaną'));const cancelled=clone(promotions.find(row=>row.id===12));assert.equal(cancelled.is_enabled,false);assert.equal(cancelled.promotional_price,70000);const count=updates;await api.DELETE(req('DELETE',undefined,12));assert.equal(updates,count);const oldEnd=new Date(Date.now()-1000);promotions.find(row=>row.id===11).ends_at=new Date(Date.now()+day);mutateAtLock=()=>{promotions.find(row=>row.id===11).ends_at=oldEnd};await api.DELETE(req('DELETE',undefined,11));assert.equal(promotions.find(row=>row.id===11).ends_at.getTime(),oldEnd.getTime());assert.equal(history.length,3)});
 await check('homepage cards use current Package scope, correct IDs and legal prices in two responsive columns',async()=>{promotions.push(make(21,2,75000,now-60000,now+14*day),make(22,3,99000,now-60000,now+45*day));const state=await loadHomepagePromotionState(new Date(),db);const active=Object.values(state.featuredPromotions);const html=renderToStaticMarkup(React.createElement(Promotions,{promotions:active,title:'Promocje',buttonText:'Zobacz ofertę i pakiety',emptyMessage:'Brak aktywnych',emptyButtonText:'Zobacz pakiety',emptyButtonLink:'/rezerwacja'}));const doc=new window.DOMParser().parseFromString(html,'text/html');assert.equal(doc.querySelectorAll('article').length,2);assert.match(html,/grid-cols-1[^\"]*md:grid-cols-2/);assert.ok(!html.includes('xl:grid-cols-3'));const comfort=[...doc.querySelectorAll('article')].find(node=>node.textContent.includes('Rodzinny Komfort'));assert.equal(comfort.querySelector('h3').textContent,'Rodzinny Komfort');assert.equal(comfort.querySelectorAll('li').length,3);assert.ok(comfort.textContent.includes('55 gotowych zdjęć'));assert.ok(comfort.textContent.includes('Pendrive'));assert.ok(!comfort.textContent.includes('Czwarty punkt'));assert.ok(!comfort.textContent.includes('Stara sprzeczna'));assert.ok(comfort.textContent.includes('780 zł'));assert.ok(comfort.textContent.includes('750 zł'));assert.ok(comfort.textContent.includes('−3%'));assert.ok(!comfort.textContent.includes('Oszczędzasz 230'));const cta=comfort.querySelector('a');assert.ok(cta.textContent.includes('Zobacz ofertę i pakiety'));assert.ok(cta.className.includes('text-[#ffffff]'));const href=new URL(cta.getAttribute('href'),'http://localhost');assert.equal(href.searchParams.get('package_id'),'2');assert.ok(!html.includes('155 zł'));});
 await reset();clearTimeout(deadline);console.log(`${h.log.length} promotion management CMS checks passed`);
})().catch(error=>{clearTimeout(deadline);console.error(error);process.exit(1)});
