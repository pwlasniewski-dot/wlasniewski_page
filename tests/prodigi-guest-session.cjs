const {assert,reset}=require('./qa/gallery-shop-dom.cjs');const Module=require('node:module');const {NextRequest,NextResponse}=require('next/server');const rows=new Map();let trusted=true,limited=false,actions=0,knownClient=null;
const db={setting:{findUnique:async({where})=>rows.get(where.setting_key)||null,create:async({data})=>{rows.set(data.setting_key,data);return data;},update:async({where,data})=>{Object.assign(rows.get(where.setting_key),data);return rows.get(where.setting_key);}}};let queue=Promise.resolve();db.$transaction=fn=>{const result=queue.then(()=>fn(db));queue=result.catch(()=>{});return result;};
const original=Module._load;Module._load=function(name,...args){
 if(name==='@/lib/db/prisma')return{__esModule:true,default:db};
 if(name==='@/lib/db/advisoryLock')return{acquireAdvisoryTransactionLock:async()=>{}};
 if(name==='@/lib/galleries/order-account')return{orderClient:async()=>knownClient};
 if(name==='@/lib/auth/admin-origin')return{isTrustedAdminOrigin:()=>trusted};
 if(name==='@/lib/rate-limit')return{getClientIp:()=> 'fixture-ip',rateLimit:()=>({ok:!limited})};
 if(name==='./shop-uploads'){const real=original.call(this,name,...args);return{...real,requirePersonalizationEnabled:async()=>{}};}
 return original.call(this,name,...args);
};
const {authorizeIndividualGallery}=require('../src/lib/galleries/individual-access.ts');
const {withShopUpload}=require('../src/lib/galleries/shop-upload-http.ts');const {readShopGuest,guestOwnsGallery}=require('../src/lib/galleries/shop-guest.ts');
const request=(cookie='',method='POST')=>new NextRequest('https://shop.example.test/api/shop/personalization/session',{method,headers:{cookie}});
const action=async(owner)=>{actions++;return NextResponse.json({ownerId:owner.id});};
(async()=>{
 process.env.NODE_ENV='production';trusted=false;assert.equal((await withShopUpload(request(),action,true)).status,403);assert.equal(rows.size,0);trusted=true;limited=true;assert.equal((await withShopUpload(request(),action,true)).status,429);assert.equal(rows.size,0);limited=false;
 assert.equal((await withShopUpload(request(),action)).status,401);assert.equal(rows.size,0);
 const result=await withShopUpload(request(),action,true);assert.equal(result.status,200);const setCookie=result.headers.get('set-cookie');assert.match(setCookie,/HttpOnly/i);assert.match(setCookie,/Secure/i);assert.match(setCookie,/SameSite=lax/i);const cookie=setCookie.split(';')[0],token=cookie.split('=')[1];assert.match(token,/^[a-f0-9]{64}$/);assert.ok(!JSON.stringify([...rows.values()]).includes(token));assert.ok(!JSON.stringify(await result.clone().json()).includes(token));
 const owner=await readShopGuest(request(cookie));assert.match(owner.id,/^guest_[a-f0-9]{64}$/);assert.equal(owner.email,'');assert.equal((await withShopUpload(request(cookie),action)).status,200);assert.equal(rows.size,2);
 rows.set(`shop_personalization_gallery_v1_${owner.id}`,{setting_value:'12'});assert.equal(await guestOwnsGallery(request(cookie),12),true);assert.equal(await guestOwnsGallery(request(cookie),13),false);assert.equal(await guestOwnsGallery(request('shop_guest='+'a'.repeat(64)),12),false);
 const gallery={id:12,client_id:null,client_email:'',gallery_mode:'INDIVIDUAL',access_code:'known',group_password:'known',terms_source:'SHOP_UPLOAD_GUEST'};assert.equal((await authorizeIndividualGallery(request(cookie,'GET'),gallery)).allowed,true);assert.equal((await authorizeIndividualGallery(request('','GET'),gallery)).allowed,false);trusted=false;assert.equal((await authorizeIndividualGallery(request(cookie),gallery)).allowed,false);trusted=true;assert.equal((await authorizeIndividualGallery(request(cookie),{...gallery,id:13})).allowed,false);
 const record=rows.get(`shop_guest_session_v1_${owner.id}`);record.setting_value=JSON.stringify({...JSON.parse(record.setting_value),expiresAt:Date.now()-1});assert.equal(await readShopGuest(request(cookie)),null);assert.equal((await withShopUpload(request(cookie),action)).status,401);
 const concurrent=await Promise.all(Array.from({length:6},()=>withShopUpload(request(),action,true)));assert.equal(concurrent.filter(r=>r.status===200).length,4);assert.equal(concurrent.filter(r=>r.status===429).length,2);assert.ok(!JSON.stringify([...rows.values()]).includes('fixture-ip'));
 console.log('PASS secure random hashed guest capability; origin/rate mint gates; session-only mint; exact gallery binding; forged/expired session denied');await reset();
})().catch(error=>{console.error(error);process.exitCode=1;});
