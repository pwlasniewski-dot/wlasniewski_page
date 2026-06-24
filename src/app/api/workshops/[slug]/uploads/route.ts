import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyParticipantToken } from '@/lib/workshops/auth';
import { uploadToS3 } from '@/lib/storage/s3';
import sharp from 'sharp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_SOURCE_FILE_SIZE = 25 * 1024 * 1024; // allow large iPhone originals (HEIC)
const MAX_STORED_FILE_SIZE = 10 * 1024 * 1024; // hard cap for file stored in S3
const IMAGE_EXTENSION_FALLBACK = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];

function fileExt(name: string): string {
    const i = name.lastIndexOf('.');
    return i >= 0 ? name.slice(i).toLowerCase() : '';
}

function isHeicLike(file: File): boolean {
    const type = (file.type || '').toLowerCase();
    const ext = fileExt(file.name);
    return type === 'image/heic' || type === 'image/heif' || ext === '.heic' || ext === '.heif';
}

function isSupportedImage(file: File): boolean {
    const type = (file.type || '').toLowerCase();
    if (type.startsWith('image/')) return true;
    if (isHeicLike(file)) return true;
    if (!type) {
        const ext = fileExt(file.name);
        return IMAGE_EXTENSION_FALLBACK.includes(ext);
    }
    return false;
}

async function logUploadEvent(
    level: 'INFO' | 'WARN' | 'ERROR',
    message: string,
    metadata?: Record<string, unknown>
): Promise<void> {
    try {
        await prisma.systemLog.create({
            data: {
                level,
                module: 'WORKSHOP_UPLOAD',
                message,
                metadata: metadata ? JSON.stringify(metadata) : null,
            },
        });
    } catch {
        // Ignore logging failures to keep upload endpoint resilient.
    }
}

async function normalizeImageForUpload(file: File): Promise<{ buffer: Buffer; mime: string; ext: string; transformed: boolean }> {
    const src = Buffer.from(await file.arrayBuffer());
    const heic = isHeicLike(file);
    const missingMime = !(file.type || '').trim();
    const shouldTransform = heic || missingMime || src.length > MAX_STORED_FILE_SIZE;

    if (!shouldTransform) {
        return {
            buffer: src,
            mime: file.type,
            ext: fileExt(file.name) || '.jpg',
            transformed: false,
        };
    }

    // Normalize iPhone HEIC/HEIF and oversized images into browser-safe JPEG.
    const firstPass = await sharp(src)
        .rotate()
        .resize({ width: 4096, height: 4096, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();

    if (firstPass.length <= MAX_STORED_FILE_SIZE) {
        return { buffer: firstPass, mime: 'image/jpeg', ext: '.jpg', transformed: true };
    }

    const secondPass = await sharp(src)
        .rotate()
        .resize({ width: 3200, height: 3200, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 75, mozjpeg: true })
        .toBuffer();

    return { buffer: secondPass, mime: 'image/jpeg', ext: '.jpg', transformed: true };
}

function getToken(req: NextRequest): string | null {
    const h = req.headers.get('authorization') || '';
    if (h.startsWith('Bearer ')) return h.slice(7);
    return null;
}

/**
 * GET /api/workshops/[slug]/uploads
 * Auth: Bearer <participant token>
 * Zwraca zdjęcia ZALOGOWANEGO uczestnika (tylko własne).
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
    const { slug } = await ctx.params;
    const tk = getToken(request);
    if (!tk) return NextResponse.json({ error: 'Brak tokenu' }, { status: 401 });
    const payload = await verifyParticipantToken(tk);
    if (!payload) return NextResponse.json({ error: 'Token nieważny' }, { status: 401 });

    const ws = await prisma.workshop.findUnique({ where: { slug }, select: { id: true } });
    if (!ws || ws.id !== payload.wid) {
        return NextResponse.json({ error: 'Nie pasuje do warsztatu' }, { status: 403 });
    }

    const uploads = await prisma.workshopUpload.findMany({
        where: { workshop_id: ws.id, participant_id: payload.pid },
        orderBy: { created_at: 'desc' },
        select: {
            id: true, file_url: true, thumb_url: true, caption: true,
            feedback: true, rating: true, created_at: true,
        },
    });
    return NextResponse.json({ uploads });
}

/**
 * POST /api/workshops/[slug]/uploads
 * Auth: Bearer <participant token>
 * multipart/form-data: { file: File, caption?: string }
 * Limit: 25 MB source (auto-optimize), image only, max 50 zdjęć na uczestnika.
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await ctx.params;
        const tk = getToken(request);
        if (!tk) return NextResponse.json({ error: 'Brak tokenu' }, { status: 401 });
        const payload = await verifyParticipantToken(tk);
        if (!payload) return NextResponse.json({ error: 'Token nieważny' }, { status: 401 });

        const ws = await prisma.workshop.findUnique({ where: { slug }, select: { id: true, slug: true } });
        if (!ws || ws.id !== payload.wid) {
            return NextResponse.json({ error: 'Nie pasuje do warsztatu' }, { status: 403 });
        }

        const existing = await prisma.workshopUpload.count({
            where: { workshop_id: ws.id, participant_id: payload.pid },
        });
        if (existing >= 50) {
            return NextResponse.json({ error: 'Limit 50 zdjęć — usuń stare przed dodaniem nowych' }, { status: 429 });
        }

        const fd = await request.formData();
        const file = fd.get('file') as File | null;
        const caption = (fd.get('caption') as string) || null;
        if (!file) {
            await logUploadEvent('WARN', 'Upload rejected: missing file', {
                workshop_slug: ws.slug,
                participant_id: payload.pid,
            });
            return NextResponse.json({ error: 'Brak pliku' }, { status: 400 });
        }
        if (file.size > MAX_SOURCE_FILE_SIZE) {
            await logUploadEvent('WARN', 'Upload rejected: source too large', {
                workshop_slug: ws.slug,
                participant_id: payload.pid,
                size: file.size,
                filename: file.name,
                mime: file.type,
            });
            return NextResponse.json({ error: 'Zdjęcie za duże (max 25 MB)' }, { status: 413 });
        }
        if (!isSupportedImage(file)) {
            await logUploadEvent('WARN', 'Upload rejected: unsupported mime/extension', {
                workshop_slug: ws.slug,
                participant_id: payload.pid,
                filename: file.name,
                mime: file.type,
                size: file.size,
            });
            return NextResponse.json({ error: 'Dozwolone tylko obrazy' }, { status: 415 });
        }

        const prepared = await normalizeImageForUpload(file);
        if (prepared.buffer.length > MAX_STORED_FILE_SIZE) {
            await logUploadEvent('WARN', 'Upload rejected: optimized image still too large', {
                workshop_slug: ws.slug,
                participant_id: payload.pid,
                filename: file.name,
                source_size: file.size,
                optimized_size: prepared.buffer.length,
            });
            return NextResponse.json({
                error: 'Zdjęcie po optymalizacji nadal jest za duże (max 10 MB). Spróbuj mniejszego zdjęcia.',
            }, { status: 413 });
        }

        const safeBase = file.name.replace(/[^\w.\-]+/g, '_').toLowerCase().replace(/\.[^.]+$/, '');
        const key = `workshops/uploads/${ws.slug}/${payload.pid}/${Date.now()}-${safeBase}${prepared.ext}`;
        const url = await uploadToS3(prepared.buffer, key, prepared.mime);

        await logUploadEvent('INFO', 'Workshop image uploaded', {
            workshop_slug: ws.slug,
            participant_id: payload.pid,
            filename: file.name,
            mime_in: file.type,
            mime_out: prepared.mime,
            source_size: file.size,
            stored_size: prepared.buffer.length,
            transformed: prepared.transformed,
        });

        const row = await prisma.workshopUpload.create({
            data: {
                workshop_id: ws.id,
                participant_id: payload.pid,
                file_url: url,
                caption,
            },
        });
        return NextResponse.json({ upload: row }, { status: 201 });
    } catch (e: any) {
        console.error('[POST workshops/uploads] ERROR:', {
            message: e.message,
            stack: e.stack,
            code: e.code,
            name: e.name,
        });
        await logUploadEvent('ERROR', 'Workshop upload failed with exception', {
            message: e?.message,
            code: e?.code,
            name: e?.name,
        });
        return NextResponse.json({ 
            error: e.message || 'Internal server error',
            code: e.code || 'UNKNOWN',
        }, { status: 500 });
    }
}

/**
 * DELETE /api/workshops/[slug]/uploads?id=123
 * Auth: Bearer <participant token>. Tylko własne zdjęcia.
 */
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
    const { slug } = await ctx.params;
    const tk = getToken(request);
    if (!tk) return NextResponse.json({ error: 'Brak tokenu' }, { status: 401 });
    const payload = await verifyParticipantToken(tk);
    if (!payload) return NextResponse.json({ error: 'Token nieważny' }, { status: 401 });

    const ws = await prisma.workshop.findUnique({ where: { slug }, select: { id: true } });
    if (!ws || ws.id !== payload.wid) {
        return NextResponse.json({ error: 'Nie pasuje do warsztatu' }, { status: 403 });
    }

    const url = new URL(request.url);
    const idStr = url.searchParams.get('id');
    const id = idStr ? parseInt(idStr, 10) : 0;
    if (!id) return NextResponse.json({ error: 'Brak id' }, { status: 400 });

    const u = await prisma.workshopUpload.findFirst({
        where: { id, workshop_id: ws.id, participant_id: payload.pid },
    });
    if (!u) return NextResponse.json({ error: 'Nie znaleziono lub brak praw' }, { status: 404 });

    await prisma.workshopUpload.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}
