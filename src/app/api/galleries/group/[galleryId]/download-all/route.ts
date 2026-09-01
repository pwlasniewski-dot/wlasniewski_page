import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import prisma from '@/lib/db/prisma';
import { acquireExtendedAdvisoryTransactionLock } from '@/lib/db/advisoryLock';
import { extractTokenFromHeader, verifyParentToken } from '@/lib/auth/parent-jwt';
import {
  createGalleryArchiveJobId,
  createGalleryArchiveContentFingerprint,
  dispatchGalleryArchive,
  newGalleryArchiveJob,
  readGalleryArchiveJob,
  writeGalleryArchiveJob,
} from '@/lib/galleries/archive-jobs';
import { getPrivateS3DownloadUrl } from '@/lib/storage/s3';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function authorize(request: NextRequest, galleryId: number) {
  const token = extractTokenFromHeader(request.headers.get('authorization'));
  const payload = token ? await verifyParentToken(token) : null;
  if (!payload) return { response: NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 }) };
  if (payload.gallery_id !== galleryId || payload.participant_id <= 0) {
    return { response: NextResponse.json({ error: 'Brak dostępu' }, { status: 403 }) };
  }
  const [participant, gallery] = await Promise.all([
    prisma.galleryParticipant.findFirst({
      where: { id: payload.participant_id, gallery_id: galleryId },
      select: { id: true, parent_identifier: true },
    }),
    prisma.clientGallery.findFirst({
      where: { id: galleryId, gallery_mode: 'GROUP', is_active: true },
      include: { photos: { orderBy: { order_index: 'asc' } } },
    }),
  ]);
  if (!participant || !gallery || (gallery.expires_at && gallery.expires_at < new Date())) {
    return { response: NextResponse.json({ error: 'Galeria niedostępna' }, { status: 403 }) };
  }
  return { participant, gallery };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ galleryId: string }> }) {
  const galleryId = Number((await params).galleryId);
  if (!Number.isInteger(galleryId)) return NextResponse.json({ error: 'Nieprawidłowe ID' }, { status: 400 });
  const loaded = await authorize(request, galleryId);
  if ('response' in loaded) return loaded.response;
  const correlationId = randomUUID();
  const jobId = request.nextUrl.searchParams.get('job_id') || '';
  const job = await readGalleryArchiveJob(jobId).catch(() => null);
  if (!job || job.kind !== 'group' || job.galleryId !== galleryId || (job.participantId !== null && job.participantId !== loaded.participant.id)) {
    return NextResponse.json({ error: 'Nie znaleziono zadania' }, { status: 404 });
  }
  const expired = new Date(job.expiresAt) <= new Date();
  const downloadUrl = job.status === 'ready' && job.zipKey && !expired
    ? await getPrivateS3DownloadUrl(job.zipKey, 15 * 60)
    : undefined;
  if (downloadUrl) {
    await prisma.groupGalleryActivity.create({
      data: {
        gallery_id: galleryId,
        participant_id: loaded.participant.id,
        action: 'DOWNLOAD_ARCHIVE_LINK_ISSUED',
        result: 'SUCCESS',
        correlation_id: randomUUID(),
        details: { job_id: job.jobId, run_id: job.runId, completed: job.completed, failed_count: job.failedCount },
      },
    });
  }
  return NextResponse.json({
    jobId: job.jobId, status: expired ? 'failed' : job.status,
    progress: job.progress, total: job.total, completed: job.completed,
    failedCount: job.failedCount, error: expired ? 'Paczka wygasła. Uruchom przygotowanie ponownie.' : job.error,
    fileName: job.fileName, expiresAt: job.expiresAt, downloadUrl,
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ galleryId: string }> }) {
  const galleryId = Number((await params).galleryId);
  if (!Number.isInteger(galleryId)) return NextResponse.json({ error: 'Nieprawidłowe ID' }, { status: 400 });
  const loaded = await authorize(request, galleryId);
  if ('response' in loaded) return loaded.response;
  const body = await request.json().catch(() => ({}));
  const rawIds = Array.isArray(body.photoIds) ? body.photoIds : [];
  const requestedPhotoIds = [...new Set(rawIds.map(Number).filter((id: number) => Number.isInteger(id) && id > 0))] as number[];
  const target = requestedPhotoIds.length
    ? loaded.gallery.photos.filter(photo => requestedPhotoIds.includes(photo.id))
    : loaded.gallery.photos;
  if (requestedPhotoIds.length && target.length !== requestedPhotoIds.length) {
    return NextResponse.json({ error: 'Co najmniej jedno zdjęcie nie należy do tej galerii' }, { status: 404 });
  }
  if (!target.length) return NextResponse.json({ error: 'Brak zdjęć do pobrania' }, { status: 404 });
  const missingHq = target.filter(photo => !photo.download_source_url).length;
  if (missingHq) {
    await recordAdminIncidentSafely({
      severity: 'P1',
      category: 'GALLERY_DELIVERY',
      reasonCode: 'GROUP_ARCHIVE_HQ_MISSING',
      summary: `Nie można przygotować pełnej paczki galerii #${galleryId}: brakuje ${missingHq} plików JPG HQ`,
      entityType: 'gallery',
      entityId: galleryId,
      correlationId,
      details: { participant_id: loaded.participant.id, requested_count: target.length, missing_hq_count: missingHq },
    });
    return NextResponse.json({ error: `${missingHq} zdjęć nie ma przygotowanego JPG HQ. Administrator otrzymał zgłoszenie.` }, { status: 409 });
  }

  const contentFingerprint = createGalleryArchiveContentFingerprint(target);
  const jobId = createGalleryArchiveJobId({
    kind: 'group', galleryId, participantId: null,
    requestedPhotoIds, galleryUpdatedAt: loaded.gallery.updated_at, contentFingerprint,
  });
  await prisma.groupGalleryActivity.create({
    data: {
      gallery_id: galleryId,
      participant_id: loaded.participant.id,
      action: 'DOWNLOAD_ARCHIVE_REQUESTED',
      result: 'SUCCESS',
      correlation_id: correlationId,
      details: { job_id: jobId, requested_count: requestedPhotoIds.length || target.length },
    },
  });

  // A PostgreSQL transaction advisory lock makes read -> create atomic for a
  // given content job across all Netlify instances. S3's per-run worker lock
  // then protects against a duplicate delivery of the same dispatch token.
  const claim = await prisma.$transaction(async (transaction) => {
    await acquireExtendedAdvisoryTransactionLock(transaction, jobId);
    const previous = await readGalleryArchiveJob(jobId);
    if (previous && ['queued', 'processing', 'ready'].includes(previous.status) && new Date(previous.expiresAt) > new Date()) {
      return { created: false as const, job: previous };
    }
    const job = newGalleryArchiveJob({
      jobId, kind: 'group', galleryId, participantId: null,
      requestedPhotoIds, contentFingerprint, previousCreatedAt: previous?.createdAt,
    });
    await writeGalleryArchiveJob(job);
    return { created: true as const, job };
  }, { timeout: 15_000 });

  if (!claim.created) {
    await prisma.groupGalleryActivity.create({
      data: {
        gallery_id: galleryId,
        participant_id: loaded.participant.id,
        action: 'DOWNLOAD_ARCHIVE_REUSED',
        result: 'SUCCESS',
        correlation_id: correlationId,
        details: { job_id: jobId, run_id: claim.job.runId, requested_count: requestedPhotoIds.length || target.length, status: claim.job.status },
      },
    });
    return NextResponse.json({ jobId, status: claim.job.status }, { status: claim.job.status === 'ready' ? 200 : 202 });
  }
  await prisma.groupGalleryActivity.create({
    data: {
      gallery_id: galleryId,
      participant_id: loaded.participant.id,
      action: 'DOWNLOAD_ARCHIVE_CREATED',
      result: 'SUCCESS',
      correlation_id: correlationId,
      details: { job_id: jobId, run_id: claim.job.runId, requested_count: requestedPhotoIds.length || target.length },
    },
  });
  try {
    await dispatchGalleryArchive(request.nextUrl.origin, claim.job);
  } catch (error) {
    claim.job.status = 'failed';
    claim.job.error = error instanceof Error ? error.message : String(error);
    await writeGalleryArchiveJob(claim.job);
    await prisma.groupGalleryActivity.create({
      data: {
        gallery_id: galleryId,
        participant_id: loaded.participant.id,
        action: 'DOWNLOAD_ARCHIVE_DISPATCH_FAILED',
        result: 'ERROR',
        correlation_id: correlationId,
        details: { job_id: jobId, run_id: claim.job.runId, error: (claim.job.error || 'Dispatch failed').slice(0, 500) },
      },
    });
    return NextResponse.json({ error: claim.job.error }, { status: 502 });
  }
  return NextResponse.json({ jobId, status: 'queued' }, { status: 202 });
}
