import {NextRequest} from 'next/server';
import {postShopOrder} from '@/lib/galleries/merchandise-server';
export async function POST(request:NextRequest,{params}:{params:Promise<{accessCode:string}>}){return postShopOrder(request,{accessCode:(await params).accessCode});}
