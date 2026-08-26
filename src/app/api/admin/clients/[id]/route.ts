import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { logSystem } from '@/lib/logger';
import { normalizeEmail } from '@/lib/crm/delivery';
import { randomUUID } from 'node:crypto';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';
import { jsonWithCorrelation } from '@/lib/http/correlation';

export const dynamic = 'force-dynamic';

type SessionPlan = {
    date: string | null;
    time: string | null;
    location: string | null;
};

function parsePermissions(input: unknown): Record<string, unknown> {
    if (!input) return {};
    if (typeof input === 'string') {
        try {
            const parsed = JSON.parse(input);
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch {
            return {};
        }
    }
    if (typeof input === 'object' && !Array.isArray(input)) {
        return input as Record<string, unknown>;
    }
    return {};
}

function extractSessionPlan(permissions: unknown): SessionPlan {
    const parsed = parsePermissions(permissions);
    const raw = parsed.session_plan;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return { date: null, time: null, location: null };
    }
    const session = raw as Record<string, unknown>;
    return {
        date: typeof session.date === 'string' && session.date.trim() ? session.date : null,
        time: typeof session.time === 'string' && session.time.trim() ? session.time : null,
        location: typeof session.location === 'string' && session.location.trim() ? session.location : null,
    };
}

function mergeSessionPlan(permissions: unknown, next: Partial<SessionPlan>): Record<string, unknown> {
    const parsed = parsePermissions(permissions);
    const current = extractSessionPlan(permissions);
    const merged: SessionPlan = {
        date: next.date !== undefined ? (next.date || null) : current.date,
        time: next.time !== undefined ? (next.time || null) : current.time,
        location: next.location !== undefined ? (next.location || null) : current.location,
    };

    return {
        ...parsed,
        session_plan: merged,
    };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return withAuth(request, async (req) => {
        const correlationId = randomUUID();
        try {
            const userId = parseInt(id);

            // 1. Fetch the base client (no relations)
            const client = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!client) {
                return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
            }

            const clientEmail = client.email;

            // 2. Fetch all related data independently
            const [
                orders,
                bookings,
                galleriesById,
                galleriesByEmail,
                assignedGalleries,
                basket,
                offersById,
                offersByEmail,
                contracts,
                latestLoginActivity
            ] = await Promise.all([
                prisma.giftCardOrder.findMany({
                    where: { user_id: userId },
                    orderBy: { created_at: 'desc' },
                    include: { gift_card: true }
                }),
                prisma.booking.findMany({
                    where: { email: clientEmail },
                    orderBy: { date: 'desc' }
                }),
                prisma.clientGallery.findMany({
                    where: { client_id: userId },
                    orderBy: { created_at: 'desc' },
                    include: { photos: { take: 1 } }
                }),
                prisma.clientGallery.findMany({
                    where: {
                        client_email: clientEmail,
                        client_id: null // Only those not already linked strictly to THIS ID to avoid obvious overlap, though we deduplicate anyway
                    },
                    orderBy: { created_at: 'desc' },
                    include: { photos: { take: 1 } }
                }),
                prisma.clientGallery.findMany({
                    where: { photographer_id: userId }, // "assigned" context
                    orderBy: { created_at: 'desc' },
                    include: { photos: { take: 1 } }
                }),
                prisma.basket.findFirst({
                    where: { user_id: userId },
                    include: { items: true },
                    orderBy: { updated_at: 'desc' }
                }),
                prisma.offer.findMany({
                    where: { client_id: userId },
                    orderBy: { created_at: 'desc' },
                    include: { sections: { include: { items: true } } }
                }),
                prisma.offer.findMany({
                    where: {
                        client_email: clientEmail,
                        client_id: null
                    },
                    orderBy: { created_at: 'desc' },
                    include: { sections: { include: { items: true } } }
                }),
                prisma.contract.findMany({
                    where: {
                        OR: [
                            { client_id: userId },
                            { user: { email: clientEmail } }
                        ]
                    },
                    orderBy: { created_at: 'desc' },
                    include: { offer: true }
                }),
                prisma.crmActivity.findFirst({
                    where: {
                        action: 'login',
                        OR: [
                            { client_id: userId },
                            { client_email: clientEmail }
                        ]
                    },
                    orderBy: { created_at: 'desc' },
                    select: { created_at: true }
                })
            ]);

            // Foto Wyzwania powi\u0105zane z klientem (jako zaproszony LUB zapraszaj\u0105cy po emailu)
            const challenges = await prisma.photoChallenge.findMany({
                where: {
                    OR: [
                        { invitee_user_id: userId },
                        { invitee_contact: clientEmail },
                        { inviter_contact: clientEmail },
                        { inviter_email: clientEmail },
                    ],
                },
                orderBy: { created_at: 'desc' },
                include: {
                    package: { select: { name: true, base_price: true, challenge_price: true } },
                    location: { select: { name: true } },
                    gallery: { select: { id: true, is_published: true } },
                    invitee_user: { select: { id: true, name: true, email: true } },
                    inviter_user: { select: { id: true, name: true, email: true } },
                    timeline: {
                        select: { id: true, event_type: true, event_description: true, metadata: true, created_at: true },
                        orderBy: { created_at: 'desc' },
                        take: 30,
                    },
                },
            });

            // Deduplicate offers (by ID + by Email)
            const allOffers = [...offersById, ...offersByEmail]
                .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

            // Deduplicate galleries
            const allGalleries = [...galleriesById, ...galleriesByEmail]
                .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

            const fullClient = {
                ...client,
                permissions: parsePermissions(client.permissions),
                session_plan: extractSessionPlan(client.permissions),
                last_login: client.last_login || latestLoginActivity?.created_at || null,
                orders,
                assigned_bookings: bookings,
                client_galleries: allGalleries,
                assigned_galleries: assignedGalleries,
                baskets: basket ? [basket] : [],
                offers: allOffers,
                contracts,
                challenges,
            };

            return jsonWithCorrelation({ success: true, client: fullClient }, correlationId);
        } catch (error: any) {
            console.error('Fetch client details error:', error);
            await logSystem('ERROR', 'SYSTEM', `Failed to fetch client detail for ${id}`, { error: error.message, stack: error.stack });
            await recordAdminIncidentSafely({
                severity: 'P1', category: 'ADMIN_PROFILE', reasonCode: 'ADMIN_CLIENT_PROFILE_LOAD_FAILED',
                summary: 'Nie udało się pobrać pełnego profilu klienta w panelu administratora',
                clientId: Number.isInteger(Number(id)) ? Number(id) : null,
                entityType: 'client', entityId: Number.isInteger(Number(id)) ? Number(id) : null,
                correlationId, details: { error: error instanceof Error ? error.message : String(error) },
            });
            return jsonWithCorrelation({ error: 'Nie udało się pobrać pełnych danych klienta', correlation_id: correlationId }, correlationId, 500);
        }
    });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return withAuth(request, async (req) => {
        try {
            const userId = parseInt(id);
            const body = await req.json();

            // --- Permissions-only update ---
            if (body.permissions !== undefined) {
                if (typeof body.permissions !== 'object' || Array.isArray(body.permissions)) {
                    return NextResponse.json({ error: 'Invalid permissions object' }, { status: 400 });
                }
                const current = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { permissions: true },
                });
                const mergedPermissions = {
                    ...parsePermissions(current?.permissions),
                    ...body.permissions,
                };
                const withSession = mergeSessionPlan(mergedPermissions, {});
                await prisma.$executeRaw`
                    UPDATE users SET permissions = ${JSON.stringify(withSession)}::jsonb WHERE id = ${userId}
                `;
                await logSystem('INFO', 'SYSTEM', `Updated permissions for client #${userId}`, { permissions: body.permissions });
                return NextResponse.json({ success: true, permissions: body.permissions });
            }

            // --- Warsztaty: włączanie/wyłączanie ---
            if (body.workshops_enabled !== undefined) {
                const updated = await prisma.user.update({
                    where: { id: userId },
                    data: { workshops_enabled: !!body.workshops_enabled },
                });
                await logSystem('INFO', 'SYSTEM', `Updated workshops_enabled for client #${userId}`, { workshops_enabled: !!body.workshops_enabled });
                return NextResponse.json({ success: true, workshops_enabled: updated.workshops_enabled });
            }

            // --- Profile update ---
            const currentUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { email: true, permissions: true }
            });

            if (!currentUser) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            const normalizedEmail = body.email !== undefined ? normalizeEmail(body.email) : currentUser.email;
            if (!normalizedEmail) {
                return NextResponse.json({ error: 'Email is required' }, { status: 400 });
            }
            const emailChanged = normalizedEmail !== normalizeEmail(currentUser.email);
            const sessionPlanPayload = body.session_plan && typeof body.session_plan === 'object'
                ? {
                    date: typeof body.session_plan.date === 'string' ? body.session_plan.date : null,
                    time: typeof body.session_plan.time === 'string' ? body.session_plan.time : null,
                    location: typeof body.session_plan.location === 'string' ? body.session_plan.location : null,
                }
                : null;

            const nextPermissions = sessionPlanPayload
                ? mergeSessionPlan(currentUser.permissions, {
                    date: sessionPlanPayload.date,
                    time: sessionPlanPayload.time,
                    location: sessionPlanPayload.location,
                })
                : undefined;

            const updatedClient = await prisma.$transaction(async (tx) => {
                const updated = await tx.user.update({
                    where: { id: userId },
                    data: {
                        name: body.name,
                        email: normalizedEmail,
                        phone: body.phone,
                        address: body.address,
                        city: body.city,
                        postal_code: body.postal_code,
                        is_active: body.is_active,
                        ...(nextPermissions ? { permissions: nextPermissions } : {}),
                    }
                });

                if (emailChanged) {
                    console.log(`[CRM] Email changed from ${currentUser.email} to ${normalizedEmail}. Syncing records...`);
                    await tx.offer.updateMany({ where: { client_id: userId }, data: { client_email: normalizedEmail } });
                    await tx.clientGallery.updateMany({ where: { client_id: userId }, data: { client_email: normalizedEmail } });
                }

                return updated;
            });

            return NextResponse.json({ success: true, client: updatedClient });
        } catch (error) {
            console.error('Update client error:', error);
            return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
        }
    });
}
