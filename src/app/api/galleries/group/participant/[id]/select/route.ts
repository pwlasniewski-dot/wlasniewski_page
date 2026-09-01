import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { acquirePairAdvisoryTransactionLock } from '@/lib/db/advisoryLock';
import { extractTokenFromHeader, verifyParentToken } from '@/lib/auth/parent-jwt';
import { jsonWithCorrelation } from '@/lib/http/correlation';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';

class SelectionRequestError extends Error {
  constructor(message: string, readonly status: number, readonly code: string) {
    super(message);
  }
}

async function authenticatedPayload(request: NextRequest, participantId: number) {
  const token = extractTokenFromHeader(request.headers.get('authorization'));
  const payload = token ? await verifyParentToken(token) : null;
  if (!payload) throw new SelectionRequestError('Sesja wygasła. Zaloguj się ponownie.', 401, 'INVALID_SESSION');
  if (payload.participant_id !== participantId || payload.participant_id <= 0) {
    throw new SelectionRequestError('Brak dostępu do tego profilu.', 403, 'PARTICIPANT_MISMATCH');
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
    const body = await request.json().catch(() => ({}));
    const photoId = Number(body.photo_id);
    const desiredSelected = body.selected;
    if (!Number.isInteger(participantId) || participantId <= 0
      || !Number.isInteger(photoId) || photoId <= 0
      || typeof desiredSelected !== 'boolean') {
      throw new SelectionRequestError('Podaj zdjęcie i oczekiwany stan wyboru.', 400, 'INVALID_INPUT');
    }
    const payload = await authenticatedPayload(request, participantId);

    const result = await prisma.$transaction(async tx => {
      await acquirePairAdvisoryTransactionLock(tx, 7717, participantId!);
      const participant = await tx.galleryParticipant.findUnique({
        where: { id: participantId! },
        include: {
          selections: { select: { photo_id: true } },
          gallery: { select: { id: true, gallery_mode: true, is_active: true, expires_at: true } },
        },
      });
      if (!participant
        || participant.gallery_id !== payload.gallery_id
        || participant.parent_identifier !== payload.parent_identifier
        || participant.gallery.gallery_mode !== 'GROUP') {
        throw new SelectionRequestError('Brak dostępu do tego profilu.', 403, 'STALE_OR_MISMATCHED_SESSION');
      }
      if (!participant.gallery.is_active
        || (participant.gallery.expires_at && participant.gallery.expires_at <= new Date())) {
        throw new SelectionRequestError('Galeria jest nieaktywna albo wygasła.', 403, 'GALLERY_UNAVAILABLE');
      }
      if (participant.selection_status !== 'DRAFT') {
        const message = participant.selection_status === 'LEGACY_REVIEW_REQUIRED'
          ? 'Historyczny wybór oczekuje na sprawdzenie przez administratora i nie może być samoczynnie zmieniany.'
          : 'Wybór został już zatwierdzony. Poproś administratora o ponowne otwarcie, jeśli wymaga zmiany.';
        throw new SelectionRequestError(message, 409, 'SELECTION_LOCKED');
      }
      const photo = await tx.galleryPhoto.findFirst({
        where: { id: photoId, gallery_id: participant.gallery_id },
        select: { id: true },
      });
      if (!photo) throw new SelectionRequestError('Zdjęcie nie należy do tej galerii.', 404, 'PHOTO_NOT_FOUND');

      const currentIds = participant.selections.map(item => item.photo_id);
      const exists = currentIds.includes(photoId);
      let action = 'UNCHANGED';
      if (desiredSelected && !exists) {
        if (currentIds.length >= participant.max_selections) {
          await tx.groupGalleryActivity.create({
            data: {
              gallery_id: participant.gallery_id,
              participant_id: participant.id,
              photo_id: photoId,
              action: 'SELECTION_LIMIT_REJECTED',
              result: 'REJECTED',
              correlation_id: correlationId,
              details: { selected_count: currentIds.length, max_selections: participant.max_selections },
            },
          });
          return {
            rejected: true as const,
            error: `Możesz wybrać maksymalnie ${participant.max_selections} zdjęć.`,
            code: 'SELECTION_LIMIT_REACHED',
          };
        }
        await tx.photoSelection.create({ data: { participant_id: participant.id, photo_id: photoId } });
        currentIds.push(photoId);
        action = 'ADDED';
      } else if (!desiredSelected && exists) {
        await tx.photoSelection.delete({
          where: { participant_id_photo_id: { participant_id: participant.id, photo_id: photoId } },
        });
        currentIds.splice(currentIds.indexOf(photoId), 1);
        action = 'REMOVED';
      }

      if (action !== 'UNCHANGED') {
        await tx.galleryParticipant.update({
          where: { id: participant.id },
          data: { selection_version: { increment: 1 } },
        });
      }
      await tx.groupGalleryActivity.create({
        data: {
          gallery_id: participant.gallery_id,
          participant_id: participant.id,
          photo_id: photoId,
          action: `SELECTION_${action}`,
          result: 'SUCCESS',
          correlation_id: correlationId,
          details: { desired_selected: desiredSelected, selected_count: currentIds.length },
        },
      });
      return {
        rejected: false as const,
        action: action.toLowerCase(),
        selectedPhotoIds: [...currentIds].sort((a, b) => a - b),
        maxSelections: participant.max_selections,
        selectionVersion: participant.selection_version + (action === 'UNCHANGED' ? 0 : 1),
      };
    });

    if (result.rejected) {
      return jsonWithCorrelation({ error: result.error, code: result.code }, correlationId, 409);
    }

    return jsonWithCorrelation({
      success: true,
      action: result.action,
      selected_count: result.selectedPhotoIds.length,
      selected_photo_ids: result.selectedPhotoIds,
      max_selections: result.maxSelections,
      selection_version: result.selectionVersion,
    }, correlationId);
  } catch (error) {
    if (error instanceof SelectionRequestError) {
      return jsonWithCorrelation({ error: error.message, code: error.code }, correlationId, error.status);
    }
    await recordAdminIncidentSafely({
      severity: 'P1',
      category: 'CLIENT_WRITE',
      reasonCode: 'GROUP_GALLERY_SELECTION_WRITE_FAILED',
      summary: 'Nie udało się zapisać wyboru zdjęcia w galerii grupowej',
      entityType: 'gallery_participant',
      entityId: participantId,
      correlationId,
      details: { error: error instanceof Error ? error.message : String(error) },
    });
    return jsonWithCorrelation(
      { error: 'Nie udało się zapisać wyboru. Administrator otrzymał zgłoszenie.' },
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
      throw new SelectionRequestError('Nieprawidłowy profil.', 400, 'INVALID_INPUT');
    }
    const payload = await authenticatedPayload(request, participantId);
    const participant = await prisma.galleryParticipant.findUnique({
      where: { id: participantId },
      include: {
        selections: {
          include: { photo: { select: { id: true, file_url: true, thumbnail_url: true } } },
          orderBy: { selected_at: 'asc' },
        },
        gallery: {
          select: { id: true, gallery_mode: true, is_active: true, expires_at: true, allow_extra_photo_purchase: true },
        },
      },
    });
    if (!participant
      || participant.gallery_id !== payload.gallery_id
      || participant.parent_identifier !== payload.parent_identifier
      || participant.gallery.gallery_mode !== 'GROUP') {
      throw new SelectionRequestError('Brak dostępu do tego profilu.', 403, 'STALE_OR_MISMATCHED_SESSION');
    }
    if (!participant.gallery.is_active
      || (participant.gallery.expires_at && participant.gallery.expires_at <= new Date())) {
      throw new SelectionRequestError('Galeria jest nieaktywna albo wygasła.', 403, 'GALLERY_UNAVAILABLE');
    }

    const paidOrders = await prisma.photoOrder.findMany({
      where: { gallery_id: participant.gallery_id, participant_id, payment_status: 'paid' },
      select: { photo_ids: true },
    });
    const paidExtraPhotoIds = new Set<number>();
    for (const order of paidOrders) {
      try {
        const ids = JSON.parse(order.photo_ids);
        if (Array.isArray(ids)) ids.map(Number).filter(Number.isInteger).forEach(id => paidExtraPhotoIds.add(id));
      } catch {
        // Invalid legacy payload is reported in the admin data-integrity audit.
      }
    }
    return jsonWithCorrelation({
      parent_name: participant.parent_name,
      parent_identifier: participant.parent_identifier,
      avatar: participant.avatar,
      selected_photos: participant.selections.map(selection => ({
        photo_id: selection.photo_id,
        file_url: selection.photo.file_url,
        thumbnail_url: selection.photo.thumbnail_url,
        selected_at: selection.selected_at,
      })),
      selected_count: participant.selections.length,
      max_selections: participant.max_selections,
      selection_status: participant.selection_status,
      selection_submitted_at: participant.selection_submitted_at,
      selection_version: participant.selection_version,
      publication_consent: participant.publication_consent,
      consent_scope: participant.consent_scope,
      allow_extra_photo_purchase: participant.gallery.allow_extra_photo_purchase,
      paid_extra_photo_ids: [...paidExtraPhotoIds],
    }, correlationId);
  } catch (error) {
    if (error instanceof SelectionRequestError) {
      return jsonWithCorrelation({ error: error.message, code: error.code }, correlationId, error.status);
    }
    await recordAdminIncidentSafely({
      severity: 'P1',
      category: 'CLIENT_READ',
      reasonCode: 'GROUP_GALLERY_SELECTION_LOAD_FAILED',
      summary: 'Nie udało się pobrać wyborów rodzica',
      correlationId,
      details: { error: error instanceof Error ? error.message : String(error) },
    });
    return jsonWithCorrelation({ error: 'Nie udało się pobrać wyborów.' }, correlationId, 500);
  }
}
