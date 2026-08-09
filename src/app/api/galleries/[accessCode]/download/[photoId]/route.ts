// API Route: GET /api/galleries/[accessCode]/download/[photoId]

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import sharp from 'sharp';
import { Readable } from 'stream';
import { authorizeIndividualGallery, galleryAccessDenied } from '@/lib/galleries/individual-access';
import { getPrivateS3Object } from '@/lib/storage/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
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
            select: {
                id: true,
                access_code: true,
                gallery_mode: true,
                client_id: true,
                client_email: true,
                group_password: true,
                is_active: true,
                expires_at: true,
            }
        });

        if (!gallery || !gallery.is_active) {
            return NextResponse.json({ success: false, error: 'Galeria niedostępna' }, { status: 403 });
        }

        if (gallery.expires_at && gallery.expires_at < new Date()) {
            return NextResponse.json({ success: false, error: 'Galeria wygasła' }, { status: 403 });
        }

        const access = await authorizeIndividualGallery(request, gallery);
        if (!access.allowed) return galleryAccessDenied(access);

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

        const source = await getPrivateS3Object(photo.download_source_url);
        if (source.contentLength && source.contentLength > 80 * 1024 * 1024) {
            return NextResponse.json({ success: false, error: 'Plik przekracza limit pobierania' }, { status: 413 });
        }
        const contentType = source.contentType;
        const sourceStream = Readable.fromWeb(source.body.transformToWebStream() as never);
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
