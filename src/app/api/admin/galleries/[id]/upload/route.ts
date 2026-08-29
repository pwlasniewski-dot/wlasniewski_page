// API Route: POST /api/admin/galleries/[id]/upload
// Upload photos to a gallery

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import crypto from 'crypto';
import { processGalleryPhoto, deleteGalleryPhoto } from '@/lib/gallery-utils';
import { deleteFromS3, getPrivateS3Object } from '@/lib/storage/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 30 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type GalleryUploadSource = {
    name: string;
    type: string;
    size: number;
    getBuffer: () => Promise<Buffer>;
    temporaryS3Key?: string;
};

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async () => {
        const uploadErrorId = `GAL-UP-${Date.now().toString(36).toUpperCase()}`;
        try {
            const { id } = await params;
            const galleryId = Number(id);

            // Verify gallery exists
            const gallery = await prisma.clientGallery.findUnique({
                where: { id: galleryId }
            });

            if (!gallery) {
                return NextResponse.json(
                    { success: false, error: 'Galeria nie znaleziona' },
                    { status: 404 }
                );
            }

            const contentType = request.headers.get('content-type') || '';
            let uploadSources: GalleryUploadSource[] = [];
            let isStandard = false;
            let skipOptimization = false;

            if (contentType.includes('application/json')) {
                const body = await request.json();
                const temporaryS3Key = typeof body?.s3Key === 'string' ? body.s3Key : '';
                const originalName = typeof body?.originalName === 'string' ? body.originalName : '';
                const expectedPrefix = `gallery-ingest/${galleryId}/`;

                if (!temporaryS3Key.startsWith(expectedPrefix) || !originalName) {
                    return NextResponse.json(
                        { success: false, error: 'Nieprawidłowy identyfikator bezpośredniego uploadu' },
                        { status: 400 },
                    );
                }

                const object = await getPrivateS3Object(temporaryS3Key);
                const objectSize = Number(object.contentLength || 0);
                uploadSources = [{
                    name: originalName,
                    type: object.contentType,
                    size: objectSize,
                    temporaryS3Key,
                    getBuffer: async () => Buffer.from(await object.body.transformToByteArray()),
                }];
                isStandard = body?.isStandard === true;
                skipOptimization = body?.skipOptimization === true;
            } else {
                const formData = await request.formData();
                const files = formData.getAll('photos') as File[];
                isStandard = formData.get('is_standard') === 'true';
                skipOptimization = formData.get('skip_optimization') === 'true';
                uploadSources = files.map((file) => ({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    getBuffer: async () => Buffer.from(await file.arrayBuffer()),
                }));
            }

            if (uploadSources.length === 0) {
                return NextResponse.json(
                    { success: false, error: 'Brak plików do uploadu' },
                    { status: 400 }
                );
            }

            for (const file of uploadSources) {
                if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
                    if (file.temporaryS3Key) await deleteFromS3(file.temporaryS3Key).catch(() => undefined);
                    return NextResponse.json(
                        { success: false, error: `Nieobsługiwany typ pliku: ${file?.name || 'plik'}` },
                        { status: 400 }
                    );
                }
                if (!Number.isSafeInteger(file.size) || file.size <= 0 || file.size > MAX_FILE_SIZE) {
                    if (file.temporaryS3Key) await deleteFromS3(file.temporaryS3Key).catch(() => undefined);
                    return NextResponse.json(
                        { success: false, error: `Plik ${file.name} jest pusty lub za duży (maksymalnie 30 MB)` },
                        { status: 400 }
                    );
                }
            }

            // Get current max order_index
            const maxPhoto = await prisma.galleryPhoto.findFirst({
                where: { gallery_id: galleryId },
                orderBy: { order_index: 'desc' },
                select: { order_index: true }
            });

            let currentIndex = (maxPhoto?.order_index || 0) + 1;
            const uploadedPhotos = [];
            const duplicates: Array<{ name: string; reason: string }> = [];

            const existingPhotos = await prisma.galleryPhoto.findMany({
                where: { gallery_id: galleryId },
                select: {
                    id: true,
                    file_url: true,
                    thumbnail_url: true,
                    file_size: true,
                    width: true,
                    height: true,
                },
            });

            const existingHashes = new Map<number, string>();
            const uploadedHashesInRequest = new Set<string>();

            const hashRemoteImage = async (url: string): Promise<string | null> => {
                try {
                    const res = await fetch(url, { cache: 'no-store' });
                    if (!res.ok) return null;
                    const buffer = Buffer.from(await res.arrayBuffer());
                    return crypto.createHash('sha256').update(buffer).digest('hex');
                } catch {
                    return null;
                }
            };

            // Process each file
            for (const file of uploadSources) {
                try {
                    const buffer = await file.getBuffer();

                    // Process photo (resize + thumbnail)
                    const processed = await processGalleryPhoto(buffer, galleryId, {
                        skipOptimization,
                        sourceMimeType: file.type,
                    });

                    // Exact duplicate within current request batch.
                    if (uploadedHashesInRequest.has(processed.content_hash)) {
                        duplicates.push({ name: file.name, reason: 'duplikat w paczce uploadu' });
                        await deleteGalleryPhoto(processed.file_url, processed.thumbnail_url, processed.download_source_url);
                        continue;
                    }

                    // Exact duplicate against existing gallery photos (hash check with metadata prefilter).
                    const sameMetadataCandidates = existingPhotos.filter((photo) => (
                        photo.file_size === processed.file_size
                        && (photo.width || 0) === processed.width
                        && (photo.height || 0) === processed.height
                    ));

                    let isDuplicate = false;
                    for (const candidate of sameMetadataCandidates) {
                        let candidateHash = existingHashes.get(candidate.id);
                        if (!candidateHash) {
                            candidateHash = await hashRemoteImage(candidate.file_url) || '';
                            if (candidateHash) {
                                existingHashes.set(candidate.id, candidateHash);
                            }
                        }

                        if (candidateHash && candidateHash === processed.content_hash) {
                            isDuplicate = true;
                            break;
                        }
                    }

                    if (isDuplicate) {
                        duplicates.push({ name: file.name, reason: 'zdjęcie już istnieje w galerii' });
                        await deleteGalleryPhoto(processed.file_url, processed.thumbnail_url, processed.download_source_url);
                        continue;
                    }

                    // Save to database
                    const photo = await prisma.galleryPhoto.create({
                        data: {
                            gallery_id: galleryId,
                            file_url: processed.file_url,
                            thumbnail_url: processed.thumbnail_url,
                            download_source_url: processed.download_source_url,
                            file_size: processed.file_size,
                            width: processed.width,
                            height: processed.height,
                            download_source_width: processed.download_source_width,
                            download_source_height: processed.download_source_height,
                            is_standard: isStandard,
                            order_index: currentIndex++,
                        }
                    });

                    uploadedPhotos.push(photo);
                    uploadedHashesInRequest.add(processed.content_hash);
                } finally {
                    if (file.temporaryS3Key) {
                        await deleteFromS3(file.temporaryS3Key).catch((cleanupError) => {
                            console.warn('[GALLERY_UPLOAD] Failed to remove temporary S3 object', cleanupError);
                        });
                    }
                }
            }

            return NextResponse.json({
                success: true,
                message: `Uploaded ${uploadedPhotos.length} photo(s)`,
                photos: uploadedPhotos,
                duplicate_count: duplicates.length,
                duplicates,
            });
        } catch (error: any) {
            console.error(`[GALLERY_UPLOAD:${uploadErrorId}] Error uploading photos:`, {
                message: error?.message,
                stack: error?.stack,
            });
            return NextResponse.json(
                {
                    success: false,
                    error: `Nie udało się wgrać zdjęć. ID: ${uploadErrorId}`,
                },
                { status: 500 }
            );
        }
    });
}
