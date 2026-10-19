import { createHash, randomUUID } from 'node:crypto';
import prisma from '@/lib/db/prisma';
import { loadCalendarEvents, type CalendarEvent } from './events';
import { decryptGoogleSecret, googleConfigured, GoogleCalendarError, googleRequest, googleTokenRequest } from './google-security';
const BASE='https://www.googleapis.com/calendar/v3/calendars/primary/events';
const OWNER='wlasniewski.pl';
const terminal=new Set(['cancelled','rejected','archived','payment_failed','completed','draft']);
export function warsawToday(now=new Date()) { return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit'}).format(now); }
const nextDay=(date:string)=>new Date(new Date(`${date}T12:00:00Z`).getTime()+86400000).toISOString().slice(0,10);
export const googleEventId=(account:string,key:string)=>'fd'+createHash('sha256').update(`${account}:${key}`).digest('hex');
const digest=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function googleEventBody(event:CalendarEvent) {
 const marker=`fotodron:${event.source}:${event.source_id}`;
 const url=`https://wlasniewski.pl${event.detail_url}`;
 let note=''; let start:Record<string,string>; let end:Record<string,string>;
 if (!event.start_time) { start={date:event.date}; end={date:nextDay(event.date)}; note='Godzina nie została ustalona.'; }
 else {
  start={dateTime:`${event.date}T${event.start_time.slice(0,5)}:00`,timeZone:'Europe/Warsaw'};
  if (event.end_time && event.end_time>event.start_time) end={dateTime:`${event.date}T${event.end_time.slice(0,5)}:00`,timeZone:'Europe/Warsaw'};
  else { // Google requires an end. One-minute marker is explicitly not the session duration.
   const minute=new Date(`${event.date}T${event.start_time.slice(0,5)}:00Z`); minute.setUTCMinutes(minute.getUTCMinutes()+1);
   end={dateTime:minute.toISOString().slice(0,19),timeZone:'Europe/Warsaw'};
   note='Godzina zakończenia nieustalona. Jedna minuta w kalendarzu jest wyłącznie znacznikiem początku, nie czasem trwania sesji.';
  }
 }
 return {summary:`FotoDron — ${event.title}${event.client_name?` — ${event.client_name}`:''}`,description:[marker,url,note].filter(Boolean).join('\n'),location:event.venue||'',start,end,status:'confirmed',visibility:'private',extendedProperties:{private:{fotodron_owner:OWNER,fotodron_key:event.id}},source:{title:'Rezerwacja FotoDron',url}};
}
export function ownsGoogleEvent(remote:any,key:string) { return remote?.extendedProperties?.private?.fotodron_owner===OWNER && remote?.extendedProperties?.private?.fotodron_key===key; }
export function onlyOwnerAttendees(remote:any,email?:string|null) {
 return !remote?.attendees?.length || (!!email && remote.attendees.every((attendee:any)=>typeof attendee.email==='string'&&attendee.email.toLowerCase()===email.toLowerCase()));
}
export function matchesLegacyGoogleEvent(remote:any,event:CalendarEvent,email?:string|null) {
 const marker=`fotodron:${event.source}:${event.source_id}`;
 return onlyOwnerAttendees(remote,email) && remote?.description?.split(/\r?\n/).some((line:string)=>[marker,`Identyfikator źródła: ${marker}`].includes(line.trim())) && remote.description.includes(`https://wlasniewski.pl${event.detail_url}`);
}
export async function syncGoogleCalendar({force=false,budgetMs=20000}:{force?:boolean;budgetMs?:number}={}) {
 const deadline=Date.now()+Math.max(1000,Math.min(budgetMs,20000));
 const counts={created:0,updated:0,unchanged:0,cancelled:0,pending:false};
 if (!googleConfigured()) return {...counts,skipped:'not_configured'};
 const config=await prisma.googleCalendarIntegration.findUnique({where:{id:1}});
 if (!config?.connected || !config.refresh_token || !config.account_id) return {...counts,skipped:'disconnected'};
 if (!force && config.revision===config.synced_revision) return {...counts,skipped:'unchanged'};
 const lease=randomUUID(); const now=new Date();
 const claimed=await prisma.googleCalendarIntegration.updateMany({where:{id:1,connected:true,account_id:config.account_id,OR:[{lease_until:null},{lease_until:{lt:now}}]},data:{lease_token:lease,lease_until:new Date(Date.now()+120000)}});
 if(!claimed.count) throw new GoogleCalendarError('sync_busy',409);
 const renew=async()=>{const r=await prisma.googleCalendarIntegration.updateMany({where:{id:1,lease_token:lease,connected:true},data:{lease_until:new Date(Date.now()+120000)}});if(!r.count)throw new GoogleCalendarError('sync_busy',409);};
 try {
  const today=warsawToday();
  // A partial snapshot MUST NEVER be used to cancel Google events.
  const events=await loadCalendarEvents({from:today,strict:true});
  const active=events.filter(e=>!terminal.has(e.status.toLowerCase()));
  if(Date.now()>deadline)throw new GoogleCalendarError('sync_time_budget');
  const token=await googleTokenRequest({grant_type:'refresh_token',refresh_token:decryptGoogleSecret(config.refresh_token)},Math.min(10000,deadline-Date.now()));
  const request=(path:string,init:RequestInit={})=>{if(Date.now()>deadline)throw new GoogleCalendarError('sync_time_budget');return googleRequest(`${BASE}${path}`,{...init,headers:{Authorization:`Bearer ${token.access_token}`,'Content-Type':'application/json',...init.headers}},Math.min(10000,deadline-Date.now()));};
  const maps=await prisma.googleCalendarEventMap.findMany({where:{account_id:config.account_id}});
  const byKey=new Map(maps.map(m=>[m.source_key,m]));
  let writes=0;
  for(const event of active) {
   const body=googleEventBody(event); const hash=digest(body); const mapping=byKey.get(event.id);
   if(mapping?.content_hash===hash&&!mapping.cancelled){counts.unchanged++;continue;}
   if(Date.now()>deadline||writes>=30){counts.pending=true;break;}
   await renew();
   let id=mapping?.event_id || googleEventId(config.account_id,event.id); let remote:any=null;
   try {remote=await request(`/${encodeURIComponent(id)}`);} catch(e){if(!(e instanceof GoogleCalendarError)||![404,410].includes(e.status))throw e;}
   if(!remote&&!mapping&&event.source==='booking') {
    // The previous one-off export used an exact description marker and source URL.
    const matches:any[]=[];let pageToken='';
    do {
     const candidates=await request(`?${new URLSearchParams({q:`fotodron:booking:${event.source_id}`,maxResults:'100',showDeleted:'false',...(pageToken?{pageToken}:{})})}`);
     const identified=(candidates.items||[]).filter((r:any)=>matchesLegacyGoogleEvent({...r,attendees:[]},event,config.email));
     if(identified.some((r:any)=>!onlyOwnerAttendees(r,config.email)))throw new GoogleCalendarError('event_has_attendees');
     matches.push(...identified);
     pageToken=candidates.nextPageToken||'';
    }while(pageToken);
    if(matches.length>1)throw new GoogleCalendarError('duplicate_legacy_events');
    if(matches.length===1){remote=matches[0];id=remote.id;}
   }
   if(remote) {
    if(!ownsGoogleEvent(remote,event.id)&&!matchesLegacyGoogleEvent(remote,event,config.email))throw new GoogleCalendarError('event_ownership_conflict');
    if(!onlyOwnerAttendees(remote,config.email))throw new GoogleCalendarError('event_has_attendees');
    await request(`/${encodeURIComponent(id)}?sendUpdates=none`,{method:'PATCH',body:JSON.stringify(body)});counts.updated++;
   } else {
    try {await request('?sendUpdates=none',{method:'POST',body:JSON.stringify({id,...body})});counts.created++;}
    catch(e){ // A timed-out insert is retried with the same deterministic ID.
     if(!(e instanceof GoogleCalendarError)||e.status!==409)throw e;
     const existing=await request(`/${encodeURIComponent(id)}`);
     if(!ownsGoogleEvent(existing,event.id)||!onlyOwnerAttendees(existing,config.email))throw new GoogleCalendarError('event_ownership_conflict');
     await request(`/${encodeURIComponent(id)}?sendUpdates=none`,{method:'PATCH',body:JSON.stringify(body)});counts.updated++;
    }
   }
   writes++;
   await prisma.googleCalendarEventMap.upsert({where:{account_id_source_key:{account_id:config.account_id,source_key:event.id}},create:{account_id:config.account_id,source_key:event.id,event_id:id,event_date:event.date,content_hash:hash,cancelled:false},update:{event_id:id,event_date:event.date,content_hash:hash,cancelled:false}});
  }
  if(!counts.pending) {
   const present=new Set(active.map(e=>e.id));
   for(const mapping of maps.filter(m=>m.event_date>=today&&!m.cancelled&&!present.has(m.source_key))) {
    if(Date.now()>deadline||writes>=30){counts.pending=true;break;}
    await renew(); let remote:any;
    try {remote=await request(`/${encodeURIComponent(mapping.event_id)}`);}catch(e){if(!(e instanceof GoogleCalendarError)||![404,410].includes(e.status))throw e;}
    if(remote&&remote.status!=='cancelled') {
     if(!ownsGoogleEvent(remote,mapping.source_key)||!onlyOwnerAttendees(remote,config.email))throw new GoogleCalendarError('event_ownership_conflict');
     await request(`/${encodeURIComponent(mapping.event_id)}?sendUpdates=none`,{method:'PATCH',body:JSON.stringify({status:'cancelled'})});
    }
    await prisma.googleCalendarEventMap.update({where:{account_id_source_key:{account_id:config.account_id,source_key:mapping.source_key}},data:{cancelled:true}});counts.cancelled++;writes++;
   }
  }
  const latest=await prisma.googleCalendarIntegration.findUnique({where:{id:1},select:{revision:true}});
  counts.pending=counts.pending||latest?.revision!==config.revision;
  await prisma.googleCalendarIntegration.updateMany({where:{id:1,lease_token:lease},data:{...(!counts.pending?{synced_revision:config.revision,last_sync_at:new Date()}:{revision:{increment:1}}),last_error:null,stats:counts}});
  return counts;
 }catch(error){
  const code=error instanceof GoogleCalendarError?error.code:'sync_failed';
  if(code==='sync_time_budget'){counts.pending=true;await prisma.googleCalendarIntegration.updateMany({where:{id:1,lease_token:lease},data:{revision:{increment:1},stats:counts,last_error:null}});return counts;}
  await prisma.googleCalendarIntegration.updateMany({where:{id:1,lease_token:lease},data:{last_error:code,revision:{increment:1}}});
  throw new GoogleCalendarError(code,error instanceof GoogleCalendarError?error.status:502);
 }finally{await prisma.googleCalendarIntegration.updateMany({where:{id:1,lease_token:lease},data:{lease_token:null,lease_until:null}});}
}
