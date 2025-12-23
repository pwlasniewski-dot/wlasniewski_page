// API Route: GET /api/galleries/[accessCode]/order/[orderId]
// Check order status

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ accessCode: string; orderId: string }> }
) {
    try {
        const { accessCode, orderId } = await params;

        // Verify gallery access
        const gallery = await prisma.clientGallery.findUnique({
            where: { access_code: accessCode }
        });

        if (!gallery) {
            return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
        }

        const order = await prisma.photoOrder.findUnique({
            where: { id: Number(orderId) }
        });

        if (!order || order.gallery_id !== gallery.id) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // If paid, return photo details
        let photos: any[] = [];
        if (order.payment_status === 'paid') {
            const photoIds = JSON.parse(order.photo_ids) as number[];
            photos = await prisma.galleryPhoto.findMany({
                where: { id: { in: photoIds } },
                select: {
                    id: true,
                    thumbnail_url: true,
                    file_size: true,
                    width: true,
                    height: true
                }
            });
        }

        return NextResponse.json({
            success: true,
            order: {
                id: order.id,
                status: order.payment_status,
                total_amount: order.total_amount,
                paid_at: order.paid_at,
            },
            photos
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
