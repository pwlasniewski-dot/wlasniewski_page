import archiver from 'archiver';
import { PassThrough, Readable } from 'stream';
import { createPrivateJsonIfAbsent, getPrivateS3Object, uploadPrivateStreamToS3 } from '@/lib/storage/s3';

export type ArchivePhoto = { id: number; downloadSourceUrl: string };
type ArchiveSource = Awaited<ReturnType<typeof getPrivateS3Object>>;
type ArchiveDependencies = {
    acquireLock?: (key: string) => Promise<boolean>;
    getSource?: (url: string) => Promise<ArchiveSource>;
    upload?: (stream: Readable, key: string, fileName: string) => Promise<unknown>;
};

function waitForStream(stream: NodeJS.ReadableStream): Promise<void> {
    return new Promise((resolve, reject) => {
        stream.once('end', resolve);
        stream.once('error', reject);
    });
}

async function withRetry<T>(operation: () => Promise<T>, retries = 3): Promise<T> {
    let last: unknown;
    for (let attempt = 1; attempt <= retries; attempt += 1) {
        try { return await operation(); } catch (error) {
            last = error;
            if (attempt < retries) await new Promise(resolve => setTimeout(resolve, 250 * 2 ** (attempt - 1)));
        }
    }
    throw last;
}

export async function buildGalleryArchive(input: {
    jobId: string;
    runId: string;
    photos: ArchivePhoto[];
    zipKey: string;
    fileName: string;
    onProgress?: (completed: number, failed: number, total: number) => Promise<void>;
    dependencies?: ArchiveDependencies;
}) {
    const lockKey = `private/gallery-archive-jobs/locks/${input.jobId}-${input.runId}.json`;
    const lockAcquired = input.dependencies?.acquireLock
        ? await input.dependencies.acquireLock(lockKey)
        : await createPrivateJsonIfAbsent(lockKey, { acquiredAt: new Date().toISOString() });
    if (!lockAcquired) return { duplicate: true as const, completed: 0, failed: 0 };

    const archive = archiver('zip', { store: true, forceZip64: true, highWaterMark: 1024 * 1024 });
    const output = new PassThrough({ highWaterMark: 1024 * 1024 });
    archive.pipe(output);
    const upload = input.dependencies?.upload
        ? input.dependencies.upload(output, input.zipKey, input.fileName)
        : uploadPrivateStreamToS3(
            output,
            input.zipKey,
            'application/zip',
            `attachment; filename="${input.fileName.replace(/["\\\r\n]/g, '-')}"`,
        );

    let completed = 0;
    let failed = 0;
    const failures: string[] = [];
    try {
        for (const [index, photo] of input.photos.entries()) {
            try {
                const source = await withRetry(() => input.dependencies?.getSource
                    ? input.dependencies.getSource(photo.downloadSourceUrl)
                    : getPrivateS3Object(photo.downloadSourceUrl));
                if (!source.contentType.includes('jpeg') && !source.contentType.includes('jpg')) {
                    throw new Error(`Nieprawidłowy typ: ${source.contentType || 'brak'}`);
                }
                if (source.contentLength && source.contentLength > 80 * 1024 * 1024) {
                    throw new Error('Plik przekracza 80 MB');
                }
                const sourceStream = Readable.fromWeb(source.body.transformToWebStream() as never);
                archive.append(sourceStream, {
                    name: `${String(index + 1).padStart(4, '0')}-photo-${photo.id}.jpg`,
                });
                await waitForStream(sourceStream);
                completed += 1;
            } catch (error) {
                failed += 1;
                failures.push(`Zdjęcie ${photo.id}: ${error instanceof Error ? error.message : String(error)}`);
            }
            if (input.onProgress && ((index + 1) % 5 === 0 || index + 1 === input.photos.length)) {
                await input.onProgress(completed, failed, input.photos.length);
            }
        }
        // A customer archive is atomic: never publish a deceptively "ready" ZIP
        // with missing photos. A repeated POST creates a fresh run after failure.
        if (failures.length) {
            throw new Error(`Nie udało się pobrać ${failures.length} z ${input.photos.length} zdjęć po 3 próbach. ${failures[0]}`);
        }
        if (!completed) throw new Error('Nie udało się pobrać żadnego zdjęcia JPG HQ');
        await archive.finalize();
        await upload;
        return { duplicate: false as const, completed, failed };
    } catch (error) {
        archive.abort();
        output.destroy(error instanceof Error ? error : new Error(String(error)));
        await upload.catch(() => undefined);
        throw error;
    }
}
