// API Route: POST /api/admin/galleries/[id]/upload
// Upload photos to a gallery

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { processGalleryPhoto } from '@/lib/gallery-utils';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async () => {
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

            // Get current max order_index
            const maxPhoto = await prisma.galleryPhoto.findFirst({
                where: { gallery_id: galleryId },
                orderBy: { order_index: 'desc' },
                select: { order_index: true }
            });

            let currentIndex = (maxPhoto?.order_index || 0) + 1;
            const uploadedPhotos = [];

            // Process each file
            for (const file of files) {
                const buffer = Buffer.from(await file.arrayBuffer());

                // Process photo (resize + thumbnail)
                const processed = await processGalleryPhoto(buffer, galleryId, { skipOptimization });

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
            }

            return NextResponse.json({
                success: true,
                message: `Uploaded ${uploadedPhotos.length} photo(s)`,
                photos: uploadedPhotos,
            });
        } catch (error) {
            console.error('Error uploading photos:', error);
            return NextResponse.json(
                { success: false, error: 'Nie udało się wgrać zdjęć' },
                { status: 500 }
            );
        }
    });
}
