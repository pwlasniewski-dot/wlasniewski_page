// API Route: POST /api/galleries/[accessCode]/order
// Create an order for premium photos

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// Use standard import for library
import { createPayUOrder, extractClientIpv4 } from '@/lib/payu';
import { authorizeIndividualGallery, galleryAccessDenied } from '@/lib/galleries/individual-access';
import { galleryCartFingerprint } from '@/lib/galleries/order-idempotency';

function existingOrderResponse(order: {
    id: number;
    gallery_id: number;
    photo_count: number;
    total_amount: number;
    payment_status: string;
    payment_url: string | null;
}) {
    if (order.payment_status === 'paid') {
        return NextResponse.json({ success: true, idempotent: true, alreadyPaid: true, order });
    }
    if (order.payment_status === 'pending' && order.payment_url) {
        return NextResponse.json({ success: true, idempotent: true, order, paymentUrl: order.payment_url });
    }
    const retryable = order.payment_status === 'failed_init';
    return NextResponse.json({
        success: false,
        idempotent: true,
        processing: !retryable,
        retryable,
        error: retryable
            ? 'Poprzednia inicjalizacja płatności nie powiodła się. Spróbuj ponownie.'
            : 'Płatność jest przygotowywana. Odczekaj chwilę i ponów sprawdzenie.',
        order,
    }, { status: retryable ? 409 : 202 });
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ accessCode: string }> }
) {
    try {
        const { accessCode } = await params;
        const idempotencyKey = request.headers.get('idempotency-key')?.trim() || '';
        if (!/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)) {
            return NextResponse.json({ success: false, error: 'Brak poprawnego klucza idempotencji zamówienia' }, { status: 400 });
        }
        const body = await request.json();
        const photoIds = Array.from(new Set(
            (Array.isArray(body.photo_ids) ? body.photo_ids : [])
                .map(Number)
                .filter((id: number) => Number.isInteger(id) && id > 0)
        )) as number[];
        const productIds = Array.from(new Set(
            (Array.isArray(body.product_ids) ? body.product_ids : [])
                .map(Number)
                .filter((id: number) => Number.isInteger(id) && id > 0)
        )) as number[];

        if (photoIds.length === 0 && productIds.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Brak wybranych zdjęć lub produktów' },
                { status: 400 }
            );
        }

        // Find gallery
        const gallery = await prisma.clientGallery.findUnique({
            where: { access_code: accessCode },
            select: {
                id: true,
                is_active: true,
                expires_at: true,
                price_per_premium: true,
                client_name: true,
                client_email: true,
                access_code: true,
                gallery_mode: true,
                client_id: true,
                group_password: true,
            }
        });

        if (!gallery || !gallery.is_active) {
            return NextResponse.json(
                { success: false, error: 'Galeria niedostępna' },
                { status: 403 }
            );
        }

        if (gallery.expires_at && gallery.expires_at < new Date()) {
            return NextResponse.json({ success: false, error: 'Galeria wygasła' }, { status: 403 });
        }

        const access = await authorizeIndividualGallery(request, gallery);
        if (!access.allowed) return galleryAccessDenied(access);
        const checkoutFingerprint = galleryCartFingerprint({ galleryId: gallery.id, photoIds, productIds });

        const existingOrder = await prisma.photoOrder.findUnique({
            where: { idempotency_key: idempotencyKey },
            select: {
                id: true, gallery_id: true, photo_count: true, total_amount: true,
                payment_status: true, payment_url: true, checkout_fingerprint: true,
            },
        });
        if (existingOrder) {
            if (existingOrder.gallery_id !== gallery.id || existingOrder.checkout_fingerprint !== checkoutFingerprint) {
                return NextResponse.json({ success: false, error: 'Nieprawidłowy klucz operacji' }, { status: 409 });
            }
            return existingOrderResponse(existingOrder);
        }

        const paidOrders = await prisma.photoOrder.findMany({
            where: { gallery_id: gallery.id, payment_status: 'paid' },
            select: { photo_ids: true },
        });
        const alreadyPurchased = new Set<number>();
        for (const paidOrder of paidOrders) {
            try {
                const ids = JSON.parse(paidOrder.photo_ids);
                if (Array.isArray(ids)) ids.forEach(id => alreadyPurchased.add(Number(id)));
            } catch {}
        }
        if (photoIds.some(id => alreadyPurchased.has(id))) {
            return NextResponse.json(
                { success: false, error: 'Co najmniej jedno zdjęcie zostało już opłacone.' },
                { status: 409 },
            );
        }

        // Verify premium photos
        const photos = await prisma.galleryPhoto.findMany({
            where: {
                id: { in: photoIds },
                gallery_id: gallery.id,
                is_standard: false,
            }
        });

        if (photos.length !== photoIds.length) {
            return NextResponse.json(
                { success: false, error: 'Niektóre zdjęcia nie są dostępne do zakupu' },
                { status: 400 }
            );
        }

        // Verify products
        const products = productIds.length > 0 ? await prisma.galleryProduct.findMany({
            where: {
                id: { in: productIds },
                // Ensure product belongs to this gallery OR is global (if we supported global products in future, but for now we enforced gallery_id in Admin)
                // Actually, schema allows null gallery_id. If we want to allow global products, we should check:
                // OR: [{ gallery_id: gallery.id }, { gallery_id: null }]
                // But for now let's stick to what we implemented in Admin (assigned to gallery)
                gallery_id: gallery.id,
                is_active: true,
            }
        }) : [];

        if (products.length !== productIds.length) {
            return NextResponse.json(
                { success: false, error: 'Niektóre produkty nie są dostępne' },
                { status: 400 }
            );
        }

        // Calculate total
        const photo_count = photos.length;
        const photos_total = photo_count * gallery.price_per_premium;
        const products_total = products.reduce((acc: number, curr: { price: number }) => acc + curr.price, 0);
        const total_amount = photos_total + products_total;

        // Create order in database first
        let order;
        try {
            order = await prisma.photoOrder.create({
                data: {
                    gallery_id: gallery.id,
                    photo_ids: JSON.stringify(photoIds),
                    product_ids: JSON.stringify(productIds),
                    photo_count,
                    total_amount,
                    payment_status: 'initializing',
                    idempotency_key: idempotencyKey,
                    checkout_fingerprint: checkoutFingerprint,
                }
            });
        } catch (error: any) {
            if (error?.code !== 'P2002') throw error;
            const racedOrder = await prisma.photoOrder.findUnique({ where: { idempotency_key: idempotencyKey } });
            if (!racedOrder || racedOrder.gallery_id !== gallery.id
                || racedOrder.checkout_fingerprint !== checkoutFingerprint) throw error;
            return existingOrderResponse(racedOrder);
        }

        // Integrate with PayU
        let paymentUrl = '';
        let paymentId = '';

        try {
            const ip = extractClientIpv4(
                request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
            );
            const requestOrigin = new URL(request.url).origin;
            const continueUrl = `${requestOrigin}/galeria/${accessCode}/order/${order.id}/success`;

            const payuProducts = [];
            if (photo_count > 0) {
                payuProducts.push({
                    name: 'Zdjęcia Premium',
                    unitPrice: gallery.price_per_premium,
                    quantity: photo_count
                });
            }
            products.forEach((p: { title: string; price: number }) => {
                payuProducts.push({
                    name: p.title,
                    unitPrice: p.price,
                    quantity: 1
                });
            });

            const payuResponse = await createPayUOrder({
                description: `Zamówienie - Galeria ${gallery.client_name}`,
                currencyCode: 'PLN',
                totalAmount: total_amount, // Already in grosze (cents)
                extOrderId: `GALLERY_${order.id}_${Date.now()}`,
                buyer: {
                    email: gallery.client_email,
                    firstName: gallery.client_name.split(' ')[0] || 'Klient',
                    lastName: gallery.client_name.split(' ')[1] || 'Unknown',
                    language: 'pl'
                },
                products: payuProducts,
                continueUrl: continueUrl
            }, ip);

            paymentUrl = payuResponse.redirectUri;
            paymentId = payuResponse.orderId;

            // Update order with PayU details
            await prisma.photoOrder.update({
                where: { id: order.id },
                data: {
                    payment_id: paymentId,
                    payment_url: paymentUrl,
                    payment_status: 'pending',
                }
            });

        } catch (payuError) {
            console.error('PayU Error:', payuError);
            await prisma.photoOrder.update({
                where: { id: order.id },
                data: { payment_status: 'failed_init' },
            });
            return NextResponse.json({
                success: false,
                error: 'Nie udało się zainicjować płatności PayU.',
                order: {
                    id: order.id,
                    photo_count: order.photo_count,
                    total_amount: order.total_amount,
                    payment_status: 'failed_init',
                },
                message: 'Zamówienie utworzone, ale błąd inicjalizacji płatności (PayU).'
            }, { status: 502 });
        }

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                photo_count: order.photo_count,
                total_amount: order.total_amount,
                payment_status: order.payment_status,
                payment_url: paymentUrl
            },
            paymentUrl // Return top level for easier access
        });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json(
            { success: false, error: 'Nie udało się utworzyć zamówienia' },
            { status: 500 }
        );
    }
}
