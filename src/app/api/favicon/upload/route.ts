import { NextRequest, NextResponse } from 'next/server';
// import { writeFile } from 'fs/promises';
// import { join } from 'path';
import { withAuth } from '@/lib/auth/middleware';
import { uploadToS3 } from '@/lib/storage/s3';

export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const formData = await req.formData();
            const file = formData.get('file') as File;

            if (!file) {
                return NextResponse.json({ error: 'No file provided' }, { status: 400 });
            }

            // Validate file type
            const validTypes = ['image/x-icon', 'image/png', 'image/svg+xml', 'image/jpeg'];
            if (!validTypes.includes(file.type)) {
                return NextResponse.json({ error: 'Invalid file type. Use .ico, .png, .svg, or .jpg' }, { status: 400 });
            }

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Determine extension
            const ext = file.name.split('.').pop() || 'ico';
            const fileName = `favicon/favicon_${Date.now()}.${ext}`;

            // Save to S3
            const faviconUrl = await uploadToS3(buffer, fileName, file.type);

            return NextResponse.json({
                success: true,
                faviconUrl,
                message: 'Favicon uploaded successfully'
            });
        } catch (error) {
            console.error('Favicon upload error:', error);
            return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
        }
    });
}
