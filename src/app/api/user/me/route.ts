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
        const [giftCards, orders, bookings, offers, photoOrders, newsletterSubscription] = await Promise.all([
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
                    type: true, pdf_url: true, slug: true, client_note: true
                } as any
            }).catch(() => []),
            // Photo purchase orders from galleries
            prisma.photoOrder.findMany({
                where: {
                    gallery: {
                        OR: [
                            { client_email: userResult.email },
                            { client_id: userResult.id }
                        ]
                    }
                },
                orderBy: { created_at: 'desc' },
                include: {
                    gallery: {
                        select: { client_name: true, access_code: true }
                    }
                }
            }).catch(() => []),
            prisma.emailSubscriber.findUnique({
                where: { email: userResult.email },
                select: { is_active: true },
            }).catch(() => null)
        ]);

        // Ultra-resilient contract fetching: 
        // 1. Fetch by direct client_id
        // 2. Fetch by offer_ids linked to user's email
        const offerIds = (offers as any[]).map((o: any) => o.id as number);
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

        // Fetch offer details for each contract independently + replace placeholders
        const processedContracts = await Promise.all(
            allContracts.map(async (contract) => {
                const offerData = await prisma.offer.findUnique({
                    where: { id: contract.offer_id || -1 }, // Use -1 or dummy if null
                    select: { title: true, total_price: true, offerNumber: true }
                }).catch(() => null);

                // --- PLACEHOLDER REPLACEMENT LOGIC ---
                const context = {
                    contract_number: contract.contract_number,
                    clientName: userResult.name || userResult.email || 'Kliencie',
                    clientEmail: userResult.email,
                    offerTitle: offerData?.title || 'Umowa Samodzielna'
                };

                const replacePlaceholders = (text: string, ctx: any) => {
                    if (!text) return text;
                    return text
                        .replace(/\{\{contractNumber\}\}/g, ctx.contract_number || '')
                        .replace(/\{\{currentDate\}\}/g, new Date().toLocaleDateString('pl-PL'))
                        .replace(/\{\{clientName\}\}/g, ctx.clientName || '')
                        .replace(/\{\{clientEmail\}\}/g, ctx.clientEmail || '')
                        .replace(/\{\{offerTitle\}\}/g, ctx.offerTitle || 'Umowa Samodzielna');
                };

                const finalContent = replacePlaceholders(contract.content || '', context);
                // -------------------------------------

                return { ...contract, content: finalContent, offer: offerData };
            })
        );

        return NextResponse.json({
            success: true,
            user: {
                id: userResult.id,
                email: userResult.email,
                name: userResult.name,
                phone: userResult.phone,
                role: userResult.role,
                marketing_consent_at: userResult.marketing_consent_at,
                newsletter_active: newsletterSubscription?.is_active === true,
                permissions: (userResult as any).permissions ?? null,
                gift_cards: giftCards,
                orders: orders,
                bookings: bookings,
                offers: offers,
                contracts: processedContracts,
                photo_orders: photoOrders,
            }
        });
    } catch (error: any) {
        console.error('Fetch user error:', error);
        await logSystem('ERROR', 'SYSTEM', 'Failed to fetch personal profile (me)', { error: error.message });
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
