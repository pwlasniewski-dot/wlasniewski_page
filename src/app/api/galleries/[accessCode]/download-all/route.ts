import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { authorizeIndividualGallery, galleryAccessDenied } from '@/lib/galleries/individual-access';
import {
    createGalleryArchiveJobId,
    dispatchGalleryArchive,
    newGalleryArchiveJob,
    readGalleryArchiveJob,
    writeGalleryArchiveJob,
} from '@/lib/galleries/archive-jobs';
import { getPrivateS3DownloadUrl } from '@/lib/storage/s3';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function loadGallery(request: NextRequest, accessCode: string) {
    const gallery = await prisma.clientGallery.findUnique({
        where: { access_code: accessCode },
        include: {
            photos: { orderBy: { order_index: 'asc' } },
            orders: { where: { payment_status: 'paid' }, select: { photo_ids: true } },
        },
    });
    if (!gallery || !gallery.is_active || (gallery.expires_at && gallery.expires_at < new Date())) {
        return { response: NextResponse.json({ error: 'Galeria niedostępna' }, { status: 403 }) };
    }
    const access = await authorizeIndividualGallery(request, gallery);
    if (!access.allowed) return { response: galleryAccessDenied(access) };
    const purchased = new Set<number>();
    gallery.orders.forEach(order => {
        try {
            const ids = JSON.parse(order.photo_ids);
            if (Array.isArray(ids)) ids.forEach(id => Number.isInteger(id) && purchased.add(id));
        } catch { /* ignore invalid legacy order */ }
    });
    const photos = gallery.photos.filter(photo => photo.is_standard || purchased.has(photo.id));
    return { gallery, photos };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ accessCode: string }> }) {
    const { accessCode } = await params;
    const loaded = await loadGallery(request, accessCode);
    if ('response' in loaded) return loaded.response;
    const { gallery, photos } = loaded;
    if (request.nextUrl.searchParams.get('preflight') === '1') {
        const missingHq = photos.filter(photo => !photo.download_source_url).length;
        return NextResponse.json({
            ok: missingHq === 0 && photos.length > 0,
            photoCount: photos.length,
            missingHq,
            ...(missingHq ? { error: `${missingHq} zdjęć nie ma przygotowanego JPG HQ.` } : {}),
        }, { status: missingHq || !photos.length ? 409 : 200 });
    }
    const jobId = request.nextUrl.searchParams.get('job_id') || '';
    const job = await readGalleryArchiveJob(jobId).catch(() => null);
    if (!job || job.kind !== 'individual' || job.galleryId !== gallery.id) {
        return NextResponse.json({ error: 'Nie znaleziono zadania' }, { status: 404 });
    }
    const expired = new Date(job.expiresAt) <= new Date();
    const downloadUrl = job.status === 'ready' && job.zipKey && !expired
        ? await getPrivateS3DownloadUrl(job.zipKey, 15 * 60)
        : undefined;
    return NextResponse.json({
        jobId: job.jobId, status: expired ? 'failed' : job.status,
        progress: job.progress, total: job.total, completed: job.completed,
        failedCount: job.failedCount, error: expired ? 'Paczka wygasła. Uruchom przygotowanie ponownie.' : job.error,
        fileName: job.fileName, expiresAt: job.expiresAt, downloadUrl,
    });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ accessCode: string }> }) {
    const { accessCode } = await params;
    const loaded = await loadGallery(request, accessCode);
    if ('response' in loaded) return loaded.response;
    const { gallery, photos } = loaded;
    if (!photos.length) return NextResponse.json({ error: 'Brak zdjęć do pobrania' }, { status: 404 });
    const missingHq = photos.filter(photo => !photo.download_source_url).length;
    if (missingHq) return NextResponse.json({ error: `${missingHq} zdjęć nie ma przygotowanego JPG HQ.` }, { status: 409 });
    const jobId = createGalleryArchiveJobId({
        kind: 'individual', galleryId: gallery.id, participantId: null,
        requestedPhotoIds: [], galleryUpdatedAt: gallery.updated_at,
    });
    const previous = await readGalleryArchiveJob(jobId);
    if (previous && ['queued', 'processing', 'ready'].includes(previous.status) && new Date(previous.expiresAt) > new Date()) {
        return NextResponse.json({ jobId, status: previous.status }, { status: previous.status === 'ready' ? 200 : 202 });
    }
    const job = newGalleryArchiveJob({ jobId, kind: 'individual', galleryId: gallery.id, participantId: null, requestedPhotoIds: [], previousCreatedAt: previous?.createdAt });
    await writeGalleryArchiveJob(job);
    try {
        await dispatchGalleryArchive(request.nextUrl.origin, job);
    } catch (error) {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : String(error);
        await writeGalleryArchiveJob(job);
        return NextResponse.json({ error: job.error }, { status: 502 });
    }
    return NextResponse.json({ jobId, status: 'queued' }, { status: 202 });
}
