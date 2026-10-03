import prisma from '@/lib/db/prisma';
import {sendEmail} from '@/lib/email/sender';
import {isShopQa,shopDatabaseUrl} from '@/lib/shop-qa';
import {orderOrigin} from '@/lib/galleries/order-origin';
import {orderAccountPath} from '@/lib/galleries/order-presentation';
import {prodigiCustomerNotification} from './prodigi-notification';
import type {ProdigiOrderState} from './prodigi-orders';
/** Durable claim prevents refresh/replay from sending duplicate email. Ambiguous SMTP failures need manual review. */
export async function notifyProdigiCustomer(orderId:number,email:string,state:ProdigiOrderState){
 const message=prodigiCustomerNotification(orderId,state,`${orderOrigin()}${orderAccountPath(orderId)}`);
 if(!message)return {status:'not_applicable'};
 const key=`prodigi_notification_v1_${message.key}`;
 const capture=state.environment==='sandbox'||isShopQa();
 if(isShopQa())shopDatabaseUrl();
 const record={version:1,orderId,event:message.event,state:'sending',createdAt:new Date().toISOString(),...capture?{preview:{subject:message.subject,text:message.text,html:message.html}}:{}};
 try{await prisma.setting.create({data:{setting_key:key,setting_value:JSON.stringify(record)}});}catch(error){if((error as {code?:string}).code==='P2002')return {status:'already_claimed'};throw error;}
 try{
  if(!capture)await sendEmail({to:email,subject:message.subject,text:message.text,html:message.html});
  await prisma.setting.update({where:{setting_key:key},data:{setting_value:JSON.stringify({...record,state:capture?'captured':'sent',finishedAt:new Date().toISOString()})}});
  return {status:capture?'captured':'sent'};
 }catch{
  await prisma.setting.update({where:{setting_key:key},data:{setting_value:JSON.stringify({...record,state:'unknown',finishedAt:new Date().toISOString()})}}).catch(()=>{});
  return {status:'unknown'};
 }
}
