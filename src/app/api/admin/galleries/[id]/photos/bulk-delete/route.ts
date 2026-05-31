// API Route: DELETE /api/admin/galleries/[id]/photos/bulk-delete
// Bulk delete multiple gallery photos

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { deleteFromS3 } from '@/lib/storage/s3';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { id } = await params;
            const galleryId = Number(id);
            const body = await request.json();
            const { photoIds } = body;

            if (!Array.isArray(photoIds) || photoIds.length === 0) {
                return NextResponse.json(
                    { success: false, error: 'Brak ID zdjęć do usunięcia' },
                    { status: 400 }
                );
            }

            // Validate all IDs are numbers
            const ids: number[] = photoIds.map(Number).filter(n => Number.isFinite(n) && n > 0);
            if (ids.length === 0) {
                return NextResponse.json(
                    { success: false, error: 'Nieprawidłowe ID zdjęć' },
                    { status: 400 }
                );
            }

            // Fetch photos (only those belonging to this gallery)
            const photos = await prisma.galleryPhoto.findMany({
                where: {
                    id: { in: ids },
                    gallery_id: galleryId,
                },
            });

            // Delete S3 files in parallel
            await Promise.allSettled(
                photos.flatMap(photo => {
                    const tasks: Promise<void>[] = [];
                    if (photo.file_url) tasks.push(deleteFromS3(photo.file_url));
                    if (photo.thumbnail_url) tasks.push(deleteFromS3(photo.thumbnail_url));
                    return tasks;
                })
            );

            // Bulk delete from DB
            const deleted = await prisma.galleryPhoto.deleteMany({
                where: {
                    id: { in: ids },
                    gallery_id: galleryId,
                },
            });

            return NextResponse.json({
                success: true,
                deleted: deleted.count,
            });
        } catch (error) {
            console.error('Error bulk deleting photos:', error);
            return NextResponse.json(
                { success: false, error: 'Nie udało się usunąć zdjęć' },
                { status: 500 }
            );
        }
    });
}
