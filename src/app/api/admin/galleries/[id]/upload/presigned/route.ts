import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { getPrivateS3UploadUrl } from '@/lib/storage/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 30 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function safeFileName(value: string): string {
    const normalized = value.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-');
    return normalized.slice(-120) || 'photo.jpg';
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    return withAuth(request, async (req) => {
        try {
            const { id } = await params;
            const galleryId = Number(id);
            if (!Number.isSafeInteger(galleryId) || galleryId <= 0) {
                return NextResponse.json({ success: false, error: 'Nieprawidłowa galeria' }, { status: 400 });
            }

            const body = await req.json();
            const fileName = typeof body?.fileName === 'string' ? body.fileName : '';
            const fileType = typeof body?.fileType === 'string' ? body.fileType.toLowerCase() : '';
            const fileSize = Number(body?.fileSize);

            if (!fileName || !Number.isSafeInteger(fileSize) || fileSize <= 0) {
                return NextResponse.json({ success: false, error: 'Nieprawidłowe dane pliku' }, { status: 400 });
            }
            if (!ALLOWED_TYPES.has(fileType)) {
                return NextResponse.json({ success: false, error: 'Obsługiwane są pliki JPG, PNG i WebP' }, { status: 415 });
            }
            if (fileSize > MAX_FILE_SIZE) {
                return NextResponse.json({ success: false, error: 'Plik jest za duży (maksymalnie 30 MB)' }, { status: 413 });
            }

            const gallery = await prisma.clientGallery.findUnique({
                where: { id: galleryId },
                select: { id: true },
            });
            if (!gallery) {
                return NextResponse.json({ success: false, error: 'Galeria nie znaleziona' }, { status: 404 });
            }

            const s3Key = `gallery-ingest/${galleryId}/${crypto.randomUUID()}-${safeFileName(fileName)}`;
            const uploadUrl = await getPrivateS3UploadUrl(s3Key, fileType, fileSize);

            return NextResponse.json({ success: true, uploadUrl, s3Key });
        } catch (error) {
            console.error('[GALLERY_PRESIGN] Failed to prepare direct upload', error);
            return NextResponse.json({ success: false, error: 'Nie udało się przygotować uploadu' }, { status: 500 });
        }
    });
}
