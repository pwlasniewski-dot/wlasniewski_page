import {NextRequest,NextResponse} from 'next/server';
import {personalizationSession} from '@/lib/galleries/shop-uploads';
import {withShopUpload,uploadHeaders} from '@/lib/galleries/shop-upload-http';
export const dynamic='force-dynamic';
export async function POST(request:NextRequest){return withShopUpload(request,async client=>NextResponse.json({success:true,...await personalizationSession(client)},{headers:uploadHeaders}));}
