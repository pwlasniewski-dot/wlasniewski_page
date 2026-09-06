import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function source(relativePath: string) {
    return readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');
}

test('gallery photos bypass the Netlify binary request-body limit', () => {
    const admin = source('src/components/admin/GalleryAdmin.tsx');

    assert.match(admin, /upload\/presigned/);
    assert.match(admin, /method: 'PUT'/);
    assert.match(admin, /presignedPayload\.uploadUrl/);
    assert.match(admin, /s3Key: presignedPayload\.s3Key/);
    assert.doesNotMatch(admin, /formData\.append\('photos', fileToUpload\)/);
});

test('presigned gallery uploads are authenticated, scoped and size-limited', () => {
    const route = source('src/app/api/admin/galleries/[id]/upload/presigned/route.ts');

    assert.match(route, /withAuth/);
    assert.match(route, /30 \* 1024 \* 1024/);
    assert.match(route, /gallery-ingest\/\$\{galleryId\}\//);
    assert.match(route, /image\/jpeg/);
    assert.match(route, /getPrivateS3UploadUrl/);
});

test('finalization only accepts a temporary object owned by the selected gallery', () => {
    const route = source('src/app/api/admin/galleries/[id]/upload/route.ts');

    assert.match(route, /expectedPrefix = `gallery-ingest\/\$\{galleryId\}\//);
    assert.match(route, /temporaryS3Key\.startsWith\(expectedPrefix\)/);
    assert.match(route, /getPrivateS3Object\(temporaryS3Key\)/);
    assert.match(route, /deleteFromS3\(file\.temporaryS3Key\)/);
    assert.match(route, /file\.size <= 0/);
    assert.match(route, /ALLOWED_IMAGE_TYPES\.has\(file\.type\)/);
});
