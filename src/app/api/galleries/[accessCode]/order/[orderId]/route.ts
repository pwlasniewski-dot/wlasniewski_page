import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { authorizeIndividualGallery, galleryAccessDenied } from '@/lib/galleries/individual-access';

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
            select: {
                id: true, is_active: true, expires_at: true, access_code: true,
                gallery_mode: true, client_id: true, client_email: true, group_password: true,
            }
        });

        if (!gallery || !gallery.is_active || (gallery.expires_at && gallery.expires_at < new Date())) {
            return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
        }
        const access = await authorizeIndividualGallery(request, gallery);
        if (!access.allowed) return galleryAccessDenied(access);

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
