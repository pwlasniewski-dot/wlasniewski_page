// API Route: GET/POST /api/admin/galleries/[id]
// Admin endpoints for managing a specific gallery

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// GET - Fetch gallery details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { id } = await params;
            const galleryId = Number(id);

            const gallery = await prisma.clientGallery.findUnique({
                where: { id: galleryId },
                include: {
                    photos: {
                        orderBy: { order_index: 'asc' }
                    },
                    orders: {
                        orderBy: { created_at: 'desc' }
                    }
                },
            });

            if (!gallery) {
                return NextResponse.json(
                    { success: false, error: 'Galeria nie znaleziona' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                gallery,
            });
        } catch (error) {
            console.error('Error fetching gallery:', error);
            return NextResponse.json(
                { success: false, error: 'Nie udało się pobrać galerii' },
                { status: 500 }
            );
        }
    });
}

// PUT - Update gallery settings
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { id } = await params;
            const galleryId = Number(id);
            const body = await request.json();

            const { standard_count, price_per_premium, expires_at, is_active } = body;

            const updateData: any = {};
            if (standard_count !== undefined) updateData.standard_count = standard_count;
            if (price_per_premium !== undefined) updateData.price_per_premium = price_per_premium;
            if (expires_at !== undefined) updateData.expires_at = expires_at ? new Date(expires_at) : null;
            if (is_active !== undefined) updateData.is_active = is_active;

            const gallery = await prisma.clientGallery.update({
                where: { id: galleryId },
                data: updateData,
            });

            return NextResponse.json({
                success: true,
                gallery,
            });
        } catch (error) {
            console.error('Error updating gallery:', error);
            return NextResponse.json(
                { success: false, error: 'Nie udało się zaktualizować galerii' },
                { status: 500 }
            );
        }
    });
}
