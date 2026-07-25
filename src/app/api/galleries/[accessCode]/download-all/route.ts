import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import sharp from 'sharp';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ accessCode: string }> }
) {
    try {
        const { accessCode } = await params;

        // Verify Gallery
        const gallery = await prisma.clientGallery.findUnique({
            where: { access_code: accessCode },
            include: {
                photos: true,
                orders: {
                    where: { payment_status: 'paid' }
                }
            }
        });

        if (!gallery || !gallery.is_active) {
            return NextResponse.json({ error: 'Galeria niedostępna' }, { status: 403 });
        }

        if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
            return NextResponse.json({ error: 'Galeria wygasła' }, { status: 403 });
        }

        // Determine accessible photos
        const purchasedPhotoIds = new Set<number>();
        gallery.orders.forEach(order => {
            const ids = JSON.parse(order.photo_ids) as number[];
            ids.forEach(id => purchasedPhotoIds.add(id));
        });

        const photosToDownload = gallery.photos.filter(photo =>
            photo.is_standard || purchasedPhotoIds.has(photo.id)
        );

        if (photosToDownload.length === 0) {
            return NextResponse.json({ error: 'Brak dostępnych zdjęć do pobrania' }, { status: 404 });
        }

        // Set Headers for ZIP Download
        const headers = new Headers();
        headers.set('Content-Disposition', `attachment; filename="${gallery.client_name || 'galeria'}-zdjecia.zip"`);
        headers.set('Content-Type', 'application/zip');

        // Create a PassThrough stream to pipe the archive into
        const passthrough = new PassThrough();
        const archive = archiver('zip', { store: true, forceZip64: true });

        archive.on('error', (err) => {
            console.error('Archiver error:', err);
            passthrough.end(); // End stream on error
        });

        // Pipe archive to passthrough
        archive.pipe(passthrough);

        // Process photos asynchronously
        (async () => {
            try {
                for (const photo of photosToDownload) {
                    try {
                        const response = await fetch(photo.file_url);
                        if (!response.ok) throw new Error(`Failed to fetch ${photo.file_url}`);

                        const arrayBuffer = await response.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);

                        // Convert to JPG using sharp
                        const jpgBuffer = await sharp(buffer)
                            .jpeg({ quality: 90 })
                            .toBuffer();

                        const filename = `photo-${photo.id}.jpg`;
                        archive.append(jpgBuffer, { name: filename });

                    } catch (err) {
                        console.error(`Failed to process photo ${photo.id}:`, err);
                        // Continue to next photo even if one fails
                    }
                }
                await archive.finalize();
            } catch (err) {
                console.error('Error during ZIP generation:', err);
                archive.abort();
            }
        })();

        // Return the stream response
        // Using `duplex: 'half'` is required for streaming in Node.js environments within Next.js
        return new NextResponse(passthrough as any, {
            headers,
            status: 200,
        });

    } catch (error) {
        console.error('ZIP Download Error:', error);
        return NextResponse.json({ error: 'Błąd generowania ZIP' }, { status: 500 });
    }
}
