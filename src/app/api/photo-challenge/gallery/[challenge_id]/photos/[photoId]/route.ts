import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { unlink } from 'fs/promises';

export async function DELETE(
    request: NextRequest,
    { params }: { params: { challenge_id: string; photoId: string } }
) {
    try {
        const photoId = parseInt(params.photoId);

        // Find photo with media info
        const photo = await prisma.challengePhoto.findUnique({
            where: { id: photoId },
            include: {
                media: true
            }
        });

        if (!photo) {
            return NextResponse.json(
                { success: false, error: 'Photo not found' },
                { status: 404 }
            );
        }

        // Delete file from disk if exists
        if (photo.media?.file_path) {
            try {
                await unlink(photo.media.file_path);
            } catch (err) {
                console.warn('Could not delete physical file:', err);
            }
        }

        // Delete photo record
        await prisma.challengePhoto.delete({
            where: { id: photoId }
        });

        // Delete media if not used elsewhere
        const otherPhotos = await prisma.challengePhoto.count({
            where: { media_id: photo.media_id }
        });

        if (otherPhotos === 0 && photo.media) {
            await prisma.mediaLibrary.delete({
                where: { id: photo.media_id }
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Photo deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting photo:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete photo' },
            { status: 500 }
        );
    }
}
