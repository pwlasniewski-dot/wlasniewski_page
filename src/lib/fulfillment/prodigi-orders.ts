import { z } from 'zod';
import {isShopQa} from '../shop-qa';
import { boundedJson } from './prodigi-sandbox';
export type ProdigiEnvironment = 'sandbox' | 'live';
export type ProdigiOrderState = {environment:ProdigiEnvironment; state:'submitting'|'unknown'|'accepted'|'cancelled'; idempotencyKey:string; updatedAt:string; orderId?:string; stage?:string; outcome?:string; issueCount?:number; shipments?:Array<{id:string; trackingNumber:string|null; trackingUrl:string|null}>; approvedBy:number; approvedAt:string; callbackKeyHash?:string};
export class ProdigiOrderError extends Error {constructor(message:string,public status=409){super(message);}}
export function orderEnvironment():ProdigiEnvironment {
 const value=process.env.PRODIGI_ORDER_ENV || 'sandbox';
 if(value!=='sandbox'&&value!=='live') throw new ProdigiOrderError('Nieprawidłowe środowisko realizacji.',503);
 if(value==='live'&&process.env.PRODIGI_LIVE_ORDERS_ENABLED!=='true') throw new ProdigiOrderError('Produkcja Prodigi nie jest włączona.',503);
 return value;
}
export function orderCredentials(environment:ProdigiEnvironment){
 if(environment==='live'&&(isShopQa()||[process.env.CONTEXT?.trim(),process.env.GALLERY_QA_CONTEXT?.trim()].some(context=>context==='deploy-preview'||context==='branch-deploy')))throw new ProdigiOrderError('Zlecenia live są zablokowane w środowisku podglądu i QA.',503);
 if(environment==='live'&&process.env.PRODIGI_LIVE_ORDERS_ENABLED!=='true')throw new ProdigiOrderError('Produkcja Prodigi nie jest włączona.',503);
 const key=process.env[environment==='live'?'PRODIGI_API_KEY':'PRODIGI_SANDBOX_API_KEY']?.trim();
 if(!key)throw new ProdigiOrderError('Brak klucza wybranego środowiska Prodigi.',503);
 return {key,host:environment==='live'?'https://api.prodigi.com/v4.0':'https://api.sandbox.prodigi.com/v4.0'};
}
const id=z.string().regex(/^ord_[a-zA-Z0-9_-]{1,100}$/);
const response=z.object({outcome:z.string().max(100),order:z.object({id,status:z.object({stage:z.string().max(100),issues:z.array(z.unknown()).max(100).nullish()}).nullish(),shipments:z.array(z.object({id:z.string().max(150),tracking:z.object({number:z.string().max(300).nullish(),url:z.string().max(2000).nullish()}).nullish()})).max(100).nullish()})});
export async function prodigiOrderRequest(environment:ProdigiEnvironment,path:string,method:'GET'|'POST',payload?:unknown,transport:typeof fetch=fetch){
 if(!/^\/(?:Quotes|Orders(?:\/ord_[A-Za-z0-9_-]{1,100}(?:\/actions(?:\/cancel)?)?)?)$/.test(path))throw new ProdigiOrderError('Nieprawidłowa ścieżka API.',400);
 const {key,host}=orderCredentials(environment);
 try {
  const result=await transport(host+path,{method,headers:{'X-API-Key':key,'Content-Type':'application/json'},...(payload?{body:JSON.stringify(payload)}:{}),signal:AbortSignal.timeout(20000),redirect:'error',cache:'no-store'});
  if(!result.ok)throw new ProdigiOrderError(`Prodigi HTTP ${result.status}. Sprawdź zamówienie przed ponowną operacją.`,502);
  return await boundedJson(result.body,512*1024);
 }catch(e){if(e instanceof ProdigiOrderError)throw e;throw new ProdigiOrderError('Nie potwierdzono wyniku operacji Prodigi. Sprawdź stan przed ponowną próbą.',502);}
}
export function parseProviderOrder(input:unknown){
 const parsed=response.safeParse(input);if(!parsed.success)throw new ProdigiOrderError('Nie potwierdzono identyfikatora i stanu Prodigi.',502);
 const {order,outcome}=parsed.data;
 if(!['created','createdwithissues','alreadyexists','onhold','ok','cancelled','failedtocancel','actionnotavailable'].includes(outcome.toLowerCase()))throw new ProdigiOrderError('Prodigi nie potwierdziło operacji.',502);
 return {orderId:order.id,outcome,issueCount:order.status?.issues?.length||0,stage:order.status?.stage || (outcome.toLowerCase()==='onhold'?'OnHold':'Unknown'),shipments:(order.shipments||[]).map(s=>({id:s.id,trackingNumber:s.tracking?.number||null,trackingUrl:s.tracking?.url&&/^https:\/\//.test(s.tracking.url)?s.tracking.url:null}))};
}
export function validProviderId(value:unknown){return id.parse(value);}
export const prodigiSnapshotSchema=z.object({sku:z.string().regex(/^[A-Za-z0-9_-]{1,100}$/),environment:z.enum(['sandbox','live']),variant:z.object({attributes:z.record(z.string().max(60),z.string().max(100))}),requiredAssets:z.array(z.string().regex(/^[A-Za-z0-9_-]{1,60}$/)).min(1).max(8),shippingMethod:z.enum(['Budget','Standard','StandardPlus','Express','Overnight']).default('Standard')});
export const SANDBOX_SAMPLE='https://pwintyimages.blob.core.windows.net/samples/stars/test-sample-grey.png';
