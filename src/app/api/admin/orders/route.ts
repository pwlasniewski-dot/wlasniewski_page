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
    standardPhotoCount?: number;
    standardSelectedPhotos?: Array<{ id: number; thumbnail_url: string | null; file_url: string }>;
    sizeSummary?: string[];
    orderItems?: Array<{
        kind: 'extra_photo' | 'product';
        title: string;
        quantity: number;
        unitAmount: number;
        totalAmount: number;
        sizeLabel?: string;
    }>;
    orderBreakdown?: {
        extraPhotoCount: number;
        extraPhotoUnitAmount: number;
        extraPhotoTotal: number;
        productsTotal: number;
    };
};

type GroupExtraPrintMetadata = {
    kind: 'group_extra_prints';
    print_size?: string;
    print_size_label?: string;
    unit_amount?: number;
    base_unit_amount?: number;
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

function parseProductIds(raw: string | null): number[] {
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            if (parsed.some((value) => typeof value === 'object' && value !== null)) {
                return [];
            }
            return parsed
                .map((value) => Number(value))
                .filter((value) => Number.isInteger(value) && value > 0);
        }
    } catch {
        // Keep fallback below for legacy comma-separated values.
    }

    return raw
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value) && value > 0);
}

function parseGroupExtraPrintMetadata(raw: string | null): GroupExtraPrintMetadata | null {
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (parsed && parsed.kind === 'group_extra_prints') {
            return {
                kind: 'group_extra_prints',
                print_size: typeof parsed.print_size === 'string' ? parsed.print_size : undefined,
                print_size_label: typeof parsed.print_size_label === 'string' ? parsed.print_size_label : undefined,
                unit_amount: typeof parsed.unit_amount === 'number' ? parsed.unit_amount : undefined,
                base_unit_amount: typeof parsed.base_unit_amount === 'number' ? parsed.base_unit_amount : undefined,
            };
        }
    } catch {
        // Ignore non-JSON payloads.
    }

    return null;
}

function extractSizeLabel(input: string): string | undefined {
    const match = input.match(/\b(\d{2,3})\s*[xX×]\s*(\d{2,3})\b/);
    if (!match) return undefined;
    return `${match[1]}x${match[2]}`;
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

        const participantSelections = participantIds.length
            ? await prisma.photoSelection.findMany({
                where: { participant_id: { in: participantIds } },
                select: {
                    participant_id: true,
                    photo_id: true,
                },
                orderBy: { selected_at: 'asc' },
            })
            : [];

        const standardPhotoIdsByParticipant = new Map<number, number[]>();
        participantSelections.forEach((selection) => {
            const current = standardPhotoIdsByParticipant.get(selection.participant_id) || [];
            if (!current.includes(selection.photo_id)) {
                standardPhotoIdsByParticipant.set(selection.participant_id, [...current, selection.photo_id]);
            }
        });

        const participantsById = new Map(participants.map((participant) => [participant.id, participant]));

        const allPhotoIds = Array.from(
            new Set([
                ...photoOrders.flatMap((order) => parsePhotoIds(order.photo_ids)),
                ...Array.from(standardPhotoIdsByParticipant.values()).flat(),
            ])
        );

        const allProductIds = Array.from(
            new Set(
                photoOrders.flatMap((order) => parseProductIds(order.product_ids || null))
            )
        );

        const [photos, products] = await Promise.all([
            allPhotoIds.length
                ? prisma.galleryPhoto.findMany({
                    where: { id: { in: allPhotoIds } },
                    select: {
                        id: true,
                        file_url: true,
                        thumbnail_url: true,
                    },
                })
                : Promise.resolve([]),
            allProductIds.length
                ? prisma.galleryProduct.findMany({
                    where: { id: { in: allProductIds } },
                    select: {
                        id: true,
                        title: true,
                        price: true,
                    },
                })
                : Promise.resolve([]),
        ]);

        const photosById = new Map(photos.map((photo) => [photo.id, photo]));
        const productsById = new Map(products.map((product) => [product.id, product]));

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
            const parsedProductIds = parseProductIds(order.product_ids || null);
            const groupExtraMetadata = parseGroupExtraPrintMetadata(order.product_ids || null);
            const selectedPhotos = parsedPhotoIds
                .map((id) => photosById.get(id))
                .filter((photo): photo is NonNullable<typeof photo> => Boolean(photo))
                .map((photo) => ({
                    id: photo.id,
                    thumbnail_url: photo.thumbnail_url,
                    file_url: photo.file_url,
                }));

            const standardPhotoIds = order.participant_id ? (standardPhotoIdsByParticipant.get(order.participant_id) || []) : [];
            const standardSelectedPhotos = standardPhotoIds
                .map((id) => photosById.get(id))
                .filter((photo): photo is NonNullable<typeof photo> => Boolean(photo))
                .map((photo) => ({
                    id: photo.id,
                    thumbnail_url: photo.thumbnail_url,
                    file_url: photo.file_url,
                }));

            const productItems = parsedProductIds
                .map((id) => productsById.get(id))
                .filter((product): product is NonNullable<typeof product> => Boolean(product))
                .map((product) => ({
                    kind: 'product' as const,
                    title: product.title,
                    quantity: 1,
                    unitAmount: product.price,
                    totalAmount: product.price,
                    sizeLabel: extractSizeLabel(product.title),
                }));

            const fallbackExtraPhotoUnitAmount = order.photo_count > 0
                ? Math.round((order.total_amount - productItems.reduce((sum, item) => sum + item.totalAmount, 0)) / order.photo_count)
                : 0;
            const extraPhotoUnitAmount = Math.max(0, groupExtraMetadata?.unit_amount || fallbackExtraPhotoUnitAmount);

            const extraPhotoTotal = Math.max(0, extraPhotoUnitAmount * order.photo_count);
            const extraPhotoSize = groupExtraMetadata?.print_size || undefined;

            const orderItems = [
                ...(order.photo_count > 0
                    ? [{
                        kind: 'extra_photo' as const,
                        title: 'Dodatkowe odbitki',
                        quantity: order.photo_count,
                        unitAmount: extraPhotoUnitAmount,
                        totalAmount: extraPhotoTotal,
                        sizeLabel: extraPhotoSize,
                    }]
                    : []),
                ...productItems,
            ];

            const sizeSummary = Array.from(
                new Set([
                    ...(extraPhotoSize ? [extraPhotoSize] : []),
                    ...productItems.map((item) => item.sizeLabel).filter((value): value is string => Boolean(value)),
                ])
            );

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
                standardPhotoCount: standardSelectedPhotos.length,
                standardSelectedPhotos,
                sizeSummary,
                orderItems,
                orderBreakdown: {
                    extraPhotoCount: order.photo_count,
                    extraPhotoUnitAmount,
                    extraPhotoTotal,
                    productsTotal: productItems.reduce((sum, item) => sum + item.totalAmount, 0),
                },
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
