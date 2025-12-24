import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { logSystem } from '@/lib/logger';

export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const { fileName, publicUrl, fileSize, mimeType, folder = 'uploads' } = await req.json();

            if (!fileName || !publicUrl) {
                return NextResponse.json({ error: 'Missing registration data' }, { status: 400 });
            }

            // Save to database
            const media = await prisma.mediaLibrary.create({
                data: {
                    file_name: fileName,
                    original_name: fileName, // In this flow we use the unique key as filename
                    file_path: publicUrl,
                    file_size: BigInt(fileSize || 0),
                    mime_type: mimeType,
                    folder: folder,
                    uploaded_by: req.user?.id,
                },
            });

            await logSystem('INFO', 'MEDIA_UPLOAD', `Metadata registered for S3 file: ${fileName}`, {
                id: Number(media.id),
                url: publicUrl
            });

            // Convert BigInt to Number for JSON serialization
            const serializedMedia = {
                ...media,
                id: Number(media.id),
                file_size: Number(media.file_size),
                uploaded_by: media.uploaded_by ? Number(media.uploaded_by) : null,
            };

            return NextResponse.json({ success: true, media: serializedMedia });
        } catch (error: any) {
            console.error('Media registration error:', error);
            return NextResponse.json({ error: 'Failed to register media', details: error.message }, { status: 500 });
        }
    });
}
