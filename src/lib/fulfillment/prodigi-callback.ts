import {createHash,randomBytes} from 'node:crypto';
import type {ProdigiEnvironment} from './prodigi-orders';
export type ProdigiCallbackIndex={version:1;orderId:number;galleryId:number;environment:ProdigiEnvironment;idempotencyKey:string};
export function callbackTokenHash(token:string){return createHash('sha256').update(token).digest('hex');}
export function callbackIndexKey(hash:string){return `prodigi_callback_v1_${hash}`;}
export function createProdigiCallback(){
 const token=randomBytes(32).toString('hex');const hash=callbackTokenHash(token);
 // Paid fulfillment only runs on production; never derive a callback host from request headers.
 return {hash,key:callbackIndexKey(hash),url:`https://wlasniewski.pl/api/shop/prodigi/callback/${token}`};
}
