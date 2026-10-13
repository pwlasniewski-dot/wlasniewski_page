import {NextRequest,NextResponse} from 'next/server';
import {beginShopUpload} from '@/lib/galleries/shop-uploads';
import {withShopUpload,uploadHeaders,uploadJson} from '@/lib/galleries/shop-upload-http';
export const dynamic='force-dynamic';
export async function POST(request:NextRequest){return withShopUpload(request,async client=>NextResponse.json({success:true,...await beginShopUpload(client,await uploadJson(request))},{headers:uploadHeaders}));}
