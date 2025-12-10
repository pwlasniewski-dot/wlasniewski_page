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
        const { photo_ids } = body;

        if (!photo_ids || !Array.isArray(photo_ids) || photo_ids.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Brak wybranych zdjęć' },
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

        // Verify all photos exist and are premium
        const photos = await prisma.galleryPhoto.findMany({
            where: {
                id: { in: photo_ids },
                gallery_id: gallery.id,
                is_standard: false, // Only premium photos can be ordered
            }
        });

        if (photos.length !== photo_ids.length) {
            return NextResponse.json(
                { success: false, error: 'Niektóre zdjęcia nie są dostępne do zakupu' },
                { status: 400 }
            );
        }

        // Calculate total
        const photo_count = photos.length;
        const total_amount = photo_count * gallery.price_per_premium;

        // Create order in database first
        const order = await prisma.photoOrder.create({
            data: {
                gallery_id: gallery.id,
                photo_ids: JSON.stringify(photo_ids),
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

            const payuResponse = await createPayUOrder({
                description: `Zdjęcia premium - Galeria ${gallery.client_name}`,
                currencyCode: 'PLN',
                totalAmount: total_amount, // Already in grosze (cents)
                extOrderId: `GALLERY_${order.id}_${Date.now()}`,
                buyer: {
                    email: gallery.client_email,
                    firstName: gallery.client_name.split(' ')[0] || 'Klient',
                    lastName: gallery.client_name.split(' ')[1] || 'Unknown',
                    language: 'pl'
                },
                products: [
                    {
                        name: 'Zdjęcia Premium',
                        unitPrice: gallery.price_per_premium,
                        quantity: photo_count
                    }
                ],
                redirectUri: continueUrl
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
