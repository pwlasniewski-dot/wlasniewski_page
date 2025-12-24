import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { withAuth } from '@/lib/auth/middleware';
import { logSystem } from '@/lib/logger';

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
            const { fileName, fileType, folder = 'uploads' } = await req.json();

            if (!fileName || !fileType) {
                return NextResponse.json({ error: 'Missing fileName or fileType' }, { status: 400 });
            }

            const bucketName = process.env.S3_BUCKET || 'wlasniewski-photo-storage';
            const cleanFileName = fileName.replace(/\s+/g, '-').toLowerCase();
            const uniqueName = `${Date.now()}-${cleanFileName}`;
            const key = uniqueName; // We can add folder prefix if desired, but current system uses unique names in root or specific folders are in DB

            const command = new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                ContentType: fileType,
            });

            // URL expires in 15 minutes
            const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

            await logSystem('INFO', 'MEDIA_UPLOAD', `Generated Presigned URL for: ${fileName}`, {
                key,
                fileType
            });

            return NextResponse.json({
                success: true,
                uploadUrl,
                key,
                publicUrl: `https://${bucketName}.s3.${process.env.S3_REGION || 'eu-north-1'}.amazonaws.com/${key}`
            });
        } catch (error: any) {
            console.error('Presigned URL error:', error);
            return NextResponse.json({ error: 'Failed to generate presigned URL', details: error.message }, { status: 500 });
        }
    });
}
