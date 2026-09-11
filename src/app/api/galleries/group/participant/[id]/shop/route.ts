import {NextRequest} from 'next/server';
import {getShop} from '@/lib/galleries/merchandise-server';
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){return getShop(request,{participantId:Number((await params).id)});}
