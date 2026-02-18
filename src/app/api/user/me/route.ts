import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';
import { logSystem } from '@/lib/logger';

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        const token = extractToken(authHeader);

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const userResult = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!userResult) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Parallel independent queries for core user data
        const [giftCards, orders, bookings, offers] = await Promise.all([
            prisma.giftCard.findMany({ where: { owner_id: userResult.id } }).catch(() => []),
            prisma.giftCardOrder.findMany({
                where: { user_id: userResult.id },
                take: 5,
                orderBy: { created_at: 'desc' }
            }).catch(() => []),
            prisma.booking.findMany({
                where: {
                    email: userResult.email,
                    status: { not: 'archived' }
                },
                orderBy: { date: 'desc' }
            }).catch(() => []),
            prisma.offer.findMany({
                where: {
                    OR: [
                        { client_id: userResult.id },
                        { client_email: userResult.email }
                    ]
                },
                orderBy: { created_at: 'desc' },
                select: {
                    id: true, title: true, status: true, total_price: true,
                    valid_until: true, created_at: true, offerNumber: true,
                    type: true, pdf_url: true, slug: true
                }
            }).catch(() => [])
        ]);

        // Ultra-resilient contract fetching: 
        // 1. Fetch by direct client_id
        // 2. Fetch by offer_ids linked to user's email
        const offerIds = offers.map(o => o.id);
        const [contractsById, contractsByOffers] = await Promise.all([
            prisma.contract.findMany({
                where: { client_id: userResult.id },
                orderBy: { created_at: 'desc' }
            }).catch(() => []),
            prisma.contract.findMany({
                where: { offer_id: { in: offerIds } },
                orderBy: { created_at: 'desc' }
            }).catch(() => [])
        ]);

        // Merge and deduplicate contracts
        const allContracts = [...contractsById];
        contractsByOffers.forEach(c => {
            if (!allContracts.some(existing => existing.id === c.id)) {
                allContracts.push(c);
            }
        });

        // Fetch offer details for each contract independently
        const processedContracts = await Promise.all(
            allContracts.map(async (contract) => {
                const offerData = await prisma.offer.findUnique({
                    where: { id: contract.offer_id },
                    select: { title: true, total_price: true, offerNumber: true }
                }).catch(() => null);
                return { ...contract, offer: offerData };
            })
        );

        return NextResponse.json({
            success: true,
            user: {
                id: userResult.id,
                email: userResult.email,
                name: userResult.name,
                gift_cards: giftCards,
                orders: orders,
                bookings: bookings,
                offers: offers,
                contracts: processedContracts
            }
        });
    } catch (error: any) {
        console.error('Fetch user error:', error);
        await logSystem('ERROR', 'SYSTEM', 'Failed to fetch personal profile (me)', { error: error.message });
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
