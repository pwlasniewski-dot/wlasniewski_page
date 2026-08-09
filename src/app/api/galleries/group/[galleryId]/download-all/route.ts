import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { extractTokenFromHeader, verifyParentToken } from '@/lib/auth/parent-jwt';
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

async function authorize(request: NextRequest, galleryId: number) {
  const token = extractTokenFromHeader(request.headers.get('authorization'));
  const payload = token ? await verifyParentToken(token) : null;
  if (!payload) return { response: NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 }) };
  if (payload.gallery_id !== galleryId || payload.participant_id <= 0) {
    return { response: NextResponse.json({ error: 'Brak dostępu' }, { status: 403 }) };
  }
  const [participant, gallery] = await Promise.all([
    prisma.galleryParticipant.findFirst({ where: { id: payload.participant_id, gallery_id: galleryId }, select: { id: true } }),
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
  const jobId = request.nextUrl.searchParams.get('job_id') || '';
  const job = await readGalleryArchiveJob(jobId).catch(() => null);
  if (!job || job.kind !== 'group' || job.galleryId !== galleryId || job.participantId !== loaded.participant.id) {
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
  if (!target.length) return NextResponse.json({ error: 'Brak zdjęć do pobrania' }, { status: 404 });
  const missingHq = target.filter(photo => !photo.download_source_url).length;
  if (missingHq) return NextResponse.json({ error: `${missingHq} zdjęć nie ma przygotowanego JPG HQ.` }, { status: 409 });

  const jobId = createGalleryArchiveJobId({
    kind: 'group', galleryId, participantId: loaded.participant.id,
    requestedPhotoIds, galleryUpdatedAt: loaded.gallery.updated_at,
  });
  const previous = await readGalleryArchiveJob(jobId);
  if (previous && ['queued', 'processing', 'ready'].includes(previous.status) && new Date(previous.expiresAt) > new Date()) {
    return NextResponse.json({ jobId, status: previous.status }, { status: previous.status === 'ready' ? 200 : 202 });
  }
  const job = newGalleryArchiveJob({
    jobId, kind: 'group', galleryId, participantId: loaded.participant.id,
    requestedPhotoIds, previousCreatedAt: previous?.createdAt,
  });
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
