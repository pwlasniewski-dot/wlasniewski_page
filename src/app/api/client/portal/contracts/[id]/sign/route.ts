import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';
import { sendEmail, getAdminEmail } from '@/lib/email/sender';
import { generateContractPDF } from '@/lib/services/pdf';
import { deleteFromS3, uploadToS3 } from '@/lib/storage/s3';
import crypto from 'crypto';
import { revalidateActiveClient } from '@/lib/auth/active-client';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';
import { isContractRecordOwner } from '@/lib/auth/document-access';
import { CLIENT_ACTIONABLE_CONTRACT_STATUS_VALUES, isClientActionableContractStatus } from '@/lib/contracts/status';
import { ContractSignatureError, decodeContractSignature } from '@/lib/contracts/signature';
import { beginClientOperation, clientJson, clientOperationTotalMs, recordSlowClientOperation } from '@/lib/client-operations';

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const operation = beginClientOperation();
    const correlationId = operation.correlationId;
    let incidentClientId: number | null = null;
    let incidentClientEmail: string | null = null;
    let incidentContractId: number | null = null;
    try {
        const token = extractToken(request.headers.get('authorization')) ||
            request.cookies.get('client_token')?.value;

        if (!token) {
            return clientJson({ error: 'Unauthorized' }, { status: 401, correlationId });
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return clientJson({ error: 'Unauthorized' }, { status: 401, correlationId });
        }
        const client = await revalidateActiveClient(decoded);
        if (!client) {
            return clientJson({ error: 'Unauthorized' }, { status: 401, correlationId });
        }
        incidentClientId = client.id;
        incidentClientEmail = client.email;

        const body = await request.json().catch(() => ({}));
        const clientNote = body.client_note?.trim() || '';
        const signatureMetadata = body.signature_metadata || {};
        let signature;
        try {
            signature = decodeContractSignature(body.signature_data);
        } catch (error) {
            if (error instanceof ContractSignatureError) {
                return clientJson({ error: error.message }, { status: 400, correlationId });
            }
            throw error;
        }

        const { id } = await params;
        const contractId = parseInt(id);
        incidentContractId = Number.isInteger(contractId) ? contractId : null;

        // Fetch contract with offer details
        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
            include: {
                offer: {
                    include: { user: true }
                }
            }
        });

        if (!contract) {
            return clientJson({ error: 'Contract not found' }, { status: 404, correlationId });
        }
        if (!isClientActionableContractStatus(contract.status)) {
            return clientJson({ error: 'Contract not found' }, { status: 404, correlationId });
        }

        // Verify ownership
        const isOwner = isContractRecordOwner(contract, client);

        if (!isOwner) {
            return clientJson({ error: 'Unauthorized' }, { status: 403, correlationId });
        }

        console.log(`[CONTRACT_SIGN] Signing contract ${contractId} with note: ${clientNote ? 'Yes' : 'No'}`);
        const isStandalonePdf = Boolean(contract.pdf_url) &&
            (contract.content?.startsWith('Umowa wgrana jako PDF') || !contract.content?.trim());
        if (isStandalonePdf) {
            return clientJson({
                error: 'Wgranej umowy PDF nie można podpisać formularzem online. Wgraj podpisany skan.',
            }, { status: 409, correlationId });
        }

        // Najpierw tworzymy trwały artefakt podpisanej wersji. Błąd PDF/S3
        // przerywa żądanie, więc baza nigdy nie raportuje fałszywego `signed`.
        const signedAt = new Date();
        const pdfSnapshot = {
            ...contract,
            status: 'signed',
            signed_at: signedAt,
            client_note: clientNote || null,
            _signaturePng: signature.buffer,
            _signatureHash: signature.sha256,
        };
        const pdfBuffer = await generateContractPDF(pdfSnapshot, true);
        if (!pdfBuffer.length) throw new Error('Wygenerowany PDF podpisanej umowy jest pusty');
        const fileName = `umowa_${contract.contract_number || contractId}_podpisana_${crypto.randomUUID()}.pdf`;
        const signedPdfUrl = await uploadToS3(pdfBuffer, `contracts/${fileName}`, 'application/pdf', { access: 'private' });

        // Atomowy finalny krok: tylko jedna równoległa próba może przejść ze
        // stanu niepodpisanego do podpisanego snapshotu.
        let signedCount = 0;
        try {
            await prisma.$transaction(async tx => {
                const signed = await tx.contract.updateMany({
                    where: {
                        id: contractId,
                        client_id: contract.client_id,
                        updated_at: contract.updated_at,
                        status: { in: CLIENT_ACTIONABLE_CONTRACT_STATUS_VALUES },
                    },
                    data: {
                        status: 'signed',
                        signed_at: signedAt,
                        client_note: clientNote || null,
                        signed_pdf_url: signedPdfUrl,
                    },
                });
                signedCount = signed.count;
                if (signed.count !== 1) return;
                await tx.crmActivity.create({
                    data: {
                        client_id: client.id,
                        client_email: client.email,
                        action: 'contract_signed',
                        entity_type: 'contract',
                        entity_id: contractId,
                        details: JSON.stringify({
                            contract_number: contract.contract_number,
                            has_note: Boolean(clientNote),
                            signature_hash: signature.sha256,
                            signature_width: signature.width,
                            signature_height: signature.height,
                            signed_at: signedAt.toISOString(),
                            correlation_id: correlationId,
                            total_ms: clientOperationTotalMs(operation.startedAt),
                            outcome: 'signed',
                            client_reported_timestamp: typeof signatureMetadata?.timestamp === 'string'
                                ? signatureMetadata.timestamp.slice(0, 100)
                                : null,
                            signed_pdf_url: signedPdfUrl,
                        }),
                        ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
                        user_agent: request.headers.get('user-agent')?.slice(0, 500) || null,
                    },
                });
            });
        } catch (error) {
            await deleteFromS3(signedPdfUrl).catch(cleanupError => console.error('[CONTRACT_SIGN] Orphan cleanup failed:', cleanupError));
            throw error;
        }
        if (signedCount !== 1) {
            await deleteFromS3(signedPdfUrl).catch(cleanupError => console.error('[CONTRACT_SIGN] Lost-CAS cleanup failed:', cleanupError));
            return clientJson({ error: 'Contract already signed' }, { status: 409, correlationId });
        }

        const updated = await prisma.contract.findUnique({
            where: { id: contractId },
            include: {
                offer: {
                    select: {
                        id: true,
                        title: true,
                        offerNumber: true,
                        client_email: true,
                    },
                },
            },
        });
        if (!updated) throw new Error('Podpisana umowa nie została odnaleziona po aktualizacji');

        // Fetch user name from DB (JWT only has id/email)
        const user = await prisma.user.findUnique({
            where: { id: client.id },
            select: { name: true }
        });

        const clientName = user?.name || client.email || 'Klient';
        const clientEmail = client.email;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl';

        // Notify admin about signing
        try {
            const adminEmail = await getAdminEmail();
            if (!adminEmail) throw new Error('Brak adresu administratora');
            await sendEmail({
                    to: adminEmail,
                    subject: `✅ Umowa ${updated.contract_number} PODPISANA — ${clientName}`,
                    html: `
<div style="font-family:Arial,sans-serif;padding:20px;background:#0a0a0a;color:#fff;max-width:600px;margin:0 auto;">
  <h2 style="color:#4ade80;">✅ Umowa podpisana przez klienta!</h2>
  <div style="background:#111;border:1px solid #222;border-radius:8px;padding:20px;margin:16px 0;">
    <p style="color:#888;margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Numer umowy</p>
    <p style="color:#c5a059;font-size:20px;font-weight:bold;margin:0;font-family:monospace;">${updated.contract_number}</p>
  </div>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:8px 0;color:#888;font-size:13px;">Klient</td><td style="padding:8px 0;color:#fff;font-size:13px;text-align:right;">${clientName} (${clientEmail})</td></tr>
    <tr><td style="padding:8px 0;color:#888;font-size:13px;">Oferta</td><td style="padding:8px 0;color:#fff;font-size:13px;text-align:right;">${updated.offer?.title || 'N/A'}</td></tr>
    <tr><td style="padding:8px 0;color:#888;font-size:13px;">Data podpisania</td><td style="padding:8px 0;color:#4ade80;font-size:13px;font-weight:bold;text-align:right;">${new Date().toLocaleString('pl-PL')}</td></tr>
    ${clientNote ? `<tr><td style="padding:8px 0;color:#888;font-size:13px;">Notatka klienta</td><td style="padding:8px 0;color:#fff;font-size:13px;text-align:right;">Tak</td></tr>` : ''}
  </table>
  <div style="text-align:center;margin:24px 0;">
    <a href="${appUrl}/api/contracts/${contractId}/pdf" style="display:inline-block;background:#4ade80;color:#000;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold;font-size:12px;margin-right:8px;">Pobierz umowę podpisaną</a>
  </div>
  <div style="text-align:center;margin:24px 0;">
    <a href="${appUrl}/admin/generator-umow" style="display:inline-block;background:#c5a059;color:#000;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;">Zarządzaj umowami →</a>
  </div>
</div>`
                });
        } catch (emailError) {
            console.error('[CONTRACT_SIGN] Failed to send admin notification:', emailError);
            await recordAdminIncidentSafely({
                severity: 'P1',
                category: 'COMMUNICATION',
                reasonCode: 'CONTRACT_SIGN_ADMIN_NOTIFICATION_FAILED',
                summary: 'Nie udało się powiadomić administratora o podpisaniu umowy',
                clientId: client.id,
                clientEmail: client.email,
                entityType: 'contract',
                entityId: contractId,
                correlationId,
                details: { error: emailError instanceof Error ? emailError.message : String(emailError) },
            });
        }

        // Send confirmation to client
        try {
            if (clientEmail) {
                await sendEmail({
                    to: clientEmail,
                    subject: `✅ Umowa ${updated.contract_number} podpisana — dziękujemy!`,
                    html: `
<div style="font-family:Arial,sans-serif;padding:20px;background:#0a0a0a;color:#fff;max-width:600px;margin:0 auto;">
  <div style="text-align:center;padding:24px 0;border-bottom:2px solid #c5a059;margin-bottom:24px;">
    <h1 style="color:#c5a059;font-size:22px;margin:0;letter-spacing:2px;">PRZEMYSŁAW WŁAŚNIEWSKI</h1>
    <p style="color:#888;font-size:11px;margin:4px 0 0;letter-spacing:4px;text-transform:uppercase;">Fotografia</p>
  </div>
  <div style="background:#111;border:1px solid #222;border-radius:12px;padding:32px;">
    <div style="text-align:center;margin-bottom:20px;">
      <div style="display:inline-block;background:rgba(74,222,128,0.1);border:2px solid rgba(74,222,128,0.4);border-radius:50%;width:56px;height:56px;line-height:56px;font-size:24px;">✅</div>
    </div>
    <h2 style="color:#fff;font-size:22px;margin:0 0 12px;text-align:center;">Umowa podpisana!</h2>
    <p style="color:#888;font-size:14px;line-height:1.6;text-align:center;margin:0 0 24px;">
      Dziękujemy za podpisanie umowy. Skontaktuję się z Tobą wkrótce, aby omówić szczegóły sesji.
    </p>
    <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="color:#888;font-size:11px;margin:0 0 6px;text-transform:uppercase;letter-spacing:2px;">Numer umowy</p>
      <p style="color:#c5a059;font-size:18px;font-weight:bold;margin:0;font-family:monospace;">${updated.contract_number}</p>
      <p style="color:#555;font-size:12px;margin:6px 0 0;">Oferta: ${updated.offer?.title || 'N/A'}</p>
    </div>
    <div style="text-align:center;margin-top:20px;">
      <p style="color:#888;font-size:12px;margin:0 0 12px;">Pobierz swoją podpisaną umowę:</p>
      <a href="${appUrl}/api/contracts/${contractId}/pdf" style="display:inline-block;background:#4ade80;color:#000;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold;">Pobierz PDF</a>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${appUrl}/konto" style="display:inline-block;background:#c5a059;color:#000;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:14px;">Panel klienta →</a>
    </div>
  </div>
  <p style="color:#444;font-size:11px;text-align:center;margin:16px 0 0;">© ${new Date().getFullYear()} Przemysław Właśniewski · <a href="https://wlasniewski.pl" style="color:#c5a059;">wlasniewski.pl</a></p>
</div>`
                });
            }
        } catch (emailError) {
            console.error('[CONTRACT_SIGN] Failed to send client confirmation:', emailError);
            await recordAdminIncidentSafely({
                severity: 'P1',
                category: 'COMMUNICATION',
                reasonCode: 'CONTRACT_SIGN_CLIENT_CONFIRMATION_FAILED',
                summary: 'Nie udało się wysłać klientowi potwierdzenia podpisania umowy',
                clientId: client.id,
                clientEmail,
                entityType: 'contract',
                entityId: contractId,
                correlationId,
                details: { error: emailError instanceof Error ? emailError.message : String(emailError) },
            });
        }

        await recordSlowClientOperation({
            operation: 'contract_sign', startedAt: operation.startedAt, correlationId,
            clientId: client.id, clientEmail: client.email, entityType: 'contract', entityId: contractId,
            outcome: 'signed',
        });
        return clientJson({
            success: true, 
            contract: updated,
            signed_pdf_url: signedPdfUrl
        }, { correlationId });
    } catch (error) {
        console.error('Error signing contract:', { correlationId, error });
        await recordAdminIncidentSafely({
            severity: 'P1', category: 'CONTRACT', reasonCode: 'CONTRACT_SIGN_FAILED',
            summary: 'Nie udało się podpisać umowy klienta', clientId: incidentClientId,
            clientEmail: incidentClientEmail, entityType: 'contract', entityId: incidentContractId,
            correlationId, details: { error: error instanceof Error ? error.message : String(error) },
        });
        return clientJson({ error: 'Nie udało się podpisać umowy.' }, { status: 500, correlationId });
    }
}
