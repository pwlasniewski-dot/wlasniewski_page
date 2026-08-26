import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';
import { logSystem } from '@/lib/logger';
import { CLIENT_VISIBLE_OFFER_STATUS_VALUES } from '@/lib/offers/status';
import { revalidateActiveClient } from '@/lib/auth/active-client';
import { randomUUID } from 'node:crypto';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';
import { clientOwnershipWhere, contractOwnershipWhere } from '@/lib/auth/document-access';
import { CLIENT_VISIBLE_CONTRACT_STATUS_VALUES } from '@/lib/contracts/status';

function replaceContractPlaceholders(text: string, context: {
    contractNumber: string | null;
    clientName: string;
    clientEmail: string;
    offerTitle: string;
}) {
    if (!text) return text;
    return text
        .replace(/\{\{contractNumber\}\}/g, context.contractNumber || '')
        .replace(/\{\{currentDate\}\}/g, new Date().toLocaleDateString('pl-PL'))
        .replace(/\{\{clientName\}\}/g, context.clientName)
        .replace(/\{\{clientEmail\}\}/g, context.clientEmail)
        .replace(/\{\{offerTitle\}\}/g, context.offerTitle);
}

export async function GET(req: NextRequest) {
    const correlationId = randomUUID();
    let incidentClientId: number | null = null;
    let incidentClientEmail: string | null = null;
    try {
        const authHeader = req.headers.get('Authorization');
        const token = extractToken(authHeader) || req.cookies.get('client_token')?.value || null;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        incidentClientId = decoded.id;
        incidentClientEmail = decoded.email;

        const userResult = await revalidateActiveClient(decoded);

        if (!userResult) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        incidentClientId = userResult.id;
        incidentClientEmail = userResult.email;

        // Parallel independent queries for core user data
        const [giftCards, orders, bookings, offers, photoOrders] = await Promise.all([
            prisma.giftCard.findMany({
                where: { owner_id: userResult.id },
                orderBy: { id: 'desc' },
                take: 50,
            }),
            prisma.giftCardOrder.findMany({
                where: { user_id: userResult.id },
                take: 5,
                orderBy: { created_at: 'desc' }
            }),
            prisma.booking.findMany({
                where: {
                    email: userResult.email,
                    status: { not: 'archived' }
                },
                orderBy: { date: 'desc' },
                take: 50,
            }),
            prisma.offer.findMany({
                where: {
                    AND: [
                        { OR: clientOwnershipWhere(userResult) },
                        { status: { in: CLIENT_VISIBLE_OFFER_STATUS_VALUES } },
                    ],
                },
                orderBy: { created_at: 'desc' },
                take: 50,
                select: {
                    id: true, title: true, status: true, total_price: true,
                    valid_until: true, created_at: true, offerNumber: true,
                    type: true, pdf_url: true, slug: true, client_note: true
                },
            }),
            // Photo purchase orders from galleries
            prisma.photoOrder.findMany({
                where: {
                    gallery: { OR: clientOwnershipWhere(userResult) }
                },
                orderBy: { created_at: 'desc' },
                take: 50,
                include: {
                    gallery: {
                        select: { client_name: true, access_code: true }
                    }
                },
            })
        ]);

        const contracts = await prisma.contract.findMany({
            where: {
                status: { in: CLIENT_VISIBLE_CONTRACT_STATUS_VALUES },
                OR: contractOwnershipWhere(userResult),
            },
            orderBy: { created_at: 'desc' },
            take: 50,
            include: {
                offer: {
                    select: { title: true, total_price: true, offerNumber: true },
                },
            },
        });

        const processedContracts = contracts.map(contract => ({
            ...contract,
            content: replaceContractPlaceholders(contract.content || '', {
                contractNumber: contract.contract_number,
                clientName: userResult.name || userResult.email || 'Kliencie',
                clientEmail: userResult.email,
                offerTitle: contract.offer?.title || 'Umowa Samodzielna',
            }),
        }));

        return NextResponse.json({
            success: true,
            user: {
                id: userResult.id,
                email: userResult.email,
                name: userResult.name,
                role: userResult.role,
                permissions: userResult.permissions ?? null,
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
        await recordAdminIncidentSafely({
            severity: 'P1',
            category: 'PORTAL',
            reasonCode: 'PORTAL_LOAD_FAILED',
            summary: 'Nie udało się załadować danych panelu klienta',
            clientId: incidentClientId,
            clientEmail: incidentClientEmail,
            entityType: 'client_portal',
            correlationId,
            details: {
                prisma_code: typeof error?.code === 'string' ? error.code : null,
                error: error instanceof Error ? error.message : String(error),
            },
        });
        await logSystem('ERROR', 'SYSTEM', 'Failed to fetch personal profile (me)', { error: error.message });
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
