import {createHash} from 'node:crypto';
import type {ProdigiOrderState} from './prodigi-orders';
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
/** Provider completion is dispatch, never proof of delivery to the recipient. */
export function prodigiCustomerNotification(orderId:number,state:ProdigiOrderState,url:string){
 if(!Number.isSafeInteger(orderId)||orderId<1)throw new Error('Invalid order');
 const cancelled=state.state==='cancelled';
 if(!cancelled&&state.state!=='accepted')return null;
 const shipped=!cancelled&&state.stage?.toLowerCase()==='complete';
 const event=cancelled?'cancelled':shipped?'shipped':'ordered';
 const tracking=shipped?(state.shipments||[]).map(s=>s.trackingNumber).filter(Boolean).sort().join(', '):'';
 const subject=cancelled?`Anulowanie realizacji zamówienia #${orderId}`:shipped?`Zamówienie #${orderId} przekazane do wysyłki`:`Zamówienie #${orderId} przyjęte do realizacji`;
 const message=cancelled?'Realizacja zamówienia została anulowana. Status płatności i ewentualnego zwrotu sprawdzisz na swoim koncie.':shipped?'Producent zakończył realizację zamówienia. Status przesyłki sprawdzisz na swoim koncie. Ten komunikat nie potwierdza doręczenia.':'Producent przyjął zamówienie do realizacji. Powiadomimy Cię o zmianie etapu.';
 const parsed=new URL(url);if(parsed.username||parsed.password||!(parsed.protocol==='https:'||parsed.protocol==='http:'&&parsed.hostname==='localhost'))throw new Error('Invalid account URL');
 const text=[subject,message,tracking?`Numer przesyłki: ${tracking}`:'',url].filter(Boolean).join('\n\n');
 return {event,key:createHash('sha256').update(`${orderId}:${state.environment}:${state.orderId}:${event}:${tracking}`).digest('hex'),subject,text,html:`<h1>${escapeHtml(subject)}</h1><p>${escapeHtml(message)}</p>${tracking?`<p>Numer przesyłki: ${escapeHtml(tracking)}</p>`:''}<p><a href="${escapeHtml(url)}">Sprawdź zamówienie</a></p>`};
}
