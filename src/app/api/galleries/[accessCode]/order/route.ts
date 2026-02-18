// API Route: POST /api/galleries/[accessCode]/order
// Create an order for premium photos

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// Use standard import for library
import { createPayUOrder } from '@/lib/payu';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ accessCode: string }> }
) {
    try {
        const { accessCode } = await params;
        const body = await request.json();
        const { photo_ids = [], product_ids = [] } = body;

        if ((!photo_ids || photo_ids.length === 0) && (!product_ids || product_ids.length === 0)) {
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
            }
        });

        if (!gallery || !gallery.is_active) {
            return NextResponse.json(
                { success: false, error: 'Galeria niedostępna' },
                { status: 403 }
            );
        }

        // Verify premium photos
        const photos = await prisma.galleryPhoto.findMany({
            where: {
                id: { in: photo_ids },
                gallery_id: gallery.id,
                is_standard: false,
            }
        });

        if (photos.length !== photo_ids.length) {
            return NextResponse.json(
                { success: false, error: 'Niektóre zdjęcia nie są dostępne do zakupu' },
                { status: 400 }
            );
        }

        // Verify products
        const products = product_ids.length > 0 ? await prisma.galleryProduct.findMany({
            where: {
                id: { in: product_ids },
                // Ensure product belongs to this gallery OR is global (if we supported global products in future, but for now we enforced gallery_id in Admin)
                // Actually, schema allows null gallery_id. If we want to allow global products, we should check:
                // OR: [{ gallery_id: gallery.id }, { gallery_id: null }]
                // But for now let's stick to what we implemented in Admin (assigned to gallery)
                gallery_id: gallery.id
            }
        }) : [];

        if (products.length !== product_ids.length) {
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
        const order = await prisma.photoOrder.create({
            data: {
                gallery_id: gallery.id,
                photo_ids: JSON.stringify(photo_ids),
                product_ids: JSON.stringify(product_ids),
                photo_count,
                total_amount,
                payment_status: 'pending',
            }
        });

        // Integrate with PayU
        let paymentUrl = '';
        let paymentId = '';

        try {
            const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
            const continueUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/galeria/${accessCode}/order/${order.id}/success`;

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
                    payment_url: paymentUrl
                }
            });

        } catch (payuError) {
            console.error('PayU Error:', payuError);
            // Don't fail the request, but return order detail with failure note
            return NextResponse.json({
                success: true, // Order created but payment failed init
                order: {
                    id: order.id,
                    photo_count: order.photo_count,
                    total_amount: order.total_amount,
                    payment_status: 'failed_init',
                },
                message: 'Zamówienie utworzone, ale błąd inicjalizacji płatności (PayU).'
            });
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
