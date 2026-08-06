import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import archiver from 'archiver';
import { PassThrough, Readable } from 'stream';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeFileName(value: string | null | undefined): string {
    return (value || 'galeria')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80) || 'galeria';
}

function waitForStream(stream: NodeJS.ReadableStream): Promise<void> {
    return new Promise((resolve, reject) => {
        stream.once('end', resolve);
        stream.once('error', reject);
    });
}

function isSupportedImageContentType(contentType: string): boolean {
    return contentType.includes('image/jpeg') ||
        contentType.includes('image/jpg') ||
        contentType.includes('image/png') ||
        contentType.includes('image/webp');
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ accessCode: string }> }
) {
    try {
        const { accessCode } = await params;

        const gallery = await prisma.clientGallery.findUnique({
            where: { access_code: accessCode },
            include: {
                photos: { orderBy: { order_index: 'asc' } },
                orders: {
                    where: { payment_status: 'paid' },
                    select: { photo_ids: true },
                },
            },
        });

        if (!gallery || !gallery.is_active) {
            return NextResponse.json({ error: 'Galeria niedostępna' }, { status: 403 });
        }

        if (gallery.expires_at && gallery.expires_at < new Date()) {
            return NextResponse.json({ error: 'Galeria wygasła' }, { status: 403 });
        }

        const purchasedPhotoIds = new Set<number>();
        for (const order of gallery.orders) {
            try {
                const ids = JSON.parse(order.photo_ids) as unknown;
                if (Array.isArray(ids)) {
                    for (const id of ids) {
                        if (typeof id === 'number') purchasedPhotoIds.add(id);
                    }
                }
            } catch (error) {
                console.error('Invalid photo_ids in paid order:', error);
            }
        }

        const photosToDownload = gallery.photos.filter(
            (photo) => photo.is_standard || purchasedPhotoIds.has(photo.id)
        );

        if (photosToDownload.length === 0) {
            return NextResponse.json({ error: 'Brak dostępnych zdjęć do pobrania' }, { status: 404 });
        }

        const archiveName = `${safeFileName(gallery.client_name)}-zdjecia-jpg.zip`;
        const passthrough = new PassThrough({ highWaterMark: 1024 * 1024 });
        const archive = archiver('zip', {
            store: true,
            forceZip64: true,
            highWaterMark: 1024 * 1024,
        });

        archive.on('warning', (error) => console.warn('ZIP warning:', error));
        archive.on('error', (error) => {
            console.error('ZIP error:', error);
            passthrough.destroy(error);
        });
        archive.pipe(passthrough);

        void (async () => {
            const failures: string[] = [];
            let appended = 0;

            try {
                for (const [index, photo] of photosToDownload.entries()) {
                    // Full gallery downloads must never silently use the WebP/preview source.
                    const sourceUrl = photo.download_source_url;
                    if (!sourceUrl) {
                        failures.push(`Zdjęcie ${photo.id}: brak pliku JPG w pełnej jakości.`);
                        continue;
                    }

                    try {
                        const response = await fetch(sourceUrl, {
                            cache: 'no-store',
                            redirect: 'follow',
                            signal: AbortSignal.timeout(60_000),
                        });

                        if (!response.ok || !response.body) {
                            throw new Error(`HTTP ${response.status}`);
                        }

                        const contentType = (response.headers.get('content-type') || '').toLowerCase();
                        if (!isSupportedImageContentType(contentType)) {
                            throw new Error(`Nieprawidłowy typ pliku: ${contentType || 'brak'}`);
                        }

                        const sequence = String(index + 1).padStart(4, '0');
                        const filename = `${sequence}-photo-${photo.id}.jpg`;
                        const sourceStream = Readable.fromWeb(response.body as never);
                        const sourceIsJpeg = contentType.includes('image/jpeg') || contentType.includes('image/jpg');

                        if (sourceIsJpeg) {
                            archive.append(sourceStream, { name: filename });
                            await waitForStream(sourceStream);
                        } else {
                            const jpegStream = sharp()
                                .rotate()
                                .jpeg({ quality: 94, chromaSubsampling: '4:4:4', mozjpeg: true });
                            sourceStream.pipe(jpegStream);
                            archive.append(jpegStream, { name: filename });
                            await waitForStream(jpegStream);
                        }

                        appended += 1;
                    } catch (error) {
                        const message = error instanceof Error ? error.message : 'nieznany błąd';
                        failures.push(`Zdjęcie ${photo.id}: ${message}`);
                        console.error(`Failed to add photo ${photo.id} to ZIP:`, error);
                    }
                }

                if (failures.length > 0) {
                    archive.append(
                        [
                            'Raport pobierania galerii',
                            `Poprawnie dodano: ${appended}`,
                            `Pominięto: ${failures.length}`,
                            '',
                            ...failures,
                            '',
                            'Brakujące pliki wymagają ponownego mapowania JPG przez fotografa.',
                        ].join('\n'),
                        { name: 'RAPORT-POBIERANIA.txt' }
                    );
                }

                if (appended === 0) {
                    archive.append(
                        'Nie znaleziono żadnego pliku JPG w pełnej jakości. Skontaktuj się z fotografem.',
                        { name: 'BRAK-PLIKOW-JPG.txt' }
                    );
                }

                await archive.finalize();
            } catch (error) {
                console.error('Error during ZIP generation:', error);
                archive.abort();
                passthrough.destroy(error as Error);
            }
        })();

        return new NextResponse(passthrough as never, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${archiveName}"`,
                'Cache-Control': 'private, no-store, max-age=0',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (error) {
        console.error('ZIP Download Error:', error);
        return NextResponse.json({ error: 'Błąd generowania ZIP' }, { status: 500 });
    }
}
