// API Route: POST /api/admin/galleries/[id]/upload
// Upload photos to a gallery

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import crypto from 'crypto';
import { processGalleryPhoto, deleteGalleryPhoto } from '@/lib/gallery-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

            const formData = await request.formData();
            const files = formData.getAll('photos') as File[];
            const isStandardStr = formData.get('is_standard') as string;
            const isStandard = isStandardStr === 'true';

            const skipOptimizationStr = formData.get('skip_optimization') as string;
            const skipOptimization = skipOptimizationStr === 'true';

            if (!files || files.length === 0) {
                return NextResponse.json(
                    { success: false, error: 'Brak plików do uploadu' },
                    { status: 400 }
                );
            }

            const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
            for (const file of files) {
                if (!file?.type?.startsWith('image/')) {
                    return NextResponse.json(
                        { success: false, error: `Nieobsługiwany typ pliku: ${file?.name || 'plik'}` },
                        { status: 400 }
                    );
                }
                if (file.size > MAX_FILE_SIZE) {
                    return NextResponse.json(
                        { success: false, error: `Plik ${file.name} jest za duży (max 30MB)` },
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
            for (const file of files) {
                const buffer = Buffer.from(await file.arrayBuffer());

                // Process photo (resize + thumbnail)
                const processed = await processGalleryPhoto(buffer, galleryId, {
                    skipOptimization,
                    sourceMimeType: file.type,
                });

                // Exact duplicate within current request batch.
                if (uploadedHashesInRequest.has(processed.content_hash)) {
                    duplicates.push({ name: file.name, reason: 'duplikat w paczce uploadu' });
                    await deleteGalleryPhoto(processed.file_url, processed.thumbnail_url);
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
                    await deleteGalleryPhoto(processed.file_url, processed.thumbnail_url);
                    continue;
                }

                // Save to database
                const photo = await prisma.galleryPhoto.create({
                    data: {
                        gallery_id: galleryId,
                        file_url: processed.file_url,
                        thumbnail_url: processed.thumbnail_url,
                        file_size: processed.file_size,
                        width: processed.width,
                        height: processed.height,
                        is_standard: isStandard,
                        order_index: currentIndex++,
                    }
                });

                uploadedPhotos.push(photo);
                uploadedHashesInRequest.add(processed.content_hash);
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
                    details: error?.message || 'Internal upload error',
                },
                { status: 500 }
            );
        }
    });
}
