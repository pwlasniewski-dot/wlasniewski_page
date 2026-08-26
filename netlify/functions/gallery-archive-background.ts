import prisma from '../../src/lib/db/prisma';
import { buildGalleryArchive } from '../../src/lib/galleries/build-gallery-archive';
import {
    createGalleryArchiveContentFingerprint,
    readGalleryArchiveJob,
    verifyGalleryArchiveDispatchToken,
    writeGalleryArchiveJob,
} from '../../src/lib/galleries/archive-jobs';
import { recordAdminIncidentSafely } from '../../src/lib/admin-incidents';

function safeFileName(value: string) {
    return (value || 'galeria').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'galeria';
}

export const handler = async (event: { body?: string | null }) => {
    const handlerStartedAt = Date.now();
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
        const expectedPhotos = gallery.photos.filter(photo => allowedIds.has(photo.id));
        const photos = expectedPhotos
            .filter(photo => !!photo.download_source_url)
            .map(photo => ({ id: photo.id, downloadSourceUrl: photo.download_source_url! }));
        if (!photos.length) throw new Error('Brak przygotowanych plików JPG HQ');
        if (photos.length !== expectedPhotos.length) {
            throw new Error(`${expectedPhotos.length - photos.length} zdjęć nie ma przygotowanego pliku JPG HQ`);
        }
        if (job.contentFingerprint) {
            const currentFingerprint = createGalleryArchiveContentFingerprint(expectedPhotos);
            if (currentFingerprint !== job.contentFingerprint) {
                throw new Error('Manifest źródeł galerii zmienił się po utworzeniu zadania');
            }
        }

        job.status = 'processing';
        job.total = photos.length;
        job.progress = 0;
        await writeGalleryArchiveJob(job);
        if (job.kind === 'group') {
            await prisma.groupGalleryActivity.create({
                data: {
                    gallery_id: job.galleryId,
                    action: 'DOWNLOAD_ARCHIVE_BUILD_STARTED',
                    result: 'SUCCESS',
                    details: { job_id: job.jobId, run_id: job.runId, expected_count: photos.length },
                },
            }).catch(error => console.error('[GALLERY_ARCHIVE_AUDIT_STARTED]', error));
        }

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
        if (current.kind === 'group') {
            await prisma.groupGalleryActivity.create({
                data: {
                    gallery_id: current.galleryId,
                    action: 'DOWNLOAD_ARCHIVE_READY',
                    result: 'SUCCESS',
                    details: {
                        job_id: current.jobId,
                        run_id: current.runId,
                        completed: current.completed,
                        failed_count: current.failedCount,
                        duration_ms: Date.now() - handlerStartedAt,
                    },
                },
            }).catch(error => console.error('[GALLERY_ARCHIVE_AUDIT_READY]', error));
        }
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
                    if (job.kind === 'group') {
                        await prisma.groupGalleryActivity.create({
                            data: {
                                gallery_id: job.galleryId,
                                action: 'DOWNLOAD_ARCHIVE_FAILED',
                                result: 'ERROR',
                                details: {
                                    job_id: job.jobId,
                                    run_id: job.runId,
                                    completed: job.completed,
                                    failed_count: job.failedCount,
                                    duration_ms: Date.now() - handlerStartedAt,
                                    error: job.error,
                                },
                            },
                        }).catch(auditError => console.error('[GALLERY_ARCHIVE_AUDIT_FAILED]', auditError));
                        await recordAdminIncidentSafely({
                            severity: 'P1',
                            category: 'GALLERY_DELIVERY',
                            reasonCode: 'GROUP_ARCHIVE_BUILD_FAILED',
                            summary: `Generator ZIP galerii #${job.galleryId} zakończył się błędem`,
                            entityType: 'gallery',
                            entityId: job.galleryId,
                            details: {
                                job_id: job.jobId,
                                run_id: job.runId,
                                completed: job.completed,
                                failed_count: job.failedCount,
                                duration_ms: Date.now() - handlerStartedAt,
                                error: job.error,
                            },
                        });
                    }
                }
            }
        } catch { /* do not hide the original worker failure */ }
        return { statusCode: 202 };
    }
};
