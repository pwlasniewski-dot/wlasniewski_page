import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';
import { deleteFromS3, uploadToS3 } from '@/lib/storage/s3';
import { isImmutableContractStatus } from '@/lib/contracts/status';
import { randomUUID } from 'node:crypto';
import { assertExpectedMagicBytes } from '@/lib/uploads/magic-bytes';
import { jsonWithCorrelation } from '@/lib/http/correlation';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const correlationId = randomUUID();
    try {
        const authError = await requireAuth(request);
        if (authError) return authError;

        const { id } = await context.params;
        const contractId = parseInt(id);

        const contract = await prisma.contract.findUnique({ where: { id: contractId } });
        if (!contract) {
            return NextResponse.json({ error: 'Umowa nie znaleziona' }, { status: 404 });
        }
        if (isImmutableContractStatus(contract.status)) {
            return NextResponse.json({ error: 'Wysłana lub podpisana umowa jest niezmiennym snapshotem.' }, { status: 409 });
        }

        const formData = await request.formData();
        const file = formData.get('pdf') as File;
        if (!file) {
            return NextResponse.json({ error: 'Brak pliku PDF' }, { status: 400 });
        }

        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Plik musi być w formacie PDF' }, { status: 400 });
        }

        // Max 50MB
        if (file.size > 50 * 1024 * 1024) {
            return NextResponse.json({ error: 'Plik zbyt duży (max 50MB)' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        try {
            assertExpectedMagicBytes(buffer, 'application/pdf');
        } catch {
            return jsonWithCorrelation({ error: 'Zawartość pliku nie jest poprawnym PDF-em.', correlation_id: correlationId }, correlationId, 400);
        }
        const fileName = `contracts/umowa_${contract.contract_number || contractId}_custom_${randomUUID()}.pdf`;

        console.log(`[ADMIN_UPLOAD_PDF] Uploading custom PDF for contract ${contractId}, size: ${buffer.length}`);
        const s3Url = await uploadToS3(buffer, fileName, 'application/pdf', { access: 'private' });
        console.log(`[ADMIN_UPLOAD_PDF] Uploaded to: ${s3Url}`);

        let updated;
        try {
            updated = await prisma.contract.updateMany({
                where: { id: contractId, status: contract.status, updated_at: contract.updated_at },
                data: { pdf_url: s3Url }
            });
        } catch (error) {
            await deleteFromS3(s3Url).catch(cleanupError => console.error('[ADMIN_UPLOAD_PDF] Error cleanup failed', cleanupError));
            throw error;
        }
        if (updated.count !== 1) {
            await deleteFromS3(s3Url).catch(cleanupError => console.error('[ADMIN_UPLOAD_PDF] Lost-CAS cleanup failed', cleanupError));
            return jsonWithCorrelation({ error: 'Umowa została równolegle zmieniona lub wysłana. Odśwież dane.', correlation_id: correlationId }, correlationId, 409);
        }

        return jsonWithCorrelation({ success: true, pdf_url: s3Url }, correlationId);
    } catch (error: any) {
        console.error('[ADMIN_UPLOAD_PDF] Error:', error);
        await recordAdminIncidentSafely({
            severity: 'P1', category: 'ADMIN_WRITE', reasonCode: 'ADMIN_CONTRACT_PDF_UPLOAD_FAILED',
            summary: 'Nie udało się zapisać PDF umowy', correlationId,
            details: { error: error instanceof Error ? error.message : String(error) },
        });
        return jsonWithCorrelation({ error: error.message || 'Błąd uploadu', correlation_id: correlationId }, correlationId, 500);
    }
}
