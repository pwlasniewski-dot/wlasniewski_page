import {NextRequest,NextResponse} from 'next/server';
import prisma from '@/lib/db/prisma';
import {extractToken} from '@/lib/auth/jwt';
import {verifyAdminClientPreviewToken} from '@/lib/auth/client-preview';
import {isContractRecordOwner} from '@/lib/auth/document-access';
import {isClientVisibleContractStatus} from '@/lib/contracts/status';
import {generateContractPDF} from '@/lib/services/pdf';
import {getPrivateS3DownloadUrl} from '@/lib/storage/s3';

export async function GET(request:NextRequest,{params}:{params:Promise<{id:string;resourceId:string}>}) {
 const values=await params,clientId=Number(values.id),contractId=Number(values.resourceId);
 if(!Number.isSafeInteger(clientId)||clientId<1||!Number.isSafeInteger(contractId)||contractId<1) return NextResponse.json({error:'Nieprawidłowy dokument.'},{status:400});
 const token=extractToken(request.headers.get('authorization'));
 const client=token ? await verifyAdminClientPreviewToken(token,request,clientId) : null;
 if(!client) return NextResponse.json({error:'Podgląd wygasł.'},{status:401});
 const contract=await prisma.contract.findUnique({where:{id:contractId},include:{offer:true,user:true}});
 if(!contract||!isContractRecordOwner(contract,client)||!isClientVisibleContractStatus(contract.status)) return NextResponse.json({error:'Dokument nie jest dostępny na tym koncie.'},{status:404});
 const stored=contract.status.toLowerCase()==='signed'&&contract.signed_pdf_url ? contract.signed_pdf_url : contract.pdf_url;
 if(stored) return NextResponse.redirect(await getPrivateS3DownloadUrl(stored),{status:302,headers:{'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}});
 const pdf=await generateContractPDF(contract,contract.status.toLowerCase()==='signed');
 return new NextResponse(pdf as BodyInit,{headers:{'Content-Type':'application/pdf','Content-Disposition':`inline; filename="Umowa_${contract.contract_number||contract.id}.pdf"`,'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow'}});
}
