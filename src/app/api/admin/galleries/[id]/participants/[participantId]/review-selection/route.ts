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

type ConfirmResult = {
  action: 'CONFIRM';
  status: 'SUBMITTED';
  version: number;
  photoIds: number[];
  previousStatus: string;
  parentIdentifier: string | null;
};

type ReopenResult = {
  action: 'REOPEN';
  status: 'DRAFT';
  version: number;
  photoIds: number[];
  previousStatus: string;
};

type ReviewResult = ConfirmResult | ReopenResult;

function normalizePhotoIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => Number(item))
    .filter(item => Number.isInteger(item) && item > 0);
}

function samePhotoIds(left: number[], right: number[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> },
) {
  const correlationId = randomUUID();
  let participantId: number | null = null;
  let galleryId: number | null = null;

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

    // Najważniejszy zapis operacyjny (status wyboru) jest niezależny od pomocniczych
    // tabel audytowych. Jeśli manifest/log mają problem, nie cofamy poprawnie
    // zatwierdzonego wyboru i nie blokujemy wydania opłaconego zamówienia.
    const result = await prisma.$transaction<ReviewResult>(async tx => {
      const participant = await tx.galleryParticipant.findFirst({
        where: { id: participantId!, gallery_id: galleryId! },
        include: {
          selections: {
            select: { photo_id: true },
            orderBy: { photo_id: 'asc' },
          },
        },
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

        if (updated.count !== 1) {
          throw new ReviewError('Wybór zmienił się. Odśwież panel i spróbuj ponownie.');
        }

        return {
          action: 'CONFIRM',
          status: 'SUBMITTED',
          version,
          photoIds,
          previousStatus,
          parentIdentifier: participant.parent_identifier,
        };
      }

      if (!['LEGACY_REVIEW_REQUIRED', 'SUBMITTED'].includes(participant.selection_status)) {
        throw new ReviewError('Ten wybór jest już otwarty albo nie ma stanu do ponownego otwarcia.');
      }

      const previousStatus = participant.selection_status;
      const version = participant.selection_version + 1;
      const updated = await tx.galleryParticipant.updateMany({
        where: {
          id: participant.id,
          selection_status: previousStatus,
          selection_version: expectedVersion,
        },
        data: {
          selection_status: 'DRAFT',
          selection_submitted_at: null,
          selection_version: { increment: 1 },
        },
      });

      if (updated.count !== 1) {
        throw new ReviewError('Wybór zmienił się. Odśwież panel i spróbuj ponownie.');
      }

      return {
        action: 'REOPEN',
        status: 'DRAFT',
        version,
        photoIds: participant.selections.map(selection => selection.photo_id),
        previousStatus,
      };
    });

    let auditManifestSaved = true;
    let warning: string | null = null;

    if (result.action === 'CONFIRM') {
      const canonicalPayload = JSON.stringify({
        gallery_id: galleryId,
        participant_id: participantId,
        version: result.version,
        photo_ids: result.photoIds,
      });
      const payloadHash = createHash('sha256').update(canonicalPayload).digest('hex');

      try {
        const existingManifest = await prisma.groupSelectionSubmission.findUnique({
          where: {
            participant_id_version: {
              participant_id: participantId,
              version: result.version,
            },
          },
          select: { id: true, photo_ids: true, payload_hash: true, status: true },
        });

        if (existingManifest) {
          const existingPhotoIds = normalizePhotoIds(existingManifest.photo_ids);
          if (!samePhotoIds(existingPhotoIds, result.photoIds)
            || existingManifest.payload_hash !== payloadHash) {
            auditManifestSaved = false;
            warning = 'Wybór został zatwierdzony, ale wykryto konflikt historycznego manifestu audytowego. Eksport korzysta z aktualnego, zatwierdzonego wyboru.';
            await recordAdminIncidentSafely({
              severity: 'P1',
              category: 'ADMIN_WRITE',
              reasonCode: 'GROUP_GALLERY_MANIFEST_CONFLICT_AFTER_CONFIRM',
              summary: 'Konflikt manifestu po zatwierdzeniu wyboru przez administratora',
              entityType: 'gallery_participant',
              entityId: participantId,
              correlationId,
              details: {
                gallery_id: galleryId,
                selection_version: result.version,
                current_photo_ids: result.photoIds,
                manifest_photo_ids: existingPhotoIds,
              },
            });
          } else if (existingManifest.status !== 'SUBMITTED') {
            await prisma.groupSelectionSubmission.update({
              where: { id: existingManifest.id },
              data: { status: 'SUBMITTED' },
            });
          }
        } else {
          await prisma.groupSelectionSubmission.create({
            data: {
              gallery_id: galleryId,
              participant_id: participantId,
              parent_identifier_snapshot: result.parentIdentifier,
              version: result.version,
              photo_ids: result.photoIds,
              payload_hash: payloadHash,
            },
          });
        }
      } catch (manifestError) {
        auditManifestSaved = false;
        warning = 'Wybór został zatwierdzony. Pomocniczy manifest audytowy nie został zapisany, ale nie blokuje to eksportu ZIP.';
        await recordAdminIncidentSafely({
          severity: 'P1',
          category: 'ADMIN_WRITE',
          reasonCode: 'GROUP_GALLERY_MANIFEST_AUDIT_SAVE_FAILED',
          summary: 'Zatwierdzono wybór, ale zapis manifestu audytowego nie powiódł się',
          entityType: 'gallery_participant',
          entityId: participantId,
          correlationId,
          details: {
            gallery_id: galleryId,
            selection_version: result.version,
            photo_ids: result.photoIds,
            error: manifestError instanceof Error ? manifestError.message : String(manifestError),
          },
        });
      }
    } else {
      try {
        await prisma.groupSelectionSubmission.updateMany({
          where: { participant_id: participantId, status: 'SUBMITTED' },
          data: { status: 'SUPERSEDED' },
        });
      } catch (manifestError) {
        auditManifestSaved = false;
        warning = 'Wybór został ponownie otwarty. Nie udało się zaktualizować pomocniczej historii manifestów.';
        await recordAdminIncidentSafely({
          severity: 'P2',
          category: 'ADMIN_WRITE',
          reasonCode: 'GROUP_GALLERY_MANIFEST_SUPERSEDE_FAILED',
          summary: 'Ponownie otwarto wybór, ale nie zaktualizowano historii manifestów',
          entityType: 'gallery_participant',
          entityId: participantId,
          correlationId,
          details: {
            gallery_id: galleryId,
            error: manifestError instanceof Error ? manifestError.message : String(manifestError),
          },
        });
      }
    }

    try {
      await prisma.groupGalleryActivity.create({
        data: {
          gallery_id: galleryId,
          participant_id: participantId,
          action: result.action === 'CONFIRM'
            ? (result.previousStatus === 'LEGACY_REVIEW_REQUIRED'
              ? 'LEGACY_SELECTION_CONFIRMED_BY_ADMIN'
              : 'DRAFT_SELECTION_CONFIRMED_BY_ADMIN')
            : 'SELECTION_REOPENED_BY_ADMIN',
          result: 'SUCCESS',
          correlation_id: correlationId,
          details: {
            photo_ids: result.photoIds,
            version: result.version,
            previous_status: result.previousStatus,
            audit_manifest_saved: auditManifestSaved,
          },
        },
      });
    } catch (activityError) {
      console.error('Admin gallery selection activity log failed:', activityError);
    }

    return jsonWithCorrelation({
      success: true,
      selection_status: result.status,
      selection_version: result.version,
      selected_photo_ids: result.photoIds,
      audit_manifest_saved: auditManifestSaved,
      warning,
      message: result.action === 'CONFIRM'
        ? 'Wybór został zatwierdzony do druku.'
        : 'Wybór został ponownie otwarty.',
    }, correlationId);
  } catch (error) {
    if (error instanceof ReviewError) {
      return jsonWithCorrelation({ error: error.message }, correlationId, error.status);
    }

    await recordAdminIncidentSafely({
      severity: 'P1',
      category: 'ADMIN_WRITE',
      reasonCode: 'GROUP_GALLERY_SELECTION_REVIEW_FAILED',
      summary: 'Nie udało się zmienić statusu wyboru rodzica',
      entityType: 'gallery_participant',
      entityId: participantId,
      correlationId,
      details: {
        gallery_id: galleryId,
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return jsonWithCorrelation({
      error: 'Nie udało się zmienić statusu wyboru. Szczegóły zapisano w incydentach administratora.',
      code: 'ADMIN_SELECTION_STATUS_UPDATE_FAILED',
    }, correlationId, 500);
  }
}
