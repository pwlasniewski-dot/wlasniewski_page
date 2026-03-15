import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';
import { uploadToS3 } from '@/lib/storage/s3';
import { sendEmail, getAdminEmail } from '@/lib/email/sender';
import { logClientActivity } from '@/lib/crm-activity';

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const token = extractToken(request.headers.get('authorization')) ||
            request.cookies.get('client_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const contractId = parseInt(id);

        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
            include: {
                offer: { select: { client_id: true, client_email: true, title: true } }
            }
        });

        if (!contract) {
            return NextResponse.json({ error: 'Umowa nie znaleziona' }, { status: 404 });
        }

        // Verify ownership
        const isOwner =
            contract.client_id === decoded.id ||
            contract.offer?.client_id === decoded.id ||
            contract.offer?.client_email === decoded.email;

        if (!isOwner) {
            return NextResponse.json({ error: 'Brak dostępu' }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('pdf') as File;

        if (!file) {
            return NextResponse.json({ error: 'Brak pliku' }, { status: 400 });
        }

        // Accept PDF and common image formats (scans)
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Dozwolone formaty: PDF, JPEG, PNG' }, { status: 400 });
        }

        if (file.size > 20 * 1024 * 1024) {
            return NextResponse.json({ error: 'Plik zbyt duży (max 20MB)' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = file.type === 'application/pdf' ? 'pdf' : file.type.split('/')[1];
        const fileName = `contracts/umowa_${contract.contract_number || contractId}_podpisana_klient.${ext}`;

        console.log(`[CLIENT_SIGNED_UPLOAD] Client ${decoded.email} uploading signed contract ${contractId}, size: ${buffer.length}`);

        // CRM Activity: scan uploaded
        logClientActivity(decoded, 'contract_scan_uploaded', {
            entityType: 'contract',
            entityId: contractId,
            details: { contract_number: contract.contract_number, file_type: file.type, file_size: file.size },
            request,
        });

        const s3Url = await uploadToS3(buffer, fileName, file.type);

        // Update contract with signed PDF URL and mark as signed
        await prisma.contract.update({
            where: { id: contractId },
            data: {
                signed_pdf_url: s3Url,
                status: 'signed',
                signed_at: new Date(),
            }
        });

        // Notify admin
        try {
            const adminEmail = await getAdminEmail();
            const clientName = decoded.email || 'Klient';
            await sendEmail({
                to: adminEmail,
                subject: `📝 Podpisana umowa od ${clientName} - ${contract.contract_number || `#${contractId}`}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #16a34a;">Klient wgrał podpisaną umowę</h2>
                        <p><strong>Klient:</strong> ${clientName}</p>
                        <p><strong>Umowa:</strong> ${contract.contract_number || `#${contractId}`}</p>
                        <p><strong>Plik:</strong> ${file.name} (${(file.size / 1024).toFixed(0)} KB)</p>
                        <p style="margin-top: 20px;">
                            <a href="${s3Url}" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                Pobierz podpisany dokument
                            </a>
                        </p>
                        <p style="color: #666; font-size: 12px; margin-top: 30px;">
                            Umowa została automatycznie oznaczona jako podpisana.
                        </p>
                    </div>
                `,
                text: `Klient ${clientName} wgrał podpisaną umowę ${contract.contract_number || `#${contractId}`}. Link: ${s3Url}`
            });
        } catch (emailErr) {
            console.error('[CLIENT_SIGNED_UPLOAD] Email notification failed:', emailErr);
        }

        return NextResponse.json({ success: true, signed_pdf_url: s3Url });
    } catch (error: any) {
        console.error('[CLIENT_SIGNED_UPLOAD] Error:', error);
        return NextResponse.json({ error: error.message || 'Błąd uploadu' }, { status: 500 });
    }
}
