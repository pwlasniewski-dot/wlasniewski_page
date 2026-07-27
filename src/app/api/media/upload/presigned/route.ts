import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { withAuth } from '@/lib/auth/middleware';
import { logSystem } from '@/lib/logger';
import {
    createMediaKey,
    expectedPublicMediaUrl,
    isAllowedMedia,
    MAX_DIRECT_UPLOAD_BYTES,
    normalizeMediaFolder,
} from '@/lib/storage/media-validation';

const s3Client = new S3Client({
    region: process.env.S3_REGION || 'eu-north-1',
    credentials: {
        accessKeyId: (process.env.MY_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '').trim(),
        secretAccessKey: (process.env.MY_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '').trim(),
    },
});

export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const { fileName, fileType, fileSize, folder = 'uploads' } = await req.json();

            if (
                typeof fileName !== 'string'
                || typeof fileType !== 'string'
                || !Number.isSafeInteger(fileSize)
                || fileSize <= 0
            ) {
                return NextResponse.json({ error: 'Invalid upload metadata' }, { status: 400 });
            }
            if (fileSize > MAX_DIRECT_UPLOAD_BYTES) {
                return NextResponse.json({ error: 'File too large (max 200MB)' }, { status: 413 });
            }
            if (!isAllowedMedia(fileName, fileType)) {
                return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
            }
            const normalizedFolder = normalizeMediaFolder(folder);
            if (!normalizedFolder) {
                return NextResponse.json({ error: 'Invalid folder' }, { status: 400 });
            }

            const bucketName = process.env.S3_BUCKET || 'wlasniewski-photo-storage';
            const key = createMediaKey(fileName);

            const command = new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                ContentType: fileType,
                ContentLength: fileSize,
            });

            // URL expires in 15 minutes
            const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

            await logSystem('INFO', 'MEDIA_UPLOAD', `Generated Presigned URL for: ${fileName}`, {
                key,
                fileType,
                fileSize,
                folder: normalizedFolder,
            });

            return NextResponse.json({
                success: true,
                uploadUrl,
                key,
                publicUrl: expectedPublicMediaUrl(key),
            });
        } catch (error) {
            console.error('Presigned URL error:', error);
            return NextResponse.json({ error: 'Failed to generate presigned URL' }, { status: 500 });
        }
    });
}
