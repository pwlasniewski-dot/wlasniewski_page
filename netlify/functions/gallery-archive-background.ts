import prisma from '../../src/lib/db/prisma';
import { buildGalleryArchive } from '../../src/lib/galleries/build-gallery-archive';
import {
    readGalleryArchiveJob,
    verifyGalleryArchiveDispatchToken,
    writeGalleryArchiveJob,
} from '../../src/lib/galleries/archive-jobs';

function safeFileName(value: string) {
    return (value || 'galeria').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'galeria';
}

export const handler = async (event: { body?: string | null }) => {
    try {
        const body = JSON.parse(event.body || '{}');
        if (typeof body.token !== 'string') return { statusCode: 401 };
        const dispatch = await verifyGalleryArchiveDispatchToken(body.token);
        const job = await readGalleryArchiveJob(dispatch.jobId);
        if (!job || job.runId !== dispatch.runId) return { statusCode: 202 };
        if (job.status === 'ready') return { statusCode: 202 };

        const gallery = await prisma.clientGallery.findUnique({
            where: { id: job.galleryId },
            include: {
                photos: { orderBy: { order_index: 'asc' } },
                orders: job.kind === 'individual' ? {
                    where: { payment_status: 'paid' }, select: { photo_ids: true },
                } : false,
            },
        });
        if (!gallery || !gallery.is_active || (gallery.expires_at && gallery.expires_at < new Date())) {
            throw new Error('Galeria jest niedostępna lub wygasła');
        }
        if (job.kind === 'group' && gallery.gallery_mode !== 'GROUP') throw new Error('Nieprawidłowy tryb galerii');
        if (job.kind === 'individual' && gallery.gallery_mode === 'GROUP') throw new Error('Nieprawidłowy tryb galerii');

        let allowedIds: Set<number>;
        if (job.kind === 'individual') {
            const purchased = new Set<number>();
            for (const order of gallery.orders) {
                try {
                    const ids = JSON.parse(order.photo_ids);
                    if (Array.isArray(ids)) ids.forEach(id => Number.isInteger(id) && purchased.add(id));
                } catch { /* invalid legacy row is ignored */ }
            }
            allowedIds = new Set(gallery.photos.filter(photo => photo.is_standard || purchased.has(photo.id)).map(p => p.id));
        } else {
            allowedIds = new Set(gallery.photos.map(photo => photo.id));
        }
        if (job.requestedPhotoIds.length) {
            const requested = new Set(job.requestedPhotoIds);
            allowedIds = new Set([...allowedIds].filter(id => requested.has(id)));
        }
        const photos = gallery.photos
            .filter(photo => allowedIds.has(photo.id) && !!photo.download_source_url)
            .map(photo => ({ id: photo.id, downloadSourceUrl: photo.download_source_url! }));
        if (!photos.length) throw new Error('Brak przygotowanych plików JPG HQ');

        job.status = 'processing';
        job.total = photos.length;
        job.progress = 0;
        await writeGalleryArchiveJob(job);

        const fileName = job.kind === 'individual'
            ? `${safeFileName(gallery.client_name)}-zdjecia-jpg.zip`
            : `galeria-${gallery.id}-${photos.length}-zdjec-jpg.zip`;
        const zipKey = `private/gallery-zips/${job.jobId}/${job.runId}.zip`;
        const result = await buildGalleryArchive({
            jobId: job.jobId,
            runId: job.runId,
            photos,
            zipKey,
            fileName,
            onProgress: async (completed, failed, total) => {
                const current = await readGalleryArchiveJob(job.jobId);
                if (!current || current.runId !== job.runId) throw new Error('Zadanie zostało zastąpione');
                current.status = 'processing';
                current.completed = completed;
                current.failedCount = failed;
                current.total = total;
                current.progress = Math.min(99, Math.round(((completed + failed) / total) * 100));
                await writeGalleryArchiveJob(current);
            },
        });
        if (result.duplicate) return { statusCode: 202 };
        const current = await readGalleryArchiveJob(job.jobId);
        if (!current || current.runId !== job.runId) return { statusCode: 202 };
        current.status = 'ready';
        current.progress = 100;
        current.completed = result.completed;
        current.failedCount = result.failed;
        current.zipKey = zipKey;
        current.fileName = fileName;
        await writeGalleryArchiveJob(current);
        return { statusCode: 202 };
    } catch (error) {
        console.error('[GALLERY_ARCHIVE_BACKGROUND]', error);
        try {
            const body = JSON.parse(event.body || '{}');
            const dispatch = typeof body.token === 'string' ? await verifyGalleryArchiveDispatchToken(body.token) : null;
            if (dispatch) {
                const job = await readGalleryArchiveJob(dispatch.jobId);
                if (job && job.runId === dispatch.runId) {
                    job.status = 'failed';
                    job.error = (error instanceof Error ? error.message : String(error)).slice(0, 500);
                    await writeGalleryArchiveJob(job);
                }
            }
        } catch { /* do not hide the original worker failure */ }
        return { statusCode: 202 };
    }
};
