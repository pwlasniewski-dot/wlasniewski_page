// API Route: PUT /api/admin/galleries/[id]/photos/[photoId]
// Update or delete a gallery photo

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import fs from 'fs/promises';
import path from 'path';
import { deleteFromS3 } from '@/lib/storage/s3';

// PUT - Update photo properties
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; photoId: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { id, photoId } = await params;
            const galleryId = id; // Map id to galleryId for consistency
            const body = await request.json();

            const { is_standard, order_index } = body;

            const updateData: any = {};
            if (is_standard !== undefined) updateData.is_standard = is_standard;
            if (order_index !== undefined) updateData.order_index = order_index;

            const photo = await prisma.galleryPhoto.update({
                where: { id: Number(photoId) },
                data: updateData,
            });

            return NextResponse.json({
                success: true,
                photo,
            });
        } catch (error) {
            console.error('Error updating photo:', error);
            return NextResponse.json(
                { success: false, error: 'Nie udało się zaktualizować zdjęcia' },
                { status: 500 }
            );
        }
    });
}

// DELETE - Delete photo
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; photoId: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { id, photoId } = await params;
            const galleryId = id;

            // Get photo info to delete files
            const photo = await prisma.galleryPhoto.findUnique({
                where: { id: Number(photoId) }
            });

            if (!photo) {
                return NextResponse.json(
                    { success: false, error: 'Zdjęcie nie znalezione' },
                    { status: 404 }
                );
            }

            // Delete files from S3
            try {
                if (photo.file_url) {
                    await deleteFromS3(photo.file_url);
                }
                if (photo.thumbnail_url) {
                    await deleteFromS3(photo.thumbnail_url);
                }
            } catch (fileError) {
                console.error('Error deleting files from S3:', fileError);
                // Continue even if S3 deletion fails
            }

            // Delete from database
            await prisma.galleryPhoto.delete({
                where: { id: Number(photoId) }
            });

            return NextResponse.json({
                success: true,
                message: 'Zdjęcie usunięte',
            });
        } catch (error) {
            console.error('Error deleting photo:', error);
            return NextResponse.json(
                { success: false, error: 'Nie udało się usunąć zdjęcia' },
                { status: 500 }
            );
        }
    });
}
