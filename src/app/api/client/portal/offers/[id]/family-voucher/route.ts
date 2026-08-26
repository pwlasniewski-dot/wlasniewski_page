import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';
import { generateFamilyVoucherPdfBuffer } from '@/lib/offers/familyVoucher';
import { revalidateActiveClient } from '@/lib/auth/active-client';
import { isClientRecordOwner, isVerifiedAdminIdentity } from '@/lib/auth/document-access';
import { isClientVisibleOfferStatus } from '@/lib/offers/status';
import { randomUUID } from 'node:crypto';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';
import { clientJson } from '@/lib/client-operations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const correlationId = randomUUID();
    try {
        const tokenCandidates = [
            extractToken(request.headers.get('authorization')),
            request.cookies.get('client_token')?.value || null,
            request.cookies.get('user_token')?.value || null,
            request.cookies.get('admin_token')?.value || null,
        ].filter((value): value is string => Boolean(value));
        const identities: Array<NonNullable<Awaited<ReturnType<typeof verifyToken>>>> = [];
        for (const candidate of tokenCandidates) {
            const decoded = await verifyToken(candidate);
            if (decoded) identities.push(decoded);
        }
        if (identities.length === 0) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const offerId = Number(id);
        if (!Number.isInteger(offerId) || offerId <= 0) {
            return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
        }

        const offer = await prisma.offer.findUnique({
            where: { id: offerId },
            select: {
                id: true,
                title: true,
                category: true,
                status: true,
                client_id: true,
                client_email: true,
            },
        });

        if (!offer) {
            return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
        }

        let isAdmin = false;
        let isOwner = false;
        let hasActiveClient = false;
        for (const identity of identities) {
            const admin = identity.type === 'admin' && identity.role === 'ADMIN'
                ? await prisma.adminUser.findUnique({
                    where: { id: identity.id },
                    select: { id: true, email: true, role: true },
                })
                : null;
            if (isVerifiedAdminIdentity(identity, admin)) {
                isAdmin = true;
                break;
            }
            const activeClient = await revalidateActiveClient(identity);
            if (activeClient) {
                hasActiveClient = true;
                isOwner = isClientRecordOwner(offer, activeClient);
                if (isOwner) break;
            }
        }
        if (!isAdmin && !hasActiveClient) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!isAdmin && !isOwner) {
            const matchingEmailWithDifferentOwner = identities.some(identity =>
                identity.email.trim().toLowerCase() === offer.client_email?.trim().toLowerCase()
                && offer.client_id !== null && identity.id !== offer.client_id,
            );
            if (matchingEmailWithDifferentOwner) {
                await recordAdminIncidentSafely({
                    severity: 'P1', category: 'DATA_INTEGRITY', reasonCode: 'CLIENT_OFFER_OWNERSHIP_CONFLICT',
                    summary: 'E-mail vouchera wskazuje inne konto niż nadrzędny client_id',
                    entityType: 'offer', entityId: offerId, correlationId,
                    details: { authoritative_client_id: offer.client_id, operation: 'family_voucher' },
                });
            }
            return clientJson({ error: 'Offer not found' }, { status: 404, correlationId });
        }
        if (!isAdmin && !isClientVisibleOfferStatus(offer.status)) {
            return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
        }

        const isFamilySession = (offer.category || '').toLowerCase().includes('rodzin') || (offer.category || '').toLowerCase() === 'family';
        if (!isFamilySession) {
            return NextResponse.json({ error: 'Voucher dostępny tylko dla sesji rodzinnych' }, { status: 400 });
        }

        const searchParams = request.nextUrl.searchParams;
        const senderName = searchParams.get('senderName') || 'Osoba zamawiająca';
        const recipientName = searchParams.get('recipientName') || 'Rodzice';
        const packageName = searchParams.get('packageName') || 'Do wyboru';
        const packagePriceLabel = searchParams.get('packagePriceLabel') || 'Do ustalenia';
        const hidePrice = searchParams.get('hidePrice') === '1';
        const sessionDate = searchParams.get('sessionDate') || 'Termin do uzgodnienia';
        const sessionTime = searchParams.get('sessionTime') || 'Godzina do uzgodnienia';
        const location = searchParams.get('location') || 'Lokalizacja do uzgodnienia';
        const verificationCode = searchParams.get('verificationCode') || `RODZ${offerId}`;
        const qrTarget = 'https://wlasniewski.pl';

        const pdfBuffer = await generateFamilyVoucherPdfBuffer({
            senderName,
            recipientName,
            packageName,
            packagePriceLabel,
            hidePrice,
            sessionDate,
            sessionTime,
            location,
            verificationCode,
            qrTarget,
        });

        return new NextResponse(pdfBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="voucher-rodzinny-${offerId}.pdf"`,
                'Cache-Control': 'private, no-store',
            },
        });
    } catch (error) {
        console.error('[family-voucher] error:', error);
        return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
    }
}
