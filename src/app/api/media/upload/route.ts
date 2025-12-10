import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { uploadToS3 } from '@/lib/storage/s3';

export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const formData = await req.formData();
            const file = formData.get('file') as File;

            if (!file) {
                return NextResponse.json(
                    { error: 'No file uploaded' },
                    { status: 400 }
                );
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const filename = file.name.replace(/\s+/g, '-').toLowerCase();
            const uniqueName = `${Date.now()}-${filename}`;

            // Upload to AWS S3
            // This returns the full public URL
            const publicUrl = await uploadToS3(buffer, uniqueName, file.type);

            // Save to database
            const media = await prisma.mediaLibrary.create({
                data: {
                    file_name: uniqueName,
                    original_name: file.name,
                    file_path: publicUrl, // Saves full URL from S3
                    file_size: file.size,
                    mime_type: file.type,
                    folder: 'uploads',
                    uploaded_by: req.user?.id,
                },
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
            console.error('Upload error:', error);
            return NextResponse.json(
                { error: 'Upload failed: ' + error.message },
                { status: 500 }
            );
        }
    });
}
