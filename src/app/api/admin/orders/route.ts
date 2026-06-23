import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

type UnifiedOrder = {
    type: 'gift_card' | 'gallery_photo';
    rawId: number;
    id: string;
    customerEmail: string;
    customerName: string;
    recipientName?: string;
    recipientEmail?: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: Date;
    paymentMethod?: string;
    paymentRef?: string;
    giftCardCode?: string;
    giftCardValue?: number;
    galleryId?: number;
    galleryName?: string;
    groupAccessCode?: string | null;
    participantId?: number | null;
    participantName?: string | null;
    participantEmail?: string | null;
    participantIdentifier?: string | null;
    photoCount?: number;
    photoIds?: number[];
    selectedPhotos?: Array<{ id: number; thumbnail_url: string | null; file_url: string }>;
};

function parsePhotoIds(raw: string): number[] {
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed
                .map((value) => Number(value))
                .filter((value) => Number.isInteger(value) && value > 0);
        }
    } catch {
        // Keep legacy fallback below.
    }

    return raw
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value) && value > 0);
}

export async function GET(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (auth instanceof NextResponse) return auth;

        const [giftCardOrders, photoOrders] = await Promise.all([
            prisma.giftCardOrder.findMany({
                orderBy: { created_at: 'desc' },
                include: {
                    gift_card: {
                        select: {
                            code: true,
                            value: true,
                        },
                    },
                },
            }),
            prisma.photoOrder.findMany({
                orderBy: { created_at: 'desc' },
                include: {
                    gallery: {
                        select: {
                            id: true,
                            client_name: true,
                            group_access_code: true,
                            client_email: true,
                        },
                    },
                },
            }),
        ]);

        const participantIds = Array.from(
            new Set(
                photoOrders
                    .map((order) => order.participant_id)
                    .filter((value): value is number => typeof value === 'number')
            )
        );

        const participants = participantIds.length
            ? await prisma.galleryParticipant.findMany({
                where: { id: { in: participantIds } },
                select: {
                    id: true,
                    parent_name: true,
                    parent_email: true,
                    parent_identifier: true,
                },
            })
            : [];

        const participantsById = new Map(participants.map((participant) => [participant.id, participant]));

        const allPhotoIds = Array.from(
            new Set(photoOrders.flatMap((order) => parsePhotoIds(order.photo_ids)))
        );

        const photos = allPhotoIds.length
            ? await prisma.galleryPhoto.findMany({
                where: { id: { in: allPhotoIds } },
                select: {
                    id: true,
                    file_url: true,
                    thumbnail_url: true,
                },
            })
            : [];

        const photosById = new Map(photos.map((photo) => [photo.id, photo]));

        const giftOrdersMapped: UnifiedOrder[] = giftCardOrders.map((order) => ({
            type: 'gift_card',
            rawId: order.id,
            id: `GC-${order.id}`,
            customerEmail: order.customer_email,
            customerName: order.customer_name,
            recipientName: order.recipient_name || undefined,
            recipientEmail: order.recipient_email || undefined,
            amount: order.amount_paid,
            currency: order.currency || 'PLN',
            status: order.payment_status,
            createdAt: order.created_at,
            paymentMethod: order.payment_method || undefined,
            paymentRef: order.payu_order_id || order.stripe_session_id || undefined,
            giftCardCode: order.gift_card?.code || undefined,
            giftCardValue: order.gift_card?.value || undefined,
        }));

        const photoOrdersMapped: UnifiedOrder[] = photoOrders.map((order) => {
            const parsedPhotoIds = parsePhotoIds(order.photo_ids);
            const selectedPhotos = parsedPhotoIds
                .map((id) => photosById.get(id))
                .filter((photo): photo is NonNullable<typeof photo> => Boolean(photo))
                .map((photo) => ({
                    id: photo.id,
                    thumbnail_url: photo.thumbnail_url,
                    file_url: photo.file_url,
                }));

            const participant = order.participant_id ? participantsById.get(order.participant_id) : null;

            return {
                type: 'gallery_photo',
                rawId: order.id,
                id: `GL-${order.id}`,
                customerEmail: participant?.parent_email || order.gallery.client_email,
                customerName: participant?.parent_name || participant?.parent_identifier || order.gallery.client_name,
                amount: order.total_amount,
                currency: 'PLN',
                status: order.payment_status,
                createdAt: order.created_at,
                paymentMethod: 'payu',
                paymentRef: order.payment_id || undefined,
                galleryId: order.gallery.id,
                galleryName: order.gallery.client_name,
                groupAccessCode: order.gallery.group_access_code,
                participantId: order.participant_id,
                participantName: participant?.parent_name,
                participantEmail: participant?.parent_email,
                participantIdentifier: participant?.parent_identifier,
                photoCount: order.photo_count,
                photoIds: parsedPhotoIds,
                selectedPhotos,
            };
        });

        const orders = [...giftOrdersMapped, ...photoOrdersMapped].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return NextResponse.json({ success: true, orders });
    } catch (error) {
        console.error('Error fetching unified admin orders:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
    }
}
