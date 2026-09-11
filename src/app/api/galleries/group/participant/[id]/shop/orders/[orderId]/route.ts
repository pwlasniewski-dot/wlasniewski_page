import {NextRequest} from 'next/server';
import {getShopOrder} from '@/lib/galleries/merchandise-server';
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string;orderId:string}>}){const p=await params;return getShopOrder(request,{participantId:Number(p.id)},Number(p.orderId));}
