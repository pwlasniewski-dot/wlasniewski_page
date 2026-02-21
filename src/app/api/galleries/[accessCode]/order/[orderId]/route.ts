import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// GET /api/galleries/[accessCode]/order/[orderId] — pobierz status zamówienia
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ accessCode: string; orderId: string }> }
) {
    try {
        const { accessCode, orderId } = await params;
        const orderIdInt = parseInt(orderId);

        const gallery = await prisma.clientGallery.findUnique({
            where: { access_code: accessCode },
            select: { id: true }
        });

        if (!gallery) return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });

        const order = await prisma.photoOrder.findFirst({
            where: { id: orderIdInt, gallery_id: gallery.id },
            select: {
                id: true,
                photo_count: true,
                total_amount: true,
                payment_status: true,
                paid_at: true,
                created_at: true,
            }
        });

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        return NextResponse.json({ success: true, order });
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
