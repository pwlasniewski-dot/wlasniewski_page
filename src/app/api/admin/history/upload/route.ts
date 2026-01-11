import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { uploadToS3 } from '@/lib/storage/s3';
import { logSystem } from '@/lib/logger';

export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const formData = await req.formData();
            const file = formData.get('file') as File | null;

            if (!file) {
                return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
            }

            // Upload to AWS S3
            // We'll use a specific folder prefix "history/" to keep S3 clean if needed, 
            // though 'uploadToS3' usually puts it in root or 'uploads'.
            // The existing helper takes (buffer, filename, mimeType).
            // Let's prepend 'history-' to filename or use the helper as is.
            // The helper 'uploadToS3' uses the filename passed to it.

            const buffer = Buffer.from(await file.arrayBuffer());
            const filename = file.name.replace(/\s+/g, '-').toLowerCase(); // sanitize
            const uniqueName = `history-${Date.now()}-${filename}`;

            let publicUrl;
            try {
                publicUrl = await uploadToS3(buffer, uniqueName, file.type);
            } catch (s3Error: any) {
                console.error('S3 Upload Error:', s3Error);
                return NextResponse.json({ error: 'S3 storage error' }, { status: 502 });
            }

            // Save to HistoryPhoto table
            const photo = await prisma.historyPhoto.create({
                data: {
                    url: publicUrl,
                    filename: file.name, // Keep original filename for sorting
                    // width/height: we could extract them if we had sharp, but optional for now
                },
            });

            await logSystem('INFO', 'HISTORY', `Uploaded history photo: ${file.name}`);

            return NextResponse.json({ success: true, photo });

        } catch (error: any) {
            console.error('History upload error:', error);
            return NextResponse.json(
                { error: 'Internal Server Error' },
                { status: 500 }
            );
        }
    });
}
