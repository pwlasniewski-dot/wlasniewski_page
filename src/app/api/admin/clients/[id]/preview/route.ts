import {NextRequest,NextResponse} from 'next/server';
import {withAuth} from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';
import {generateClientPreviewToken} from '@/lib/auth/jwt';
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}) {
 return withAuth(request,async authenticated => {
  const id=Number((await params).id);
  if(!Number.isSafeInteger(id)||id<1) return NextResponse.json({error:'Nieprawidłowy klient.'},{status:400});
  const client=await prisma.user.findUnique({where:{id},select:{id:true,email:true,name:true,role:true,is_active:true,deleted_at:true,password_reset_required:true}});
  if(!client || client.role!=='CLIENT' || client.deleted_at) return NextResponse.json({error:'Nie znaleziono konta klienta.'},{status:404});
  const user={id:client.id,email:client.email,name:client.name || '',role:'CLIENT'};
  const blockedReason=!client.is_active ? 'Konto jest nieaktywne. Klient nie ma dostępu do panelu.' : client.password_reset_required ? 'Klient musi najpierw ustawić hasło. Panel nie jest jeszcze dostępny.' : null;
  const token=blockedReason ? null : await generateClientPreviewToken({id:client.id,email:client.email},authenticated.user!.id);
  return NextResponse.json({user,token,blockedReason},{headers:{'Cache-Control':'private, no-store'}});
 });
}
