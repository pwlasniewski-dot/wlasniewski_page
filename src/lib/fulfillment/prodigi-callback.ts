import {createHash,randomBytes} from 'node:crypto';
import {ProdigiOrderError,type ProdigiEnvironment} from './prodigi-orders';
export type ProdigiCallbackIndex={version:1;orderId:number;galleryId:number;environment:ProdigiEnvironment;idempotencyKey:string};
export function callbackTokenHash(token:string){return createHash('sha256').update(token).digest('hex');}
export function callbackIndexKey(hash:string){return `prodigi_callback_v1_${hash}`;}
export function createProdigiCallback(environment:ProdigiEnvironment='live',trustedOrigin?:string){
 let origin='https://wlasniewski.pl';
 if(environment==='sandbox'){
  if(!trustedOrigin||!/^https:\/\/deploy-preview-[1-9][0-9]*--helpful-axolotl-cc1cbb\.netlify\.app$/.test(trustedOrigin))throw new ProdigiOrderError('Brak bezpiecznego adresu callback podglądu QA.');
  origin=trustedOrigin;
 }

 const token=randomBytes(32).toString('hex');const hash=callbackTokenHash(token);
 // Sandbox caller passes only an origin already validated by the admin-origin policy.
 return {hash,key:callbackIndexKey(hash),url:`${origin}/api/shop/prodigi/callback/${token}`};
}
