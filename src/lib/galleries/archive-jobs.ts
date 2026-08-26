import { randomUUID } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { getPrivateJson, putPrivateJson } from '@/lib/storage/s3';
export { createGalleryArchiveContentFingerprint, createGalleryArchiveJobId } from './archive-content';

export type GalleryArchiveKind = 'individual' | 'group';
export type GalleryArchiveStatus = 'queued' | 'processing' | 'ready' | 'failed';

export type GalleryArchiveJob = {
    version: 1;
    jobId: string;
    runId: string;
    kind: GalleryArchiveKind;
    galleryId: number;
    participantId: number | null;
    requestedPhotoIds: number[];
    contentFingerprint?: string;
    status: GalleryArchiveStatus;
    progress: number;
    total: number;
    completed: number;
    failedCount: number;
    error?: string;
    zipKey?: string;
    fileName?: string;
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
};

const JOB_PREFIX = 'private/gallery-archive-jobs';

function secret() {
    const value = process.env.JWT_SECRET;
    if (!value || value.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
    return new TextEncoder().encode(value);
}

export function galleryArchiveJobKey(jobId: string) {
    if (!/^[a-f0-9]{64}$/.test(jobId)) throw new Error('Invalid gallery archive job id');
    return `${JOB_PREFIX}/${jobId}.json`;
}

export function galleryArchiveLockKey(jobId: string, runId: string) {
    if (!/^[0-9a-f-]{36}$/.test(runId)) throw new Error('Invalid gallery archive run id');
    return `${JOB_PREFIX}/locks/${jobId}-${runId}.json`;
}

export function newGalleryArchiveJob(input: {
    jobId: string;
    kind: GalleryArchiveKind;
    galleryId: number;
    participantId: number | null;
    requestedPhotoIds: number[];
    contentFingerprint?: string;
    previousCreatedAt?: string;
}): GalleryArchiveJob {
    const now = new Date();
    return {
        version: 1,
        jobId: input.jobId,
        runId: randomUUID(),
        kind: input.kind,
        galleryId: input.galleryId,
        participantId: input.participantId,
        requestedPhotoIds: [...new Set(input.requestedPhotoIds)].sort((a, b) => a - b),
        contentFingerprint: input.contentFingerprint,
        status: 'queued',
        progress: 0,
        total: 0,
        completed: 0,
        failedCount: 0,
        createdAt: input.previousCreatedAt || now.toISOString(),
        updatedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    };
}

export async function readGalleryArchiveJob(jobId: string) {
    return getPrivateJson<GalleryArchiveJob>(galleryArchiveJobKey(jobId));
}

export async function writeGalleryArchiveJob(job: GalleryArchiveJob) {
    job.updatedAt = new Date().toISOString();
    await putPrivateJson(galleryArchiveJobKey(job.jobId), job);
}

export async function createGalleryArchiveDispatchToken(job: GalleryArchiveJob) {
    return new SignJWT({ jobId: job.jobId, runId: job.runId })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('20m')
        .setAudience('gallery-archive-worker')
        .sign(secret());
}

export async function verifyGalleryArchiveDispatchToken(token: string) {
    const result = await jwtVerify(token, secret(), { audience: 'gallery-archive-worker' });
    const jobId = result.payload.jobId;
    const runId = result.payload.runId;
    if (typeof jobId !== 'string' || typeof runId !== 'string') throw new Error('Invalid dispatch token');
    return { jobId, runId };
}

export async function dispatchGalleryArchive(origin: string, job: GalleryArchiveJob) {
    const token = await createGalleryArchiveDispatchToken(job);
    const response = await fetch(`${origin}/.netlify/functions/gallery-archive-background`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
        cache: 'no-store',
    });
    if (!response.ok && response.status !== 202) {
        throw new Error(`Nie udało się uruchomić generatora ZIP (HTTP ${response.status})`);
    }
}
