import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;
        const offerId = parseInt(id);

        // Fetch offer and verify ownership
        const offer = await prisma.offer.findUnique({
            where: { id: offerId },
            include: {
                sections: {
                    include: {
                        items: true,
                    },
                },
                negotiations: true,
                contract: true,
            },
        });

        if (!offer) {
            return NextResponse.json(
                { error: 'Offer not found' },
                { status: 404 }
            );
        }

        // Verify client owns this offer
        if (
            offer.client_id !== decoded.id &&
            offer.client_email !== decoded.email
        ) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        return NextResponse.json({ offer });
    } catch (error) {
        console.error('Error fetching offer:', error);
        return NextResponse.json(
            { error: 'Failed to fetch offer' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;
        const offerId = parseInt(id);
        const body = await request.json();
        const { action, message, new_status } = body;

        // Fetch offer and verify ownership
        const offer = await prisma.offer.findUnique({
            where: { id: offerId },
        });

        if (!offer) {
            return NextResponse.json(
                { error: 'Offer not found' },
                { status: 404 }
            );
        }

        // Verify client owns this offer
        if (
            offer.client_id !== decoded.id &&
            offer.client_email !== decoded.email
        ) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Handle different actions
        if (action === 'accept') {
            await prisma.offer.update({
                where: { id: offerId },
                data: { status: 'accepted' },
            });
        } else if (action === 'reject') {
            await prisma.offer.update({
                where: { id: offerId },
                data: { status: 'rejected' },
            });
        } else if (action === 'negotiate' && message) {
            await prisma.negotiation.create({
                data: {
                    offer_id: offerId,
                    message,
                    status: 'open',
                },
            });
        }

        // Fetch updated offer
        const updated = await prisma.offer.findUnique({
            where: { id: offerId },
            include: {
                sections: {
                    include: {
                        items: true,
                    },
                },
                negotiations: true,
                contract: true,
            },
        });

        return NextResponse.json({ offer: updated });
    } catch (error) {
        console.error('Error updating offer:', error);
        return NextResponse.json(
            { error: 'Failed to update offer' },
            { status: 500 }
        );
    }
}
