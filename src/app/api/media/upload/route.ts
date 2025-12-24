import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { uploadToS3 } from '@/lib/storage/s3';
import { logSystem } from '@/lib/logger';

export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            let formData;
            try {
                formData = await req.formData();
            } catch (e) {
                const parseErr = e instanceof Error ? e.message : String(e);
                console.error('FormData parse error:', parseErr);
                await logSystem('ERROR', 'MEDIA_UPLOAD', 'Failed to parse FormData', { error: parseErr });
                return NextResponse.json(
                    { error: 'Invalid form data (FormData parse error)', details: parseErr },
                    { status: 400 }
                );
            }

            const folder = (formData.get('folder') as string) || 'uploads';
            const file = formData.get('file') as File | null;

            if (!file) {
                await logSystem('WARN', 'MEDIA_UPLOAD', 'Upload attempt without file');
                return NextResponse.json(
                    { error: 'No file uploaded' },
                    { status: 400 }
                );
            }

            // Check file size early (Max 10MB as per next.config)
            if (file.size > 10 * 1024 * 1024) {
                await logSystem('WARN', 'MEDIA_UPLOAD', 'File too large', { name: file.name, size: file.size });
                return NextResponse.json(
                    { error: 'File too large (max 10MB)' },
                    { status: 413 }
                );
            }

            await logSystem('INFO', 'MEDIA_UPLOAD', `Starting upload for: ${file.name}`, {
                size: file.size,
                type: file.type,
                folder
            });

            const buffer = Buffer.from(await file.arrayBuffer());
            const filename = file.name.replace(/\s+/g, '-').toLowerCase();
            const uniqueName = `${Date.now()}-${filename}`;

            // Upload to AWS S3
            let publicUrl;
            try {
                publicUrl = await uploadToS3(buffer, uniqueName, file.type);
            } catch (s3Error: any) {
                console.error('S3 Upload Error:', s3Error);
                await logSystem('ERROR', 'MEDIA_UPLOAD', 'S3 Upload Failed', { error: s3Error.message });
                return NextResponse.json(
                    { error: 'S3 storage error', details: s3Error.message },
                    { status: 502 }
                );
            }

            // Save to database
            const media = await prisma.mediaLibrary.create({
                data: {
                    file_name: uniqueName,
                    original_name: file.name,
                    file_path: publicUrl,
                    file_size: file.size,
                    mime_type: file.type,
                    folder: folder,
                    uploaded_by: req.user?.id,
                },
            });

            await logSystem('INFO', 'MEDIA_UPLOAD', `File uploaded and registered: ${file.name}`, {
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
            console.error('CRITICAL Upload error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            await logSystem('ERROR', 'MEDIA_UPLOAD', 'Critical unhandled error during upload', { error: errorMessage });
            return NextResponse.json(
                { error: 'Internal Server Error during upload', details: errorMessage },
                { status: 500 }
            );
        }
    });
}
