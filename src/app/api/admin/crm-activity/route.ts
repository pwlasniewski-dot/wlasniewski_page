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
        const limit = parseInt(searchParams.get('limit') || '100');
        const offset = parseInt(searchParams.get('offset') || '0');
        const dateFrom = searchParams.get('date_from');
        const dateTo = searchParams.get('date_to');

        const where: any = {};

        if (clientId && clientEmail) {
            where.OR = [
                { client_id: parseInt(clientId) },
                { client_email: clientEmail },
            ];
        } else if (clientId) {
            where.client_id = parseInt(clientId);
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

        return NextResponse.json({ activities: parsed, total, limit, offset });
    } catch (error: any) {
        console.error('[CRM_ACTIVITY_API] Error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
