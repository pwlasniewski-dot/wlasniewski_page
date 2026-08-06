// API Route: GET /api/galleries/[accessCode]/download/[photoId]

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import sharp from 'sharp';
import { Readable } from 'stream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ accessCode: string; photoId: string }> }
) {
    try {
        const { accessCode, photoId } = await params;
        const parsedPhotoId = Number(photoId);

        if (!Number.isInteger(parsedPhotoId) || parsedPhotoId <= 0) {
            return NextResponse.json({ success: false, error: 'Nieprawidłowy identyfikator zdjęcia' }, { status: 400 });
        }

        const gallery = await prisma.clientGallery.findUnique({
            where: { access_code: accessCode },
            select: { id: true, is_active: true, expires_at: true }
        });

        if (!gallery || !gallery.is_active) {
            return NextResponse.json({ success: false, error: 'Galeria niedostępna' }, { status: 403 });
        }

        if (gallery.expires_at && gallery.expires_at < new Date()) {
            return NextResponse.json({ success: false, error: 'Galeria wygasła' }, { status: 403 });
        }

        const photo = await prisma.galleryPhoto.findFirst({
            where: { id: parsedPhotoId, gallery_id: gallery.id },
            select: {
                id: true,
                is_standard: true,
                download_source_url: true,
            }
        });

        if (!photo) {
            return NextResponse.json({ success: false, error: 'Zdjęcie nie znalezione' }, { status: 404 });
        }

        if (!photo.is_standard) {
            const orders = await prisma.photoOrder.findMany({
                where: { gallery_id: gallery.id, payment_status: 'paid' },
                select: { photo_ids: true },
            });

            let isPurchased = false;
            for (const order of orders) {
                try {
                    const purchasedIds = JSON.parse(order.photo_ids) as unknown;
                    if (Array.isArray(purchasedIds) && purchasedIds.includes(photo.id)) {
                        isPurchased = true;
                        break;
                    }
                } catch (error) {
                    console.error('Invalid photo_ids in paid order:', error);
                }
            }

            if (!isPurchased) {
                return NextResponse.json({ success: false, error: 'To zdjęcie wymaga zakupu' }, { status: 403 });
            }
        }

        if (!photo.download_source_url) {
            return NextResponse.json(
                { success: false, error: 'Plik JPG w pełnej jakości nie został jeszcze przygotowany' },
                { status: 409 }
            );
        }

        const sourceResponse = await fetch(photo.download_source_url, {
            cache: 'no-store',
            redirect: 'follow',
            signal: AbortSignal.timeout(60_000),
        });

        if (!sourceResponse.ok || !sourceResponse.body) {
            throw new Error(`Failed to fetch source: HTTP ${sourceResponse.status}`);
        }

        const contentType = (sourceResponse.headers.get('content-type') || '').toLowerCase();
        const sourceStream = Readable.fromWeb(sourceResponse.body as never);
        const filename = `photo-${photo.id}.jpg`;

        if (contentType.includes('image/jpeg') || contentType.includes('image/jpg')) {
            return new Response(sourceStream as never, {
                headers: {
                    'Content-Type': 'image/jpeg',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                    'Cache-Control': 'private, no-store, max-age=0',
                    'X-Content-Type-Options': 'nosniff',
                }
            });
        }

        if (!contentType.includes('image/png') && !contentType.includes('image/webp')) {
            return NextResponse.json({ success: false, error: 'Źródło nie jest obsługiwanym obrazem' }, { status: 415 });
        }

        const jpegStream = sharp()
            .rotate()
            .jpeg({ quality: 94, chromaSubsampling: '4:4:4', mozjpeg: true });
        sourceStream.pipe(jpegStream);

        return new Response(jpegStream as never, {
            headers: {
                'Content-Type': 'image/jpeg',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'private, no-store, max-age=0',
                'X-Content-Type-Options': 'nosniff',
            }
        });
    } catch (error) {
        console.error('Error downloading photo:', error);
        return NextResponse.json({ success: false, error: 'Nie udało się pobrać zdjęcia' }, { status: 500 });
    }
}
