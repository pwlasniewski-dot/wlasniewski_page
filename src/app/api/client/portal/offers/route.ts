import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';
import { CLIENT_VISIBLE_OFFER_STATUS_VALUES } from '@/lib/offers/status';
import { revalidateActiveClient } from '@/lib/auth/active-client';
import { clientOwnershipWhere } from '@/lib/auth/document-access';
import { isClientVisibleContractStatus } from '@/lib/contracts/status';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Extract and verify token
        const token = extractToken(request.headers.get('authorization')) || 
                     request.cookies.get('client_token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
        const client = await revalidateActiveClient(decoded);
        if (!client) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all offers for this client (both by user_id and client_email)
        const offers = await prisma.offer.findMany({
            where: {
                AND: [
                    { OR: clientOwnershipWhere(client) },
                    { status: { in: CLIENT_VISIBLE_OFFER_STATUS_VALUES } },
                ],
            },
            include: {
                sections: {
                    include: {
                        items: true,
                    },
                },
                negotiations: true,
                contract: true,
            },
            orderBy: { created_at: 'desc' },
        });

        return NextResponse.json({
            offers: offers.map(offer => ({
                ...offer,
                contract: offer.contract && isClientVisibleContractStatus(offer.contract.status)
                    ? offer.contract
                    : null,
            })),
        });
    } catch (error) {
        console.error('Error fetching client offers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch offers' },
            { status: 500 }
        );
    }
}
