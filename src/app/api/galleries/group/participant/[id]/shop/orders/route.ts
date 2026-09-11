import {NextRequest} from 'next/server';
import {postShopOrder} from '@/lib/galleries/merchandise-server';
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){return postShopOrder(request,{participantId:Number((await params).id)});}
