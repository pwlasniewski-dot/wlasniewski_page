import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { deleteFromS3 } from '@/lib/storage/s3';

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req) => {
        try {
            const params = await context.params;
            const id = parseInt(params.id);
            if (isNaN(id)) {
                return NextResponse.json(
                    { error: 'Invalid ID' },
                    { status: 400 }
                );
            }

            // 1. Get media info
            const media = await prisma.mediaLibrary.findUnique({
                where: { id },
            });

            if (!media) {
                return NextResponse.json(
                    { error: 'Media not found' },
                    { status: 404 }
                );
            }

            // 2. Delete from S3
            if (media.file_path) {
                try {
                    await deleteFromS3(media.file_path);
                } catch (s3Error) {
                    console.error('Failed to delete from S3, proceeding with DB delete:', s3Error);
                }
            }

            // 3. Delete from DB
            await prisma.mediaLibrary.delete({
                where: { id },
            });

            return NextResponse.json({ success: true });
        } catch (error: any) {
            console.error('Delete error:', error);
            return NextResponse.json(
                { error: 'Failed to delete media' },
                { status: 500 }
            );
        }
    });
}
