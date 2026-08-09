import assert from 'node:assert/strict';
import test from 'node:test';
import { Readable } from 'node:stream';
import { buildGalleryArchive } from '../../src/lib/galleries/build-gallery-archive';

for (const count of [10, 50, 100, 300]) {
    test(`gallery archive streams ${count} JPG files without buffering the ZIP`, async () => {
        let uploadedBytes = 0;
        let lastProgress = 0;
        const result = await buildGalleryArchive({
            jobId: 'a'.repeat(64),
            runId: '00000000-0000-4000-8000-000000000000',
            zipKey: `test/${count}.zip`,
            fileName: 'galeria.zip',
            photos: Array.from({ length: count }, (_, index) => ({ id: index + 1, downloadSourceUrl: `photo-${index + 1}` })),
            onProgress: async (completed, failed, total) => {
                assert.equal(failed, 0);
                assert.equal(total, count);
                assert.ok(completed >= lastProgress);
                lastProgress = completed;
            },
            dependencies: {
                acquireLock: async () => true,
                getSource: async url => {
                    const body = Buffer.from(`\xff\xd8${url}\xff\xd9`);
                    const stream = Readable.toWeb(Readable.from(body)) as any;
                    return {
                        body: { transformToWebStream: () => stream } as any,
                        contentType: 'image/jpeg',
                        contentLength: body.length,
                        key: url,
                    };
                },
                upload: async stream => {
                    for await (const chunk of stream) uploadedBytes += Buffer.byteLength(chunk);
                },
            },
        });
        assert.equal(result.duplicate, false);
        assert.equal(result.completed, count);
        assert.equal(result.failed, 0);
        assert.equal(lastProgress, count);
        assert.ok(uploadedBytes > count * 30);
    });
}

test('gallery archive worker lock makes duplicate runs idempotent', async () => {
    let sourceReads = 0;
    const result = await buildGalleryArchive({
        jobId: 'b'.repeat(64), runId: '00000000-0000-4000-8000-000000000000',
        zipKey: 'test/duplicate.zip', fileName: 'duplicate.zip',
        photos: [{ id: 1, downloadSourceUrl: 'photo-1' }],
        dependencies: {
            acquireLock: async () => false,
            getSource: async () => { sourceReads += 1; throw new Error('must not run'); },
            upload: async () => undefined,
        },
    });
    assert.equal(result.duplicate, true);
    assert.equal(sourceReads, 0);
});

test('gallery archive retries a transient S3 read three times', async () => {
    let reads = 0;
    const result = await buildGalleryArchive({
        jobId: 'c'.repeat(64), runId: '00000000-0000-4000-8000-000000000000',
        zipKey: 'test/retry.zip', fileName: 'retry.zip', photos: [{ id: 1, downloadSourceUrl: 'photo-1' }],
        dependencies: {
            acquireLock: async () => true,
            getSource: async () => {
                reads += 1;
                if (reads < 3) throw new Error('transient');
                const body = Buffer.from('\xff\xd8ok\xff\xd9');
                return { body: { transformToWebStream: () => Readable.toWeb(Readable.from(body)) } as any, contentType: 'image/jpeg', contentLength: body.length, key: 'photo-1' };
            },
            upload: async stream => { for await (const _ of stream) { /* drain */ } },
        },
    });
    assert.equal(reads, 3);
    assert.equal(result.completed, 1);
});
