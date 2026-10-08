import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import prisma from '@/lib/db/prisma';
import {rateLimit} from '@/lib/rate-limit';
import {readShopMetadata} from '@/lib/galleries/merchandise';
import {boundedJson} from '@/lib/fulfillment/prodigi-sandbox';
import {callbackIndexKey,callbackTokenHash} from '@/lib/fulfillment/prodigi-callback';
import {prodigiOrderRequest,assertProdigiCheckoutEnvironment,parseProviderOrder,validProviderId,type ProdigiOrderState} from '@/lib/fulfillment/prodigi-orders';
import {notifyProdigiCustomer} from '@/lib/fulfillment/prodigi-notification-server';
export const dynamic='force-dynamic';export const maxDuration=45;
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const indexSchema=z.object({version:z.literal(1),orderId:z.number().int().positive(),galleryId:z.number().int().positive(),environment:z.enum(['sandbox','live']),idempotencyKey:z.string().min(1).max(150)});
const reply=(status:number,received=false)=>NextResponse.json({received},{status,headers});
/** The body is an untrusted wake-up signal, never an order/status/payment source. */
export async function POST(request:NextRequest,{params}:{params:Promise<{token:string}>}){
 try{
  const {token}=await params;if(!/^[a-f0-9]{64}$/.test(token))return reply(404);
  const hash=callbackTokenHash(token);
  const indexRow=await prisma.setting.findUnique({where:{setting_key:callbackIndexKey(hash)}});
  if(!indexRow?.setting_value)return reply(404);
  let value:unknown;try{value=JSON.parse(indexRow.setting_value);}catch{return reply(503);}
  const index=indexSchema.safeParse(value);if(!index.success)return reply(503);
  if(!rateLimit(`prodigi-callback:${hash}`,30,60000).ok)return reply(429);
  try{await boundedJson(request.body,512*1024);}catch{return reply(400);}
  const order=await prisma.photoOrder.findFirst({where:{id:index.data.orderId,gallery_id:index.data.galleryId}});
  const metadata=readShopMetadata(order?.product_ids) as (NonNullable<ReturnType<typeof readShopMetadata>>&{providerFulfillment?:ProdigiOrderState})|null;
  if(!order||!metadata)return reply(404);
  const previous=metadata.providerFulfillment;
  if(!previous?.orderId)return reply(503);
  if(previous.callbackKeyHash!==hash||previous.environment!==index.data.environment||previous.idempotencyKey!==index.data.idempotencyKey)return reply(404);
  assertProdigiCheckoutEnvironment(previous.environment,metadata);
  const providerId=validProviderId(previous.orderId);
  const raw=await prodigiOrderRequest(previous.environment,`/Orders/${providerId}`,'GET') as {order?:{merchantReference?:string;idempotencyKey?:string}};
  if(raw.order?.merchantReference!==`photo-order-${order.id}`||raw.order?.idempotencyKey!==previous.idempotencyKey)return reply(503);
  const result=parseProviderOrder(raw);if(result.orderId!==providerId)return reply(503);
  const next:ProdigiOrderState={...previous,...result,state:result.stage.toLowerCase()==='cancelled'?'cancelled':'accepted',updatedAt:new Date().toISOString()};
  if(next.state==='cancelled')metadata.fulfillment={...metadata.fulfillment,status:'cancelled'};
  else metadata.fulfillment={status:(next.stage||'').toLowerCase()==='complete'?'shipped':'ordered',trackingNumber:next.shipments?.map(shipment=>shipment.trackingNumber).filter(Boolean).join(', ')||null};
  const updated=await prisma.photoOrder.updateMany({where:{id:order.id,gallery_id:order.gallery_id,product_ids:order.product_ids},data:{product_ids:JSON.stringify({...metadata,providerFulfillment:next})}});
  if(updated.count!==1)return reply(503);
  // Notification helper has its own durable deduplication claim. Never send the callback payload to email.
  await notifyProdigiCustomer(order.id,metadata.delivery.email,next,metadata.guestOwnerId);
  return reply(200,true);
 }catch{return reply(503);}
}
