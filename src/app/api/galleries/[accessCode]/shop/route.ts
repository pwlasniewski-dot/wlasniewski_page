import {NextRequest} from 'next/server';
import {getShop} from '@/lib/galleries/merchandise-server';
export async function GET(request:NextRequest,{params}:{params:Promise<{accessCode:string}>}){return getShop(request,{accessCode:(await params).accessCode});}
