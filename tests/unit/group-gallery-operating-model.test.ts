import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function source(relativePath: string) {
    return readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8');
}

test('group digital downloads are independent from print selections and paid orders', () => {
    const single = source('src/app/api/galleries/group/[galleryId]/download/[photoId]/route.ts');
    const bulk = source('src/app/api/galleries/group/[galleryId]/download-all/route.ts');

    assert.doesNotMatch(single, /photoSelection|photoOrder|selection_status|paid_extra/i);
    assert.doesNotMatch(bulk, /group-entitlements|downloadablePhotoIdSet|group_download_policy/i);
    assert.match(single, /gallery_id:\s*galleryId/);
    assert.match(bulk, /participantId:\s*null/);
});

test('group archive build is shared by content and claimed atomically', () => {
    const route = source('src/app/api/galleries/group/[galleryId]/download-all/route.ts');
    assert.match(route, /createGalleryArchiveContentFingerprint\(target\)/);
    assert.match(route, /pg_advisory_xact_lock/);
    assert.match(route, /DOWNLOAD_ARCHIVE_REUSED/);
    assert.match(route, /DOWNLOAD_ARCHIVE_LINK_ISSUED/);
});

test('Adobe remains visible to a registered parent but is not exposed by entry auth', () => {
    const entryAuth = source('src/app/api/galleries/group/auth/route.ts');
    const register = source('src/app/api/galleries/group/register/route.ts');
    const magicVerify = source('src/app/api/galleries/group/login-email/verify/route.ts');
    const page = source('src/app/galeria/grupowa/page.tsx');

    assert.doesNotMatch(entryAuth, /external_download_url/);
    assert.match(register, /external_download_url/);
    assert.match(magicVerify, /external_download_url/);
    assert.match(page, /Pobierz całą galerię w Adobe/);
    assert.match(page, /auditExternalDownload/);
});

test('admin no longer starts a browser download loop for every parent', () => {
    const manager = source('src/components/admin/GalleryParticipantsManager.tsx');
    assert.doesNotMatch(manager, /downloadPerParentPackages|Pobierz paczki per rodzic/);
    assert.match(manager, /participants\/download-all\?layout=nphoto/);
});

test('project documentation defines selections as print-only', () => {
    const documentation = source('docs/GROUP_GALLERY_SELECTION.md');
    assert.match(documentation, /Wybór zdjęć nie jest uprawnieniem do plików cyfrowych/);
    assert.match(documentation, /link Adobe pozostaje częścią procesu/);
    assert.match(documentation, /NO-GO dla produkcji/);
});
