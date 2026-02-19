import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateOfferPDF } from '@/lib/services/pdf';
import { verifyToken, extractToken } from '@/lib/auth/jwt';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Extract and verify token for custom JWT system
        let token = extractToken(request.headers.get('authorization'));

        // Fallback: Check cookies if header missing (for browser downloads)
        if (!token) {
            const clientTokenCookie = request.cookies.get('client_token');
            const adminTokenCookie = request.cookies.get('admin_token');
            token = clientTokenCookie?.value || adminTokenCookie?.value || null;
        }

        // Fallback: Check query param (last resort)
        if (!token) {
            const url = new URL(request.url);
            token = url.searchParams.get('token');
        }

        const payload = token ? await verifyToken(token) : null;

        if (!payload) {
            console.warn('[PDF API] Unauthorized access attempt to offer PDF');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const offerId = parseInt(id);

        const offer = await prisma.offer.findUnique({
            where: { id: offerId },
            include: {
                sections: {
                    include: { items: true },
                },
            },
        });

        if (!offer) {
            return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
        }

        // Security check: Only owner or admin
        const isAdmin = await prisma.adminUser.findUnique({ where: { id: payload.id } });
        const isClientOwner = payload.email === offer.client_email || payload.id === offer.client_id;

        if (!isAdmin && !isClientOwner) {
            console.warn(`[PDF API] Forbidden access attempt by ${payload.email} to offer ${offerId}`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // If a stored PDF URL exists (uploaded via S3), redirect to it
        if (offer.pdf_url) {
            return NextResponse.redirect(offer.pdf_url, { status: 302 });
        }

        // No stored PDF: return a helpful error
        console.warn(`[PDF API] No pdf_url for offer ${offerId}. PDF not yet generated.`);
        return NextResponse.json(
            {
                error: 'PDF nie jest jeszcze dostępny.',
                message: 'Administrator musi najpierw wygenerować i zapisać PDF przez panel admina (przycisk S3 w edytorze oferty).',
            },
            { status: 404 }
        );
    } catch (error) {
        console.error('Error serving PDF:', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}
