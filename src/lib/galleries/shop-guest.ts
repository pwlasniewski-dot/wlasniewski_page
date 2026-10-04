import {createHash,randomBytes} from 'node:crypto';
import type {NextRequest,NextResponse} from 'next/server';
import {acquireAdvisoryTransactionLock} from '@/lib/db/advisoryLock';
import {ShopUploadError} from './shop-uploads';
import prisma from '@/lib/db/prisma';
const cookieName='shop_guest';
const lifetime=7*24*60*60;
export type ShopGuest={id:string;email:string;name:null};
const recordKey=(id:string)=>`shop_guest_session_v1_${id}`;
/** Raw bearer capability stays in HttpOnly cookie, never in database or API JSON. */
export async function readShopGuest(request:NextRequest):Promise<ShopGuest|null>{
 const token=request.cookies.get(cookieName)?.value;
 if(!token||! /^[a-f0-9]{64}$/.test(token))return null;
 const id=`guest_${createHash('sha256').update(token).digest('hex')}`;
 const row=await prisma.setting.findUnique({where:{setting_key:recordKey(id)}});
 try{const value=JSON.parse(row?.setting_value||'');if(value.version!==1||value.ownerId!==id||!Number.isFinite(value.expiresAt)||value.expiresAt<=Date.now())return null;}catch{return null;}
 return{id,email:'',name:null};
}
export async function createShopGuest(ip:string){
 const key=`shop_guest_issuance_v1_${createHash('sha256').update(ip).digest('hex')}`;
 await prisma.$transaction(async tx=>{
  await acquireAdvisoryTransactionLock(tx,key);
  const row=await tx.setting.findUnique({where:{setting_key:key}});
  let previous:{count:number;resetAt:number}|null=null;
  if(row){try{previous=JSON.parse(row.setting_value||'');}catch{throw new ShopUploadError('Nie można rozpocząć sesji. Spróbuj później.',503);}}
  const now=Date.now();
  if(previous&&(!Number.isSafeInteger(previous.count)||!Number.isFinite(previous.resetAt)))throw new ShopUploadError('Nie można rozpocząć sesji. Spróbuj później.',503);
  const current=previous&&previous.resetAt>now?previous:{count:0,resetAt:now+3600000};
  if(current.count>=5)throw new ShopUploadError('Za dużo nowych sesji. Spróbuj później.',429);
  const setting_value=JSON.stringify({...current,count:current.count+1});
  if(row)await tx.setting.update({where:{setting_key:key},data:{setting_value}});else await tx.setting.create({data:{setting_key:key,setting_value}});
 });
 const token=randomBytes(32).toString('hex'),id=`guest_${createHash('sha256').update(token).digest('hex')}`;
 await prisma.setting.create({data:{setting_key:recordKey(id),setting_value:JSON.stringify({version:1,ownerId:id,expiresAt:Date.now()+lifetime*1000})}});
 return {owner:{id,email:'',name:null} satisfies ShopGuest,attach(response:NextResponse){response.cookies.set(cookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:lifetime});return response;}};
}
export async function guestOwnsGallery(request:NextRequest,galleryId:number){
 const owner=await readShopGuest(request);if(!owner)return false;
 const marker=await prisma.setting.findUnique({where:{setting_key:`shop_personalization_gallery_v1_${owner.id}`}});
 return marker?.setting_value===String(galleryId);
}
