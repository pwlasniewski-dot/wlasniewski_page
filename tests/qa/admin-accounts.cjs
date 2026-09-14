const {assert,check}=require('./gallery-shop-dom.cjs');
const Module=require('node:module');
const {NextRequest,NextResponse}=require('next/server');
let users,authorized=true,writes=0,locks=0;
const db={
 $queryRaw:async()=>{locks++;return [{acquired:1}];},
 adminUser:{
  findUnique:async({where})=>users.find(user=>user.id===where.id)||null,
  findFirst:async({where})=>users.find(user=>user.email.toLowerCase()===where.email.equals)||null,
  count:async()=>users.filter(user=>user.role==='ADMIN').length,
  create:async({data})=>{writes++;const user={id:users.length+1,...data};users.push(user);return user;},
  update:async({where,data})=>{writes++;const user=users.find(user=>user.id===where.id);for(const [k,v] of Object.entries(data))if(v!==undefined)user[k]=v;return user;},
  delete:async({where})=>{writes++;users=users.filter(user=>user.id!==where.id);},
 },
 $transaction:async action=>action(db),
};
const original=Module._load;
Module._load=function(name){
 if(name==='@/lib/db/prisma')return {__esModule:true,default:db};
 if(name==='@/lib/auth/middleware')return {withAuth:async(request,handler)=>{if(!authorized)return NextResponse.json({error:'Unauthorized'},{status:401});request.user={id:Number(request.headers.get('x-test-actor')||1)};return handler(request);}};
 return original.apply(this,arguments);
};
const manage=require('../../src/app/api/users/manage/route.ts');
const create=require('../../src/app/api/users/route.ts');
const req=(id,body,actor=1)=>new NextRequest(`http://localhost/api/users/manage?id=${id}`,{method:body?'PUT':'DELETE',headers:{'Content-Type':'application/json','x-test-actor':String(actor)},...(body?{body:JSON.stringify(body)}:{})});
const reset=()=>{users=[{id:1,email:'one@example.com',role:'ADMIN',name:'One'},{id:2,email:'two@example.com',role:'ADMIN',name:'Two'}];writes=0;locks=0;authorized=true;};
(async()=>{
 reset();await check('account endpoints reject unauthorized mutation',async()=>{authorized=false;assert.equal((await manage.DELETE(req(2))).status,401);assert.equal(writes,0);authorized=true;});
 await check('self deletion and demotion are rejected under the shared transaction lock',async()=>{assert.equal((await manage.DELETE(req(1))).status,409);assert.equal((await manage.PUT(req(1,{role:'USER'}))).status,409);assert.equal(writes,0);assert.equal(locks,2);});
 await check('removed actor cannot perform a stale authorized deletion of the remaining admin',async()=>{assert.equal((await manage.DELETE(req(2))).status,200);assert.equal((await manage.DELETE(req(1,null,2))).status,403);assert.equal(users.length,1);assert.equal(users[0].role,'ADMIN');});
 reset();await check('invalid identifiers, roles and passwords never mutate accounts',async()=>{for(const id of ['NaN','0','2.5'])assert.equal((await manage.DELETE(req(id))).status,400);for(const body of [{role:'SUPERADMIN'},{password:'short'},{name:123}])assert.equal((await manage.PUT(req(2,body))).status,400);assert.equal(writes,0);});
 await check('editing can clear a name and retains the current password when left empty',async()=>{users[1].password_hash='existing';assert.equal((await manage.PUT(req(2,{name:'',password:''}))).status,200);assert.equal(users[1].name,null);assert.equal(users[1].password_hash,'existing');});
 await check('creation normalizes email, rejects case-insensitive duplicates and defaults to administrator',async()=>{const request=body=>new NextRequest('http://localhost/api/users',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal((await create.POST(request({email:' ONE@EXAMPLE.COM ',password:'safe-test-password'}))).status,409);const result=await create.POST(request({email:' New@Example.com ',password:'safe-test-password'}));assert.equal(result.status,200);assert.equal(users.at(-1).email,'new@example.com');assert.equal(users.at(-1).role,'ADMIN');assert.ok(users.at(-1).password_hash.startsWith('$2'));});
})().catch(error=>{console.error(error);process.exitCode=1});
