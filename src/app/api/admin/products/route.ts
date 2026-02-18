import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

// GEt /api/admin/products
// Fetch all products or filter by gallery_id
export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        try {
            const { searchParams } = new URL(request.url);
            const galleryId = searchParams.get('gallery_id');

            const where: any = {};
            if (galleryId) {
                where.gallery_id = parseInt(galleryId);
            }

            const products = await prisma.galleryProduct.findMany({
                where,
                orderBy: { created_at: 'desc' }
            });

            return NextResponse.json({ success: true, products });
        } catch (error) {
            console.error('Error fetching products:', error);
            return NextResponse.json({ error: 'Błąd pobierania produktów' }, { status: 500 });
        }
    });
}

// POST /api/admin/products
// Create a new product
export async function POST(request: NextRequest) {
    return withAuth(request, async () => {
        try {
            const body = await request.json();
            const { title, description, price, image_url, video_url, gallery_id, is_active } = body;

            if (!title || price === undefined) {
                return NextResponse.json({ error: 'Brak wymaganych danych' }, { status: 400 });
            }

            const product = await prisma.galleryProduct.create({
                data: {
                    title,
                    description,
                    price: parseInt(price),
                    image_url,
                    video_url,
                    gallery_id: gallery_id ? parseInt(gallery_id) : null,
                    is_active: is_active ?? true,
                }
            });

            return NextResponse.json({ success: true, product });
        } catch (error) {
            console.error('Error creating product:', error);
            return NextResponse.json({ error: 'Błąd tworzenia produktu' }, { status: 500 });
        }
    });
}
