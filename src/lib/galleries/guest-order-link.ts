import { createHmac, timingSafeEqual } from 'node:crypto';
const lifetimeSeconds=90*24*60*60;
function signature(orderId:number,expires:number,owner:string){
 const secret=process.env.JWT_SECRET;
 if(!secret || secret.length<32)throw Error('Guest order link signing is unavailable.');
 return createHmac('sha256',secret).update(`guest-order-read-v1:${orderId}:${expires}:${owner}`).digest('hex');
}
/** Read-only capability for one order; never a login or gallery/upload capability. */
export function guestOrderPath(orderId:number,owner:string,now=Date.now()){
 if(!Number.isSafeInteger(orderId)||orderId<1||!/^guest_[a-f0-9]{64}$/.test(owner))throw Error('Invalid guest order.');
 const expires=Math.floor(now/1000)+lifetimeSeconds;
 return `/sklep/zamowienie/${orderId}.${expires}.${signature(orderId,expires,owner)}`;
}
export function parseGuestOrderToken(token:string,now=Date.now()){
 const match=/^([1-9]\d{0,14})\.(\d{10})\.([a-f0-9]{64})$/.exec(token);
 if(!match)return null;
 const orderId=Number(match[1]),expires=Number(match[2]);
 if(!Number.isSafeInteger(orderId)||expires<=Math.floor(now/1000)||expires>Math.floor(now/1000)+lifetimeSeconds+60)return null;
 return {orderId,expires,signature:match[3]};
}
export function verifyGuestOrderToken(token:string,owner:string,now=Date.now()){
 const parsed=parseGuestOrderToken(token,now);
 if(!parsed||!/^guest_[a-f0-9]{64}$/.test(owner))return false;
 try{return timingSafeEqual(Buffer.from(parsed.signature,'hex'),Buffer.from(signature(parsed.orderId,parsed.expires,owner),'hex'));}catch{return false;}
}
