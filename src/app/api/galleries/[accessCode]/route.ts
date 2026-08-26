// API Route: GET /api/galleries/[accessCode]
// Also handles: DELETE /api/galleries/[id] (numeric ID or access code)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { logCrmActivity } from '@/lib/crm-activity';
import { attachIndividualGallerySession, authorizeIndividualGallery, galleryAccessDenied } from '@/lib/galleries/individual-access';
import { beginClientOperation, clientJson, clientOperationTotalMs, recordSlowClientOperation } from '@/lib/client-operations';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ accessCode: string }> }
) {
    const operation = beginClientOperation();
    let incidentGalleryId: number | null = null;
    let incidentClientId: number | null = null;
    let incidentClientEmail: string | null = null;
    try {
        const { accessCode } = await params;

        // Authenticate and validate the lightweight gallery record before loading
        // photo URLs, products or payment state.
        const gallery = await prisma.clientGallery.findUnique({
            where: { access_code: accessCode },
        });

        if (!gallery) {
            return clientJson(
                { success: false, error: 'Galeria nie znaleziona' },
                { status: 404, correlationId: operation.correlationId }
            );
        }
        incidentGalleryId = gallery.id;
        incidentClientId = gallery.client_id;
        incidentClientEmail = gallery.client_email;

        if (gallery.gallery_mode === 'GROUP') {
            return clientJson({
                success: false,
                code: 'GROUP_AUTH_REQUIRED',
                error: 'Ta galeria wymaga logowania uczestnika.',
            }, { status: 401, correlationId: operation.correlationId });
        }
        const access = await authorizeIndividualGallery(request, gallery);
        if (access && !access.allowed) {
            if (!(gallery.group_password || '').trim()) {
                return clientJson({
                    success: false,
                    code: 'OWNER_ONLY',
                    error: 'Ta galeria jest prywatna. Właściciel musi wejść po zalogowaniu.',
                }, { status: 403, correlationId: operation.correlationId });
            }
            const denied = galleryAccessDenied(access);
            const deniedBody = await denied.json();
            return clientJson({ ...deniedBody, code: 'PASSWORD_REQUIRED' }, { status: 401, correlationId: operation.correlationId });
        }

        // Check if gallery is active
        if (!gallery.is_active) {
            return clientJson(
                { success: false, error: 'Galeria jest nieaktywna' },
                { status: 403, correlationId: operation.correlationId }
            );
        }

        // Check if expired
        if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
            return clientJson(
                { success: false, error: 'Galeria wygasła' },
                { status: 403, correlationId: operation.correlationId }
            );
        }

        const [photos, products] = await Promise.all([
            prisma.galleryPhoto.findMany({
                where: { gallery_id: gallery.id },
                orderBy: { order_index: 'asc' },
                select: {
                    id: true, file_url: true, thumbnail_url: true, is_standard: true,
                    file_size: true, width: true, height: true, order_index: true,
                },
            }),
            prisma.galleryProduct.findMany({ where: { gallery_id: gallery.id, is_active: true } }),
        ]);

        // Separate standard and premium photos
        const standard_photos = photos.filter(p => p.is_standard);
        const premium_photos = photos.filter(p => !p.is_standard);

        // Get paid premium photo IDs
        const paidOrders = await prisma.photoOrder.findMany({
            where: {
                gallery_id: gallery.id,
                payment_status: 'paid'
            },
            select: { photo_ids: true }
        });

        const paidPhotoIds = new Set<number>();
        paidOrders.forEach(order => {
            try {
                const ids = JSON.parse(order.photo_ids) as number[];
                ids.forEach(id => paidPhotoIds.add(id));
            } catch (e) { }
        });

        // Debug logging for GROUP galleries
        if (gallery.gallery_mode === 'GROUP') {
            console.log(`[DEBUG GROUP GALLERY] ${gallery.access_code}:`, {
                max_photos_for_print: gallery.max_photos_for_print,
                premium_photos_count: premium_photos.length,
                paid_photo_ids: Array.from(paidPhotoIds),
            });
        }

        // Avoid spamming CRM activity on page refreshes: log at most once per 10 minutes per gallery/client.
        if (gallery.client_id || gallery.client_email) {
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
            const viewerIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                || request.headers.get('x-real-ip')
                || request.headers.get('cf-connecting-ip')
                || 'unknown';
            const identityWhere = gallery.client_id
                ? { client_id: gallery.client_id }
                : { client_email: gallery.client_email };

            const recentView = await prisma.crmActivity.findFirst({
                where: {
                    action: 'gallery_viewed',
                    entity_type: 'gallery',
                    entity_id: gallery.id,
                    ip_address: viewerIp,
                    ...identityWhere,
                    created_at: {
                        gte: tenMinutesAgo,
                    },
                },
                select: { id: true },
            });

            if (!recentView) {
                await logCrmActivity({
                    clientId: gallery.client_id,
                    clientEmail: gallery.client_email,
                    action: 'gallery_viewed',
                    entityType: 'gallery',
                    entityId: gallery.id,
                    details: {
                        client_name: gallery.client_name,
                        access_code: gallery.access_code,
                        correlation_id: operation.correlationId,
                        total_ms: clientOperationTotalMs(operation.startedAt),
                        outcome: 'opened',
                    },
                    request,
                });
            }
        }

        await recordSlowClientOperation({
            operation: 'gallery_open', startedAt: operation.startedAt, correlationId: operation.correlationId,
            clientId: gallery.client_id, clientEmail: gallery.client_email,
            entityType: 'gallery', entityId: gallery.id, outcome: 'opened',
        });
        const response = clientJson({
            success: true,
            gallery: {
                id: gallery.id,
                client_name: gallery.client_name,
                gallery_mode: gallery.gallery_mode,
                description: gallery.description,
                standard_count: gallery.standard_count,
                max_photos_for_print: gallery.max_photos_for_print,
                price_per_premium: gallery.price_per_premium,
                show_extra_photo_price_when_empty: gallery.allow_extra_photo_purchase,
                external_download_url: gallery.external_download_url,
                expires_at: gallery.expires_at,
                event_video_url: gallery.event_video_enabled ? gallery.event_video_url : null,
                event_video_title: gallery.event_video_enabled ? gallery.event_video_title : null,
                event_video_description: gallery.event_video_enabled ? gallery.event_video_description : null,
                standard_photos,
                premium_photos,
                paid_photo_ids: Array.from(paidPhotoIds),
                products,
            }
        }, { correlationId: operation.correlationId });
        if (access?.allowed) {
            await attachIndividualGallerySession(response, gallery, access);
        }
        return response;
    } catch (error) {
        console.error('Error fetching gallery:', { correlationId: operation.correlationId, error });
        await recordAdminIncidentSafely({
            severity: 'P1', category: 'GALLERY', reasonCode: 'GALLERY_OPEN_FAILED',
            summary: 'Nie udało się otworzyć galerii klienta', clientId: incidentClientId,
            clientEmail: incidentClientEmail, entityType: 'gallery', entityId: incidentGalleryId,
            correlationId: operation.correlationId,
            details: { error: error instanceof Error ? error.message : String(error) },
        });
        return clientJson(
            { success: false, error: 'Nie udało się pobrać galerii' },
            { status: 500, correlationId: operation.correlationId }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ accessCode: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { accessCode } = await params;

            // Support both numeric ID and access code
            const numericId = parseInt(accessCode);
            const where = !isNaN(numericId)
                ? { id: numericId }
                : { access_code: accessCode };

            const gallery = await prisma.clientGallery.findUnique({
                where,
                select: { id: true }
            });

            if (!gallery) {
                return NextResponse.json({ error: 'Galeria nie istnieje' }, { status: 404 });
            }

            await prisma.galleryPhoto.deleteMany({ where: { gallery_id: gallery.id } });
            await prisma.clientGallery.delete({ where: { id: gallery.id } });

            return NextResponse.json({ success: true, message: 'Galeria usunięta' });
        } catch (error) {
            console.error('Error deleting gallery:', error);
            return NextResponse.json({ error: 'Błąd usuwania galerii' }, { status: 500 });
        }
    });
}
