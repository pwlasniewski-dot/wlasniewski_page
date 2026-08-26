import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';
import { deleteFromS3, uploadToS3 } from '@/lib/storage/s3';
import { sendEmail, getAdminEmail } from '@/lib/email/sender';
import { randomUUID } from 'crypto';
import { revalidateActiveClient } from '@/lib/auth/active-client';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';
import { isContractRecordOwner } from '@/lib/auth/document-access';
import { CLIENT_ACTIONABLE_CONTRACT_STATUS_VALUES, isClientActionableContractStatus } from '@/lib/contracts/status';
import { assertExpectedMagicBytes, type SupportedUploadMime } from '@/lib/uploads/magic-bytes';
import { escapeHtml, sanitizeUploadedFilename } from '@/lib/security/output';
import { clientJson } from '@/lib/client-operations';

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = randomUUID();
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
        const client = await revalidateActiveClient(decoded);
        if (!client) {
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
        if (!isClientActionableContractStatus(contract.status)) {
            return NextResponse.json({ error: 'Umowa nie znaleziona' }, { status: 404 });
        }
        // Verify ownership
        const isOwner = isContractRecordOwner(contract, client);

        if (!isOwner) {
            return NextResponse.json({ error: 'Brak dostępu' }, { status: 403 });
        }
        const formData = await request.formData();
        const file = formData.get('pdf') as File;

        if (!file) {
            return NextResponse.json({ error: 'Brak pliku' }, { status: 400 });
        }

        // Accept PDF and common image formats (scans)
        const allowedTypes: SupportedUploadMime[] = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type as SupportedUploadMime)) {
            return NextResponse.json({ error: 'Dozwolone formaty: PDF, JPEG, PNG' }, { status: 400 });
        }

        if (file.size > 20 * 1024 * 1024) {
            return NextResponse.json({ error: 'Plik zbyt duży (max 20MB)' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        try {
            assertExpectedMagicBytes(buffer, file.type as SupportedUploadMime);
        } catch {
            return clientJson({ error: 'Zawartość pliku nie odpowiada deklarowanemu formatowi.' }, { status: 400, correlationId });
        }
        const ext = file.type === 'application/pdf' ? 'pdf' : file.type.split('/')[1];
        const fileName = `contracts/umowa_${contract.contract_number || contractId}_podpisana_klient_${randomUUID()}.${ext}`;
        const safeOriginalName = sanitizeUploadedFilename(file.name);

        console.log(`[CLIENT_SIGNED_UPLOAD] Client ${client.email} uploading signed contract ${contractId}, size: ${buffer.length}`);

        const s3Url = await uploadToS3(buffer, fileName, file.type, { access: 'private' });

        // Atomowy warunek chroni przed dwoma równoległymi uploadami i nadpisaniem
        // raz podpisanego snapshotu.
        let signed: { count: number };
        try {
            signed = await prisma.$transaction(async (tx) => {
                const claimed = await tx.contract.updateMany({
                    where: {
                        id: contractId,
                        client_id: contract.client_id,
                        updated_at: contract.updated_at,
                        status: { in: CLIENT_ACTIONABLE_CONTRACT_STATUS_VALUES },
                    },
                    data: {
                        signed_pdf_url: s3Url,
                        status: 'signed',
                        signed_at: new Date(),
                    }
                });
                if (claimed.count !== 1) return claimed;
                await tx.crmActivity.create({
                    data: {
                        client_id: client.id,
                        client_email: client.email,
                        action: 'contract_scan_uploaded',
                        entity_type: 'contract',
                        entity_id: contractId,
                        details: JSON.stringify({
                            contract_number: contract.contract_number,
                            file_type: file.type,
                            file_size: file.size,
                            file_name: safeOriginalName,
                            signed_pdf_url: s3Url,
                            correlation_id: correlationId,
                        }),
                        ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                            || request.headers.get('x-real-ip') || null,
                        user_agent: request.headers.get('user-agent')?.slice(0, 500) || null,
                    },
                });
                return claimed;
            });
        } catch (error) {
            await deleteFromS3(s3Url).catch(cleanupError => console.error('[CLIENT_SIGNED_UPLOAD] Orphan cleanup failed:', cleanupError));
            throw error;
        }
        if (signed.count !== 1) {
            await deleteFromS3(s3Url).catch(cleanupError => console.error('[CLIENT_SIGNED_UPLOAD] Lost-CAS cleanup failed:', cleanupError));
            return NextResponse.json({ error: 'Umowa została już podpisana' }, { status: 409 });
        }

        // Notify admin
        try {
            const adminEmail = await getAdminEmail();
            if (!adminEmail) throw new Error('Brak adresu administratora');
            const clientName = client.email || 'Klient';
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl';
            await sendEmail({
                to: adminEmail,
                subject: `📝 Podpisana umowa od ${clientName} - ${contract.contract_number || `#${contractId}`}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #16a34a;">Klient wgrał podpisaną umowę</h2>
                        <p><strong>Klient:</strong> ${escapeHtml(clientName)}</p>
                        <p><strong>Umowa:</strong> ${escapeHtml(contract.contract_number || `#${contractId}`)}</p>
                        <p><strong>Plik:</strong> ${escapeHtml(safeOriginalName)} (${(file.size / 1024).toFixed(0)} KB)</p>
                        <p style="margin-top: 20px;">
                            <a href="${appUrl}/api/contracts/${contractId}/pdf" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                                Pobierz podpisany dokument
                            </a>
                        </p>
                        <p style="color: #666; font-size: 12px; margin-top: 30px;">
                            Umowa została automatycznie oznaczona jako podpisana.
                        </p>
                    </div>
                `,
                text: `Klient ${clientName} wgrał podpisaną umowę ${contract.contract_number || `#${contractId}`}. Dokument jest dostępny po zalogowaniu w panelu.`
            });
        } catch (emailErr) {
            console.error('[CLIENT_SIGNED_UPLOAD] Email notification failed:', emailErr);
            await recordAdminIncidentSafely({
                severity: 'P1',
                category: 'COMMUNICATION',
                reasonCode: 'CONTRACT_UPLOAD_ADMIN_NOTIFICATION_FAILED',
                summary: 'Nie udało się powiadomić administratora o wgraniu podpisanej umowy',
                clientId: client.id,
                clientEmail: client.email,
                entityType: 'contract',
                entityId: contractId,
                correlationId,
                details: { error: emailErr instanceof Error ? emailErr.message : String(emailErr) },
            });
        }

        return clientJson({ success: true, signed_pdf_url: s3Url }, { correlationId });
    } catch (error: any) {
        console.error('[CLIENT_SIGNED_UPLOAD] Error:', error);
        await recordAdminIncidentSafely({
            severity: 'P1', category: 'CONTRACT', reasonCode: 'CONTRACT_SIGNED_UPLOAD_FAILED',
            summary: 'Nie udało się zapisać podpisanego skanu umowy', correlationId,
            details: { error: error instanceof Error ? error.message : String(error) },
        });
        return clientJson({ error: 'Nie udało się zapisać pliku.' }, { status: 500, correlationId });
    }
}
