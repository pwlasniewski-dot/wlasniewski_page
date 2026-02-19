// API Route: POST /api/admin/products/upload
// General purpose upload for product images

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { uploadToS3 } from '@/lib/storage/s3';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    return withAuth(request, async () => {
        try {
            const formData = await request.formData();
            const file = formData.get('file') as File;

            if (!file) {
                return NextResponse.json({ success: false, error: 'Brak pliku' }, { status: 400 });
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const hash = crypto.randomBytes(4).toString('hex');
            const timestamp = Date.now();
            const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
            const filename = `products/${timestamp}-${hash}-${cleanName}`;

            const url = await uploadToS3(buffer, filename, file.type);

            return NextResponse.json({ success: true, url });
        } catch (error) {
            console.error('Upload product image error:', error);
            return NextResponse.json({ success: false, error: 'Błąd przesyłania zdjęcia' }, { status: 500 });
        }
    });
}
