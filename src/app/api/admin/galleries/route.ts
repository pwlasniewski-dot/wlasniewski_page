// API Route: GET /api/admin/galleries
// List all client galleries

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        try {
            const galleries = await prisma.clientGallery.findMany({
                orderBy: { created_at: 'desc' },
                include: {
                    photos: {
                        select: {
                            id: true,
                            is_standard: true,
                        }
                    },
                    orders: {
                        select: {
                            id: true,
                            payment_status: true,
                            total_amount: true,
                        }
                    }
                },
            });

            // Add computed fields
            const galleriesWithStats = galleries.map(gallery => {
                const total_photos = gallery.photos.length;
                const standard_photos_count = gallery.photos.filter(p => p.is_standard).length;
                const premium_photos_count = gallery.photos.filter(p => !p.is_standard).length;
                const total_revenue = gallery.orders
                    .filter(o => o.payment_status === 'paid')
                    .reduce((sum, o) => sum + o.total_amount, 0);

                return {
                    ...gallery,
                    total_photos,
                    standard_photos_count,
                    premium_photos_count,
                    total_revenue,
                };
            });

            return NextResponse.json({
                success: true,
                galleries: galleriesWithStats,
            });
        } catch (error) {
            console.error('Error fetching galleries:', error);
            return NextResponse.json(
                { success: false, error: 'Nie udało się pobrać galerii' },
                { status: 500 }
            );
        }
    });
}
