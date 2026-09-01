import { createHash, randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { acquirePairAdvisoryTransactionLock } from '@/lib/db/advisoryLock';
import { extractTokenFromHeader, verifyParentToken } from '@/lib/auth/parent-jwt';
import { jsonWithCorrelation } from '@/lib/http/correlation';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';

class SubmissionError extends Error {
  constructor(message: string, readonly status: number, readonly code: string) {
    super(message);
  }
}

async function authorize(request: NextRequest, participantId: number) {
  const token = extractTokenFromHeader(request.headers.get('authorization'));
  const payload = token ? await verifyParentToken(token) : null;
  if (!payload) throw new SubmissionError('Sesja wygasła. Zaloguj się ponownie.', 401, 'INVALID_SESSION');
  if (payload.participant_id !== participantId || participantId <= 0) {
    throw new SubmissionError('Brak dostępu do tego profilu.', 403, 'PARTICIPANT_MISMATCH');
  }
  return payload;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const correlationId = randomUUID();
  let participantId: number | null = null;
  try {
    participantId = Number((await params).id);
    if (!Number.isInteger(participantId) || participantId <= 0) {
      throw new SubmissionError('Nieprawidłowy profil.', 400, 'INVALID_INPUT');
    }
    const { consent, scope, confirm_incomplete } = await request.json();
    if (typeof consent !== 'boolean' || (consent && !['ALL', 'SELECTED'].includes(scope))) {
      throw new SubmissionError('Wybierz poprawny zakres zgody na publikację.', 400, 'INVALID_CONSENT');
    }
    const payload = await authorize(request, participantId);

    const result = await prisma.$transaction(async tx => {
      await acquirePairAdvisoryTransactionLock(tx, 7717, participantId!);
      const participant = await tx.galleryParticipant.findUnique({
        where: { id: participantId! },
        include: {
          selections: { select: { photo_id: true }, orderBy: { photo_id: 'asc' } },
          gallery: { select: { id: true, gallery_mode: true, is_active: true, expires_at: true } },
        },
      });
      if (!participant
        || participant.gallery_id !== payload.gallery_id
        || participant.parent_identifier !== payload.parent_identifier
        || participant.gallery.gallery_mode !== 'GROUP') {
        throw new SubmissionError('Brak dostępu do tego profilu.', 403, 'STALE_OR_MISMATCHED_SESSION');
      }
      if (!participant.gallery.is_active
        || (participant.gallery.expires_at && participant.gallery.expires_at <= new Date())) {
        throw new SubmissionError('Galeria jest nieaktywna albo wygasła.', 403, 'GALLERY_UNAVAILABLE');
      }
      if (!participant.parent_name || !participant.parent_email) {
        throw new SubmissionError('Profil rodzica nie ma kompletnych danych.', 409, 'PARENT_DATA_INCOMPLETE');
      }
      if (participant.selection_status === 'LEGACY_REVIEW_REQUIRED') {
        throw new SubmissionError(
          'Historyczny wybór musi najpierw potwierdzić administrator. Twoje zdjęcia nie zostały usunięte.',
          409,
          'LEGACY_REVIEW_REQUIRED',
        );
      }
      const selectedPhotoIds = participant.selections.map(selection => selection.photo_id);
      if (selectedPhotoIds.length === 0) {
        throw new SubmissionError('Wybierz co najmniej jedno zdjęcie przed zatwierdzeniem.', 409, 'EMPTY_SELECTION');
      }
      if (selectedPhotoIds.length < participant.max_selections && confirm_incomplete !== true) {
        throw new SubmissionError(
          `Wybrano ${selectedPhotoIds.length} z ${participant.max_selections}. Potwierdź świadomie niepełny wybór.`,
          409,
          'INCOMPLETE_SELECTION_CONFIRMATION_REQUIRED',
        );
      }

      const now = new Date();
      const firstSubmission = participant.selection_status === 'DRAFT';
      const updated = await tx.galleryParticipant.updateMany({
        where: {
          id: participant.id,
          selection_status: participant.selection_status,
          selection_version: participant.selection_version,
        },
        data: {
          selection_status: 'SUBMITTED',
          selection_submitted_at: firstSubmission ? now : participant.selection_submitted_at,
          selection_version: { increment: firstSubmission ? 1 : 0 },
          publication_consent: consent,
          consent_scope: consent ? scope : null,
          consent_given_at: consent ? now : null,
        },
      });
      if (updated.count !== 1) {
        throw new SubmissionError('Wybór zmienił się w międzyczasie. Odśwież stronę.', 409, 'SELECTION_CHANGED');
      }
      const submissionVersion = participant.selection_version + 1;
      if (firstSubmission) {
        const canonicalPayload = JSON.stringify({
          gallery_id: participant.gallery_id,
          participant_id: participant.id,
          version: submissionVersion,
          photo_ids: selectedPhotoIds,
        });
        await tx.groupSelectionSubmission.create({
          data: {
            gallery_id: participant.gallery_id,
            participant_id: participant.id,
            parent_identifier_snapshot: participant.parent_identifier,
            version: submissionVersion,
            photo_ids: selectedPhotoIds,
            payload_hash: createHash('sha256').update(canonicalPayload).digest('hex'),
          },
        });
      }
      await tx.groupGalleryActivity.create({
        data: {
          gallery_id: participant.gallery_id,
          participant_id: participant.id,
          action: firstSubmission ? 'SELECTION_SUBMITTED' : 'CONSENT_UPDATED',
          result: 'SUCCESS',
          correlation_id: correlationId,
          details: {
            selected_count: selectedPhotoIds.length,
            max_selections: participant.max_selections,
            publication_consent: consent,
            consent_scope: consent ? scope : null,
          },
        },
      });
      return {
        firstSubmission,
        selectedCount: selectedPhotoIds.length,
        maxSelections: participant.max_selections,
        submittedAt: firstSubmission ? now : participant.selection_submitted_at,
      };
    });

    return jsonWithCorrelation({
      success: true,
      selection_status: 'SUBMITTED',
      selection_submitted_at: result.submittedAt,
      selected_count: result.selectedCount,
      max_selections: result.maxSelections,
      publication_consent: consent,
      consent_scope: consent ? scope : null,
      message: result.firstSubmission ? 'Wybór został zatwierdzony i zablokowany.' : 'Zgoda została zaktualizowana.',
    }, correlationId);
  } catch (error) {
    if (error instanceof SubmissionError) {
      return jsonWithCorrelation({ error: error.message, code: error.code }, correlationId, error.status);
    }
    await recordAdminIncidentSafely({
      severity: 'P1',
      category: 'CLIENT_WRITE',
      reasonCode: 'GROUP_GALLERY_SUBMISSION_FAILED',
      summary: 'Nie udało się zatwierdzić wyboru w galerii grupowej',
      entityType: 'gallery_participant',
      entityId: participantId,
      correlationId,
      details: { error: error instanceof Error ? error.message : String(error) },
    });
    return jsonWithCorrelation(
      { error: 'Nie udało się zatwierdzić wyboru. Administrator otrzymał zgłoszenie.' },
      correlationId,
      500,
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const correlationId = randomUUID();
  try {
    const participantId = Number((await params).id);
    if (!Number.isInteger(participantId) || participantId <= 0) {
      throw new SubmissionError('Nieprawidłowy profil.', 400, 'INVALID_INPUT');
    }
    const payload = await authorize(request, participantId);
    const participant = await prisma.galleryParticipant.findUnique({
      where: { id: participantId },
      select: {
        gallery_id: true,
        parent_identifier: true,
        publication_consent: true,
        consent_scope: true,
        consent_given_at: true,
        parent_name: true,
        selection_status: true,
        selection_submitted_at: true,
      },
    });
    if (!participant
      || participant.gallery_id !== payload.gallery_id
      || participant.parent_identifier !== payload.parent_identifier) {
      throw new SubmissionError('Brak dostępu do tego profilu.', 403, 'STALE_OR_MISMATCHED_SESSION');
    }
    return jsonWithCorrelation({
      publication_consent: participant.publication_consent,
      consent_scope: participant.consent_scope,
      consent_given_at: participant.consent_given_at,
      consent_given_by: participant.parent_name,
      selection_status: participant.selection_status,
      selection_submitted_at: participant.selection_submitted_at,
    }, correlationId);
  } catch (error) {
    if (error instanceof SubmissionError) {
      return jsonWithCorrelation({ error: error.message, code: error.code }, correlationId, error.status);
    }
    return jsonWithCorrelation({ error: 'Nie udało się pobrać statusu wyboru.' }, correlationId, 500);
  }
}
