// Real modules/routes, isolated DB and Google HTTP. Never contacts production.
require('tsx/cjs');
const assert=require('node:assert/strict');const Module=require('node:module');
const {NextRequest,NextResponse}=require('next/server');
process.env.GOOGLE_CALENDAR_CLIENT_ID='test-client';process.env.GOOGLE_CALENDAR_CLIENT_SECRET='test-secret';process.env.GOOGLE_CALENDAR_TOKEN_KEY='ab'.repeat(32);
process.env.NODE_ENV='production';
const original=Module._load;let auth=true, snapshotFails=false,dbReads=0,failInsert=false;
let row={id:1,account_id:'acct',email:'owner@example.com',connected:true,revision:1,synced_revision:0,lease_token:null,lease_until:null};
let maps=[];let remote=new Map();let events=[];let writes=0;
function matches(where){return (!where.lease_token||where.lease_token===row.lease_token)&&(!where.connected||row.connected)&&(!where.account_id||where.account_id===row.account_id)&&(!where.OR||!row.lease_until||row.lease_until<new Date());}
const db={googleCalendarIntegration:{findUnique:async()=>{dbReads++;return {...row};},updateMany:async({where,data})=>{if(!matches(where))return {count:0};for(const[k,v]of Object.entries(data))row[k]=v&&typeof v==='object'&&'increment'in v?(row[k]||0)+v.increment:v;return {count:1};}},googleCalendarEventMap:{findMany:async()=>maps.map(x=>({...x})),upsert:async({where,create,update})=>{let m=maps.find(m=>m.source_key===where.account_id_source_key.source_key);if(m)Object.assign(m,update);else maps.push({...create});},update:async({where,data})=>Object.assign(maps.find(m=>m.source_key===where.account_id_source_key.source_key),data)}};
Module._load=function(name,...args){
 if(name==='@/lib/db/prisma')return {__esModule:true,default:db};
 if(name==='./events'&&String(args[0]?.filename).endsWith('google-sync.ts'))return {loadCalendarEvents:async opts=>{assert.equal(opts.strict,true);if(snapshotFails)throw Error('source failed');return events;}};
 if(name==='@/lib/auth/middleware')return {requireAdminAuth:async r=>{if(!auth)return NextResponse.json({}, {status:401});r.user={id:7};return null;}};
 return original.call(this,name,...args);
};
const security=require('../../src/lib/calendar/google-security.ts');
row.refresh_token=security.encryptGoogleSecret('refresh-secret');
const sync=require('../../src/lib/calendar/google-sync.ts');
const connect=require('../../src/app/api/admin/google-calendar/connect/route.ts');
const callback=require('../../src/app/api/admin/google-calendar/callback/route.ts');
const disconnect=require('../../src/app/api/admin/google-calendar/disconnect/route.ts');
let legacy=[];
global.fetch=async(url,init={})=>{
 const u=new URL(url);
 if(u.pathname==='/revoke')return new Response('');
 if(u.pathname==='/token')return new Response(JSON.stringify({access_token:'access',refresh_token:'refresh',scope:'openid email https://www.googleapis.com/auth/calendar.events.owned'}));
 if(u.pathname==='/v1/userinfo')return new Response(JSON.stringify({sub:'acct',email:'owner@example.com',email_verified:true}));
 const id=decodeURIComponent(u.pathname.split('/').pop());
 if(init.method==='POST'){assert.equal(u.searchParams.get('sendUpdates'),'none');const body=JSON.parse(init.body);assert.equal(body.attendees,undefined);writes++;remote.set(body.id,body);if(failInsert){failInsert=false;throw Error('network after save');}return new Response(JSON.stringify(body));}
 if(init.method==='PATCH'){const body=JSON.parse(init.body);assert.ok(sync.onlyOwnerAttendees(remote.get(id),row.email));writes++;remote.set(id,{...remote.get(id),...body});return new Response(JSON.stringify(remote.get(id)));}
 if(id==='events')return new Response(JSON.stringify(u.searchParams.get('pageToken')?{items:legacy}:{items:[],...(legacy.length?{nextPageToken:'second'}:{})}));
 return new Response(JSON.stringify(remote.get(id)||{}),{status:remote.has(id)?200:404});
};
const event=(id=1)=>({id:`booking-${id}`,source:'booking',source_id:id,date:'2028-03-26',start_time:'12:00',end_time:'13:00',title:'Sesja',client_name:'Klient',venue:'Toruń',detail_url:`/admin/bookings/${id}`,status:'confirmed'});
(async()=>{
 const encrypted=security.encryptGoogleSecret('hello');assert.equal(security.decryptGoogleSecret(encrypted),'hello');assert.throws(()=>security.decryptGoogleSecret(encrypted.slice(0,-3)+'xxx'));
 const expired=security.encryptGoogleSecret(JSON.stringify({adminId:7,state:'state',verifier:'x',expires:Date.now()-1}));assert.throws(()=>security.verifyGoogleOAuth(expired,'state',7));
 const oauth=security.createGoogleOAuth(7);const state=new URL(oauth.url).searchParams.get('state');assert.ok(security.verifyGoogleOAuth(oauth.cookie,state,7));assert.throws(()=>security.verifyGoogleOAuth(oauth.cookie,state,8));assert.throws(()=>security.verifyGoogleOAuth(oauth.cookie,'wrong',7));
 assert.equal(sync.warsawToday(new Date('2026-10-19T22:30:00Z')),'2026-10-20');assert.equal(sync.googleEventBody(event()).start.timeZone,'Europe/Warsaw');assert.equal(sync.googleEventBody({...event(),start_time:null}).end.date,'2028-03-27');assert.match(sync.googleEventBody({...event(),end_time:null}).description,/nie czasem trwania/);
 delete process.env.GOOGLE_CALENDAR_CLIENT_ID;assert.equal((await sync.syncGoogleCalendar()).skipped,'not_configured');assert.equal(dbReads,0);process.env.GOOGLE_CALENDAR_CLIENT_ID='test-client';
 row.lease_token='other-worker';row.lease_until=new Date(Date.now()+60000);await assert.rejects(()=>sync.syncGoogleCalendar(),/sync_busy/);assert.equal(writes,0);row.lease_token=null;row.lease_until=null;
 events=[event()];assert.equal((await sync.syncGoogleCalendar()).created,1);assert.equal(maps.length,1);const once=writes;assert.equal((await sync.syncGoogleCalendar({force:true})).unchanged,1);assert.equal(writes,once);
 events=[{...event(),title:'Nowa nazwa'}];row.revision++;assert.equal((await sync.syncGoogleCalendar()).updated,1);
 snapshotFails=true;row.revision++;await assert.rejects(()=>sync.syncGoogleCalendar());assert.equal(remote.get(maps[0].event_id).status,'confirmed');snapshotFails=false;
 events=[];assert.equal((await sync.syncGoogleCalendar()).cancelled,1);assert.equal(remote.get(maps[0].event_id).status,'cancelled');
 events=[event(2)];row.revision++;legacy=[{id:'legacy-id',description:'Identyfikator źródła: fotodron:booking:2\nhttps://wlasniewski.pl/admin/bookings/2',status:'confirmed',attendees:[{email:'owner@example.com',self:true}],conferenceData:{conferenceId:'existing-meet'}}];remote.set('legacy-id',legacy[0]);assert.equal((await sync.syncGoogleCalendar()).updated,1);assert.equal(maps.find(m=>m.source_key==='booking-2').event_id,'legacy-id');assert.equal(remote.get('legacy-id').conferenceData.conferenceId,'existing-meet');assert.equal(remote.get('legacy-id').attendees.length,1);assert.equal(sync.matchesLegacyGoogleEvent({...legacy[0],attendees:[{email:'client@example.com'}]},event(2),row.email),false);legacy=[];
 events.push(event(3));row.revision++;failInsert=true;await assert.rejects(()=>sync.syncGoogleCalendar());assert.equal((await sync.syncGoogleCalendar()).updated,1);assert.equal([...remote.values()].filter(e=>e.extendedProperties?.private?.fotodron_key==='booking-3').length,1);
 remote.get(maps.find(m=>m.source_key==='booking-3').event_id).extendedProperties={};events=[];row.revision++;await assert.rejects(()=>sync.syncGoogleCalendar(),/event_ownership_conflict/);
 const request=(origin='https://wlasniewski.pl')=>new NextRequest('https://wlasniewski.pl/api/admin/google-calendar/connect',{method:'POST',headers:{origin}});
 auth=false;assert.equal((await connect.POST(request())).status,401);auth=true;assert.equal((await connect.POST(request('https://evil.example'))).status,403);assert.equal((await connect.POST(request('https://www.wlasniewski.pl'))).status,400);
 const start=await connect.POST(request());assert.equal(start.status,200);assert.match(start.headers.get('set-cookie'),/HttpOnly/);assert.match(start.headers.get('set-cookie'),/Secure/);const body=await start.json();const state2=new URL(body.url).searchParams.get('state');const cookie=start.headers.get('set-cookie').split(';')[0];
 const bad=await callback.GET(new NextRequest('https://wlasniewski.pl/api/admin/google-calendar/callback?code=x&state=wrong',{headers:{cookie}}));assert.match(bad.headers.get('location'),/connection_error/);assert.match(bad.headers.get('set-cookie'),/Max-Age=0/);
 const good=await callback.GET(new NextRequest(`https://wlasniewski.pl/api/admin/google-calendar/callback?code=x&state=${state2}`,{headers:{cookie}}));assert.match(good.headers.get('location'),/connected/);assert.equal(row.connected,true);assert.equal(security.decryptGoogleSecret(row.refresh_token),'refresh');
 const mapCount=maps.length;const eventCount=remote.size;const dis=await disconnect.POST(request());assert.equal(dis.status,200);assert.equal((await dis.json()).revoked,true);assert.equal(row.connected,false);assert.equal(row.refresh_token,null);assert.equal(maps.length,mapCount);assert.equal(remote.size,eventCount);
 console.log('PASS Google Calendar: crypto/state/admin/origin/callback; strict snapshot; create/update/idempotence; paginated legacy adoption; retry after ambiguous insert; ownership cancellation; Warsaw date; no config no DB');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>Module._load=original);
