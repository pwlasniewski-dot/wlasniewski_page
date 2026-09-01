import { createHash, randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAdminAuth } from '@/lib/auth/middleware';
import { jsonWithCorrelation } from '@/lib/http/correlation';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';

class ReviewError extends Error {
  constructor(message: string, readonly status = 409) {
    super(message);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> },
) {
  const correlationId = randomUUID();
  let participantId: number | null = null;
  let galleryId: number | null = null;
  let activity: {
    gallery_id: number;
    participant_id: number;
    action: string;
    result: string;
    correlation_id: string;
    details: Record<string, unknown>;
  } | null = null;

  try {
    const authError = await requireAdminAuth(request);
    if (authError) return authError;
    const resolved = await params;
    galleryId = Number(resolved.id);
    participantId = Number(resolved.participantId);
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || '').trim().toUpperCase();
    const expectedVersion = Number(body.expected_selection_version);
    if (!Number.isInteger(galleryId) || galleryId <= 0
      || !Number.isInteger(participantId) || participantId <= 0
      || !['CONFIRM', 'REOPEN'].includes(action)
      || !Number.isInteger(expectedVersion) || expectedVersion < 0) {
      return jsonWithCorrelation({ error: 'Nieprawidłowe dane przeglądu wyboru.' }, correlationId, 400);
    }

    const result = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(7717, ${participantId!})`;
      const participant = await tx.galleryParticipant.findFirst({
        where: { id: participantId!, gallery_id: galleryId! },
        include: { selections: { select: { photo_id: true }, orderBy: { photo_id: 'asc' } } },
      });
      if (!participant) throw new ReviewError('Nie znaleziono profilu w tej galerii.', 404);
      if (participant.selection_version !== expectedVersion) {
        throw new ReviewError('Wybór zmienił się. Odśwież panel przed zatwierdzeniem.');
      }

      if (action === 'CONFIRM') {
        const confirmableStatuses = ['LEGACY_REVIEW_REQUIRED', 'DRAFT'];
        if (!confirmableStatuses.includes(participant.selection_status)) {
          throw new ReviewError('Ten wybór nie wymaga zatwierdzenia albo został już zatwierdzony.');
        }
        const photoIds = participant.selections.map(selection => selection.photo_id);
        if (!photoIds.length || photoIds.length > participant.max_selections) {
          throw new ReviewError('Wybór jest pusty albo przekracza limit i nie może zostać zatwierdzony.');
        }

        const previousStatus = participant.selection_status;
        const version = participant.selection_version + 1;
        const canonicalPayload = JSON.stringify({
          gallery_id: galleryId,
          participant_id: participant.id,
          version,
          photo_ids: photoIds,
        });
        const payloadHash = createHash('sha256').update(canonicalPayload).digest('hex');

        const existingManifest = await tx.groupSelectionSubmission.findUnique({
          where: {
            participant_id_version: {
              participant_id: participant.id,
              version,
            },
          },
          select: { id: true, photo_ids: true, payload_hash: true, status: true },
        });

        if (existingManifest) {
          const existingPhotoIds = Array.isArray(existingManifest.photo_ids)
            ? existingManifest.photo_ids.map(value => Number(value))
            : [];
          const samePhotos = existingPhotoIds.length === photoIds.length
            && existingPhotoIds.every((value, index) => value === photoIds[index]);
          if (!samePhotos || existingManifest.payload_hash !== payloadHash) {
            throw new ReviewError(
              'Istnieje już manifest tej wersji, ale zawiera inny zestaw zdjęć. Eksport został zatrzymany dla bezpieczeństwa.',
              409,
            );
          }
          if (existingManifest.status !== 'SUBMITTED') {
            await tx.groupSelectionSubmission.update({
              where: { id: existingManifest.id },
              data: { status: 'SUBMITTED' },
            });
          }
        } else {
          await tx.groupSelectionSubmission.create({
            data: {
              gallery_id: galleryId,
              participant_id: participant.id,
              parent_identifier_snapshot: participant.parent_identifier,
              version,
              photo_ids: photoIds,
              payload_hash: payloadHash,
            },
          });
        }

        const now = new Date();
        const updated = await tx.galleryParticipant.updateMany({
          where: {
            id: participant.id,
            selection_status: previousStatus,
            selection_version: expectedVersion,
          },
          data: {
            selection_status: 'SUBMITTED',
            selection_submitted_at: now,
            selection_version: { increment: 1 },
          },
        });
        if (updated.count !== 1) throw new ReviewError('Wybór zmienił się. Odśwież panel.');

        activity = {
          gallery_id: galleryId!,
          participant_id: participant.id,
          action: previousStatus === 'LEGACY_REVIEW_REQUIRED'
            ? 'LEGACY_SELECTION_CONFIRMED_BY_ADMIN'
            : 'DRAFT_SELECTION_CONFIRMED_BY_ADMIN',
          result: 'SUCCESS',
          correlation_id: correlationId,
          details: { photo_ids: photoIds, version, previous_status: previousStatus, reused_manifest: Boolean(existingManifest) },
        };
        return { status: 'SUBMITTED', version, photoIds };
      }

      if (!['LEGACY_REVIEW_REQUIRED', 'SUBMITTED'].includes(participant.selection_status)) {
        throw new ReviewError('Ten wybór jest już otwarty albo nie ma stanu do ponownego otwarcia.');
      }
      const version = participant.selection_version + 1;
      const updated = await tx.galleryParticipant.updateMany({
        where: { id: participant.id, selection_status: participant.selection_status, selection_version: expectedVersion },
        data: {
          selection_status: 'DRAFT',
          selection_submitted_at: null,
          selection_version: { increment: 1 },
        },
      });
      if (updated.count !== 1) throw new ReviewError('Wybór zmienił się. Odśwież panel.');
      await tx.groupSelectionSubmission.updateMany({
        where: { participant_id: participant.id, status: 'SUBMITTED' },
        data: { status: 'SUPERSEDED' },
      });
      activity = {
        gallery_id: galleryId!,
        participant_id: participant.id,
        action: 'SELECTION_REOPENED_BY_ADMIN',
        result: 'SUCCESS',
        correlation_id: correlationId,
        details: { previous_status: participant.selection_status, version },
      };
      return { status: 'DRAFT', version, photoIds: participant.selections.map(selection => selection.photo_id) };
    });

    if (activity) {
      try {
        await prisma.groupGalleryActivity.create({ data: activity });
      } catch (activityError) {
        console.error('Admin gallery selection activity log failed:', activityError);
      }
    }

    return jsonWithCorrelation({
      success: true,
      selection_status: result.status,
      selection_version: result.version,
      selected_photo_ids: result.photoIds,
    }, correlationId);
  } catch (error) {
    if (error instanceof ReviewError) {
      return jsonWithCorrelation({ error: error.message }, correlationId, error.status);
    }
    await recordAdminIncidentSafely({
      severity: 'P1',
      category: 'ADMIN_WRITE',
      reasonCode: 'GROUP_GALLERY_SELECTION_REVIEW_FAILED',
      summary: 'Nie udało się zweryfikować wyboru rodzica',
      entityType: 'gallery_participant',
      entityId: participantId,
      correlationId,
      details: {
        gallery_id: galleryId,
        error: error instanceof Error ? error.message : String(error),
      },
    });
    return jsonWithCorrelation({
      error: 'Nie udało się zatwierdzić manifestu wyboru. Szczegóły zapisano w incydentach administratora.',
      code: 'ADMIN_SELECTION_CONFIRM_FAILED',
    }, correlationId, 500);
  }
}
