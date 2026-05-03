import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { uploadToS3 } from '@/lib/storage/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/workshops/upload-asset
 * multipart/form-data: { file: File, kind?: 'schedule'|'materials'|'misc' }
 * Zwraca { url } — admin podpina ten URL do schedule[].image_url lub materials[].image_url.
 *
 * Limit: 8 MB, image/* lub application/pdf.
 */
export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const fd = await req.formData();
            const file = fd.get('file') as File | null;
            const kind = (fd.get('kind') as string) || 'misc';
            if (!file) return NextResponse.json({ error: 'Brak pliku' }, { status: 400 });

            if (file.size > 8 * 1024 * 1024) {
                return NextResponse.json({ error: 'Plik za duży (max 8 MB)' }, { status: 413 });
            }
            if (!/^(image\/|application\/pdf)/.test(file.type)) {
                return NextResponse.json({ error: 'Dozwolone tylko obrazy lub PDF' }, { status: 415 });
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const safe = file.name.replace(/[^\w.\-]+/g, '_').toLowerCase();
            const key = `workshops/${kind}/${Date.now()}-${safe}`;
            const url = await uploadToS3(buffer, key, file.type);
            return NextResponse.json({ url });
        } catch (e: any) {
            console.error('[POST workshops/upload-asset]', e);
            return NextResponse.json({ error: e.message || 'Internal' }, { status: 500 });
        }
    });
}
