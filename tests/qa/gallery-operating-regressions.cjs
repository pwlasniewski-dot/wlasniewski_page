const {assert,check}=require('./gallery-shop-dom.cjs');
const Module=require('node:module');
const {NextRequest}=require('next/server');
const participant={id:8,gallery_id:9,parent_identifier:'TEST',selections:[],gallery:{id:9,gallery_mode:'GROUP',is_active:true,expires_at:null,allow_extra_photo_purchase:true}};
let photos=[{id:4,download_source_url:'https://example.test/hq.jpg'}],job=null,activities=[],incidents=[],dispatches=0,paidQuery;
const db={
 galleryParticipant:{findFirst:async()=>participant,findUnique:async()=>participant},
 clientGallery:{findFirst:async()=>({id:9,gallery_mode:'GROUP',is_active:true,photos,updated_at:new Date()})},
 photoOrder:{findMany:async query=>{paidQuery=query;return [{photo_ids:'[4]'}];}},
 groupGalleryActivity:{create:async({data})=>activities.push(data)},
 $transaction:async action=>action({$queryRaw:async()=>[{acquired:1}]}),
 booking:{findMany:async()=>[]},offer:{findMany:async()=>[]},photoChallenge:{findMany:async()=>[]},contract:{findMany:async()=>[]},
 workshop:{findMany:async()=>[{id:1,title:'Test',location:null,status:'active',schedule:[null,42,{date:'invalid'},{date:'2026-10-10',start:'10:00',end:'12:00',topic:'Test',plan:'Plan'}],_count:{participants:1}}]},
};
const original=Module._load;
Module._load=function(name){
 if(name==='@/lib/db/prisma')return {__esModule:true,default:db};
 if(name==='@/lib/auth/middleware')return {requireAuth:async()=>null};
 if(name==='@/lib/auth/parent-jwt')return {extractTokenFromHeader:()=> 'test',verifyParentToken:async()=>({gallery_id:9,participant_id:8,parent_identifier:'TEST'})};
 if(name==='@/lib/admin-incidents')return {recordAdminIncidentSafely:async incident=>incidents.push(incident)};
 if(name==='@/lib/storage/s3')return {getPrivateS3DownloadUrl:async()=> 'https://example.test/zip'};
 if(name==='@/lib/galleries/archive-jobs')return {createGalleryArchiveJobId:()=> 'job',createGalleryArchiveContentFingerprint:()=> 'fingerprint',readGalleryArchiveJob:async()=>job,writeGalleryArchiveJob:async next=>{job=next;},newGalleryArchiveJob:input=>({...input,runId:'run',status:'queued',expiresAt:'2099-01-01'}),dispatchGalleryArchive:async()=>{dispatches++;}};
 return original.apply(this,arguments);
};
const archive=require('../../src/app/api/galleries/group/[galleryId]/download-all/route.ts');
const selection=require('../../src/app/api/galleries/group/participant/[id]/select/route.ts');
const calendar=require('../../src/app/api/admin/calendar-events/route.ts');
const request=()=>new NextRequest('http://localhost/api/galleries/group/9/download-all',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
(async()=>{
 await check('group archive creates and reuses one job with a valid correlation ID',async()=>{assert.equal((await archive.POST(request(),{params:Promise.resolve({galleryId:'9'})})).status,202);assert.equal(dispatches,1);assert.match(activities[0].correlation_id,/^[0-9a-f-]{36}$/);assert.equal(activities[0].correlation_id,activities[1].correlation_id);assert.equal((await archive.POST(request(),{params:Promise.resolve({galleryId:'9'})})).status,202);assert.equal(dispatches,1);assert.ok(activities.some(a=>a.action==='DOWNLOAD_ARCHIVE_REUSED'));});
 await check('missing HQ reports an actionable incident instead of crashing',async()=>{photos=[{id:4,download_source_url:null}];assert.equal((await archive.POST(request(),{params:Promise.resolve({galleryId:'9'})})).status,409);assert.match(incidents[0].correlationId,/^[0-9a-f-]{36}$/);});
 await check('parent selection loads paid photos for the authenticated participant',async()=>{const result=await selection.GET(new NextRequest('http://localhost/api/galleries/group/participant/8/select'),{params:Promise.resolve({id:'8'})});assert.equal(result.status,200);assert.deepEqual((await result.json()).paid_extra_photo_ids,[4]);assert.deepEqual(paidQuery.where,{gallery_id:9,participant_id:8,payment_status:'paid'});});
 await check('one malformed workshop day does not break the unified calendar',async()=>{const result=await calendar.GET(new NextRequest('http://localhost/api/admin/calendar-events'));assert.equal(result.status,200);const data=await result.json();assert.equal(data.events.length,1);assert.equal(data.events[0].date,'2026-10-10');assert.equal(data.events[0].start_time,'10:00');});
})().catch(error=>{console.error(error);process.exitCode=1});
