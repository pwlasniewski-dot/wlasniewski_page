import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { withAuth, type AuthenticatedRequest } from '@/lib/auth/middleware';

const SEVERITIES = ['P0', 'P1', 'P2', 'P3'] as const;
const STATUSES = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'] as const;

function positiveInteger(value: string | null, fallback: number, maximum?: number) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
    return maximum ? Math.min(parsed, maximum) : parsed;
}

function enumFilter<T extends readonly string[]>(value: string | null, allowed: T) {
    const allowedValues: readonly string[] = allowed;
    return value && allowedValues.includes(value) ? value as T[number] : null;
}

export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        const params = request.nextUrl.searchParams;
        const page = positiveInteger(params.get('page'), 1);
        const limit = positiveInteger(params.get('limit'), 25, 100);
        const severity = enumFilter(params.get('severity'), SEVERITIES);
        const status = enumFilter(params.get('status'), STATUSES);
        const category = params.get('category')?.trim();
        const reasonCode = params.get('reason_code')?.trim();
        const correlationId = params.get('correlation_id')?.trim();
        const clientId = params.get('client_id') ? Number(params.get('client_id')) : null;
        const query = params.get('q')?.trim();
        if (correlationId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(correlationId)) {
            return NextResponse.json({ error: 'Nieprawidłowy identyfikator korelacji.' }, { status: 400 });
        }

        const where: Prisma.AdminIncidentWhereInput = {
            ...(severity ? { severity } : {}),
            ...(status ? { status } : {}),
            ...(category ? { category } : {}),
            ...(reasonCode ? { reason_code: reasonCode } : {}),
            ...(correlationId ? { correlation_id: correlationId } : {}),
            ...(Number.isInteger(clientId) && Number(clientId) > 0 ? { client_id: clientId } : {}),
            ...(query ? {
                OR: [
                    { summary: { contains: query, mode: 'insensitive' } },
                    { client_email: { contains: query, mode: 'insensitive' } },
                    { reason_code: { contains: query, mode: 'insensitive' } },
                    { category: { contains: query, mode: 'insensitive' } },
                ],
            } : {}),
        };

        const [incidents, total, statusCounts, severityCounts] = await prisma.$transaction([
            prisma.adminIncident.findMany({
                where,
                orderBy: [{ occurred_at: 'desc' }, { severity: 'asc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.adminIncident.count({ where }),
            prisma.adminIncident.groupBy({
                by: ['status'],
                _count: { _all: true },
            }),
            prisma.adminIncident.groupBy({
                by: ['severity'],
                _count: { _all: true },
                where: { status: { not: 'RESOLVED' } },
            }),
        ]);

        return NextResponse.json({
            success: true,
            incidents,
            pagination: {
                page,
                limit,
                total,
                pages: Math.max(1, Math.ceil(total / limit)),
            },
            counts: {
                by_status: Object.fromEntries(statusCounts.map(item => [item.status, item._count._all])),
                open_by_severity: Object.fromEntries(severityCounts.map(item => [item.severity, item._count._all])),
            },
        });
    });
}

export async function PATCH(request: NextRequest) {
    return withAuth(request, async (authenticatedRequest: AuthenticatedRequest) => {
        const body = await request.json().catch(() => null) as {
            id?: unknown;
            action?: unknown;
        } | null;
        const id = typeof body?.id === 'string' ? body.id.trim() : '';
        const action = body?.action;
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
            || (action !== 'acknowledge' && action !== 'resolve')) {
            return NextResponse.json({ error: 'Nieprawidłowe id lub akcja.' }, { status: 400 });
        }

        const changedAt = new Date();
        const incident = await prisma.$transaction(async tx => {
            const changed = await tx.adminIncident.updateMany({
                where: {
                    id,
                    status: action === 'resolve'
                        ? { in: ['OPEN', 'ACKNOWLEDGED'] }
                        : 'OPEN',
                },
                data: action === 'resolve'
                    ? {
                        status: 'RESOLVED',
                        acknowledged_at: changedAt,
                        resolved_at: changedAt,
                    }
                    : {
                        status: 'ACKNOWLEDGED',
                        acknowledged_at: changedAt,
                        resolved_at: null,
                    },
            });
            if (changed.count !== 1) return null;
            const updated = await tx.adminIncident.findUnique({ where: { id } });
            await tx.systemLog.create({
                data: {
                    level: 'INFO',
                    module: 'ADMIN_INCIDENT',
                    message: action === 'resolve' ? 'INCIDENT_RESOLVED' : 'INCIDENT_ACKNOWLEDGED',
                    metadata: JSON.stringify({
                        incident_id: id,
                        admin_id: authenticatedRequest.user?.id,
                        admin_email: authenticatedRequest.user?.email,
                    }),
                },
            });
            return updated;
        });

        if (!incident) {
            const exists = await prisma.adminIncident.findUnique({ where: { id }, select: { id: true } });
            return NextResponse.json({
                error: exists ? 'Status incydentu został już zmieniony.' : 'Incydent nie istnieje.',
            }, { status: exists ? 409 : 404 });
        }

        return NextResponse.json({ success: true, incident });
    });
}
