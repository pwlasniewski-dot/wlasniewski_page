import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('client_id');
        const clientEmail = searchParams.get('client_email');
        const action = searchParams.get('action');
        const entityType = searchParams.get('entity_type');
        const entityId = searchParams.get('entity_id');
        const limit = Number(searchParams.get('limit') || '100');
        const offset = Number(searchParams.get('offset') || '0');
        const dateFrom = searchParams.get('date_from');
        const dateTo = searchParams.get('date_to');

        if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500 || !Number.isSafeInteger(offset) || offset < 0 || offset > 100_000
            || (clientId && (!/^\d+$/.test(clientId) || !Number.isSafeInteger(Number(clientId)) || Number(clientId) < 1))
            || (entityId && (!/^\d+$/.test(entityId) || !Number.isSafeInteger(Number(entityId)) || Number(entityId) < 1))
            || (dateFrom && !Number.isFinite(Date.parse(dateFrom))) || (dateTo && !Number.isFinite(Date.parse(dateTo)))
            || (dateFrom && dateTo && Date.parse(dateFrom) > Date.parse(dateTo))) {
            return NextResponse.json({ error: 'Nieprawidłowe filtry historii.' }, { status: 400 });
        }

        const where: any = {};

        if (clientId) {
            const client = await prisma.user.findUnique({ where: { id: Number(clientId) }, select: { email: true } });
            if (!client) return NextResponse.json({ error: 'Nie znaleziono klienta.' }, { status: 404 });
            // An explicit account assignment wins over legacy email metadata.
            where.OR = [
                { client_id: Number(clientId) },
                { client_id: null, client_email: client.email },
            ];
        } else if (clientEmail) {
            where.client_email = clientEmail;
        }
        if (action) where.action = action;
        if (entityType) where.entity_type = entityType;
        if (entityId) where.entity_id = parseInt(entityId);
        if (dateFrom || dateTo) {
            where.created_at = {};
            if (dateFrom) where.created_at.gte = new Date(dateFrom);
            if (dateTo) where.created_at.lte = new Date(dateTo);
        }

        const [activities, total] = await Promise.all([
            prisma.crmActivity.findMany({
                where,
                orderBy: { created_at: 'desc' },
                take: Math.min(limit, 500),
                skip: offset,
            }),
            prisma.crmActivity.count({ where }),
        ]);

        // Parse details JSON strings back to objects
        const parsed = activities.map((a: any) => ({
            ...a,
            details: a.details ? (() => { try { return JSON.parse(a.details); } catch { return a.details; } })() : null,
        }));

        return NextResponse.json({ activities: parsed, total, limit, offset }, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error: any) {
        console.error('[CRM_ACTIVITY_API] Error:', error);
        return NextResponse.json({ error: 'Nie udało się pobrać historii aktywności.' }, { status: 500 });
    }
}
