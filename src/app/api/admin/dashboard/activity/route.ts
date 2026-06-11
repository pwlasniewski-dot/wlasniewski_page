import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const authError = await requireAuth(request);
        if (authError) return authError;

        const [systemLogs, crmActivities] = await Promise.all([
            prisma.systemLog.findMany({
                where: {
                    OR: [
                        { module: { in: ['AUTH', 'OFFERS', 'CONTRACTS', 'CLIENTS', 'GALLERIES', 'SYSTEM'] } },
                        { message: { contains: 'ofert', mode: 'insensitive' } },
                        { message: { contains: 'umow', mode: 'insensitive' } },
                        { message: { contains: 'klient', mode: 'insensitive' } },
                        { message: { contains: 'galer', mode: 'insensitive' } },
                        { message: { contains: 'login', mode: 'insensitive' } },
                    ]
                },
                orderBy: { created_at: 'desc' },
                take: 25,
            }),
            prisma.crmActivity.findMany({
                where: {
                    OR: [
                        { action: 'login' },
                        { action: 'offer_viewed' },
                        { action: 'contract_viewed' },
                        { action: 'gallery_viewed' },
                    ],
                },
                orderBy: { created_at: 'desc' },
                take: 25,
            }),
        ]);

        const normalizedSystemLogs = systemLogs.map((log) => ({
            id: `sys-${log.id}`,
            message: log.message,
            details: log.metadata,
            created_at: log.created_at,
            source: 'system',
        }));

        const normalizedCrm = crmActivities.map((a) => {
            const details = a.details ? (() => { try { return JSON.parse(a.details); } catch { return a.details; } })() : null;
            return {
                id: `crm-${a.id}`,
                message: `CRM: ${a.action}${a.client_email ? ` (${a.client_email})` : ''}`,
                details,
                created_at: a.created_at,
                source: 'crm',
            };
        });

        const logs = [...normalizedSystemLogs, ...normalizedCrm]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 25);

        return NextResponse.json({ success: true, logs });
    } catch (error) {
        console.error('Error fetching dashboard activity:', error);
        return NextResponse.json({ error: 'Failed to fetch activity feed' }, { status: 500 });
    }
}
