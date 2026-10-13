import {NextRequest,NextResponse} from 'next/server';
import prisma from '@/lib/db/prisma';
import {withAuth} from '@/lib/auth/middleware';
import {getClientIp,rateLimit} from '@/lib/rate-limit';
import {isTrustedAdminOrigin} from '@/lib/auth/admin-origin';
import {boundedJson,inspectSandbox} from '@/lib/fulfillment/prodigi-sandbox';
import {prodigiOrderRequest,parseProviderOrder,orderCredentials,ProdigiOrderError,SANDBOX_SAMPLE,type ProdigiOrderState} from '@/lib/fulfillment/prodigi-orders';
export const dynamic='force-dynamic';const headers={'Cache-Control':'private, no-store'};
export async function POST(request:NextRequest){return withAuth(request,async auth=>{try{
 if(!isTrustedAdminOrigin(request))return NextResponse.json({error:'Nieprawidłowe pochodzenie żądania.'},{status:403,headers});
 if(!rateLimit(`prodigi-test-order:${getClientIp(request)}`,6,60000).ok)return NextResponse.json({error:'Odczekaj minutę przed kolejną operacją.'},{status:429,headers});
 const body=await boundedJson(request.body,8192) as {action?:string;testId?:string;sku?:string};
 if(!['create','refresh','cancel'].includes(body?.action||''))throw new ProdigiOrderError('Nieprawidłowa operacja.',400);
 orderCredentials('sandbox');
 const testId=body.testId;if(typeof testId!=='string'||!/^[a-zA-Z0-9-]{10,60}$/.test(testId))throw new ProdigiOrderError('Nieprawidłowy identyfikator testu.',400);
 const key=`prodigi_sandbox_test_v1_${testId}`;
 const existing=await prisma.setting.findUnique({where:{setting_key:key}});
 if(body.action==='create'){
  if(existing)throw new ProdigiOrderError('Ten test już rozpoczęto. Odśwież jego stan; nie twórz ponownie.');
  const result=await inspectSandbox({action:'product',sku:body.sku});
  if(result.action!=='product')throw new ProdigiOrderError('Brak produktu.');
  const product=result.product,variant=product.variants.find(v=>v.shipsTo.includes('PL'));
  if(!variant||Object.keys(product.printAreas).filter(k=>product.printAreas[k].required).join(',')!=='default')throw new ProdigiOrderError('Test obsługuje produkt z jednym polem default.');
  const now=new Date().toISOString();const state:ProdigiOrderState={environment:'sandbox',state:'submitting',idempotencyKey:`sandbox-test-${testId}`,updatedAt:now,approvedAt:now,approvedBy:auth.user!.id};
  // Unique Setting key is the durable concurrency lock; these are synthetic diagnostics, not sales.
  await prisma.setting.create({data:{setting_key:key,setting_value:JSON.stringify(state)}});
  try{
   const provider=parseProviderOrder(await prodigiOrderRequest('sandbox','/Orders','POST',{idempotencyKey:state.idempotencyKey,merchantReference:`sandbox-test-${testId}`,shippingMethod:'Standard',recipient:{name:'Sandbox Test',address:{line1:'Testowa 1',postalOrZipCode:'00-001',townOrCity:'Warszawa',countryCode:'PL'}},items:[{sku:product.sku,copies:1,sizing:'fitPrintArea',attributes:variant.attributes,assets:[{printArea:'default',url:SANDBOX_SAMPLE}]}]}));
   const next={...state,...provider,state:'accepted',updatedAt:new Date().toISOString()};await prisma.setting.update({where:{setting_key:key},data:{setting_value:JSON.stringify(next)}});
   return NextResponse.json({success:true,testId,fulfillment:next},{headers});
  }catch(e){await prisma.setting.update({where:{setting_key:key},data:{setting_value:JSON.stringify({...state,state:'unknown'})}});throw e;}
 }
 if(!existing?.setting_value)throw new ProdigiOrderError('Nie znaleziono testu.',404);
 const state=JSON.parse(existing.setting_value) as ProdigiOrderState;
 if(!state.orderId||!/^ord_[a-zA-Z0-9_-]+$/.test(state.orderId))throw new ProdigiOrderError('Wynik nieznany. Sprawdź dashboard Prodigi po numerze referencyjnym; nowa próba jest zablokowana.');
 if(body.action==='cancel'){
  const actions=await prodigiOrderRequest('sandbox',`/Orders/${state.orderId}/actions`,'GET') as {cancel?:{isAvailable?:string}};
  if(actions.cancel?.isAvailable!=='Yes')throw new ProdigiOrderError('Prodigi nie udostępnia anulowania.');
 }
 const provider=parseProviderOrder(await prodigiOrderRequest('sandbox',`/Orders/${state.orderId}${body.action==='cancel'?'/actions/cancel':''}`,body.action==='cancel'?'POST':'GET'));
 if(provider.orderId!==state.orderId)throw new ProdigiOrderError('Niezgodne ID Prodigi.',502);
 const next={...state,...provider,state:provider.stage.toLowerCase()==='cancelled'?'cancelled':'accepted',updatedAt:new Date().toISOString()};
 const updated=await prisma.setting.updateMany({where:{setting_key:key,setting_value:existing.setting_value},data:{setting_value:JSON.stringify(next)}});if(updated.count!==1)throw new ProdigiOrderError('Stan zmienił się równocześnie. Odśwież.');
 return NextResponse.json({success:true,testId,fulfillment:next},{headers});
 }catch(e){return NextResponse.json({success:false,error:e instanceof ProdigiOrderError?e.message:'Nie potwierdzono testu Prodigi. Sprawdź jego stan przed ponowieniem.'},{status:e instanceof ProdigiOrderError?e.status:502,headers});}});}
