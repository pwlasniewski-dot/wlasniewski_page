import {NextRequest} from 'next/server';
import {getShopOrder} from '@/lib/galleries/merchandise-server';
export async function GET(request:NextRequest,{params}:{params:Promise<{accessCode:string;orderId:string}>}){const p=await params;return getShopOrder(request,{accessCode:p.accessCode},Number(p.orderId));}
