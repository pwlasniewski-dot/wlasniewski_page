import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

type PaidLine = { photoId: number; quantity: number; format: string };

function paidLines(photoIdsRaw: string, productIdsRaw: string | null): PaidLine[] {
  try {
    const snapshot = productIdsRaw ? JSON.parse(productIdsRaw) as Record<string, unknown> : null;
    if (snapshot?.kind === 'group_extra_prints' && Array.isArray(snapshot.lines)) {
      const parsed = snapshot.lines.flatMap(raw => {
        const line = raw as Record<string, unknown>;
        const photoId = Number(line.photo_id);
        const quantity = Number(line.quantity);
        const format = typeof line.print_size === 'string' ? line.print_size : '10x15';
        return Number.isInteger(photoId) && photoId > 0 && Number.isInteger(quantity) && quantity > 0
          ? [{ photoId, quantity, format }]
          : [];
      });
      if (parsed.length) return parsed;
    }
  } catch {
    // Fall through to the immutable photo_ids snapshot.
  }
  try {
    const ids = JSON.parse(photoIdsRaw);
    if (!Array.isArray(ids)) return [];
    const counts = new Map<number, number>();
    ids.map(Number).filter(id => Number.isInteger(id) && id > 0)
      .forEach(id => counts.set(id, (counts.get(id) || 0) + 1));
    return [...counts.entries()].map(([photoId, quantity]) => ({ photoId, quantity, format: '10x15' }));
  } catch {
    return [];
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(request, async () => {
    try {
      const galleryId = Number((await params).id);
      if (!Number.isInteger(galleryId) || galleryId <= 0) {
        return NextResponse.json({ error: 'Nieprawidłowe ID galerii' }, { status: 400 });
      }
      const gallery = await prisma.clientGallery.findUnique({
        where: { id: galleryId },
        select: { id: true, client_name: true, gallery_mode: true, max_photos_for_print: true },
      });
      if (!gallery) return NextResponse.json({ error: 'Galeria nie istnieje' }, { status: 404 });

      const [participants, paidOrders] = await Promise.all([
        prisma.galleryParticipant.findMany({
          where: { gallery_id: galleryId },
          include: {
            selections: {
              include: {
                photo: {
                  select: {
                    id: true,
                    file_url: true,
                    thumbnail_url: true,
                    download_source_url: true,
                    order_index: true,
                  },
                },
              },
              orderBy: { selected_at: 'asc' },
            },
          },
          orderBy: { created_at: 'asc' },
        }),
        prisma.photoOrder.findMany({
          where: { gallery_id: galleryId, payment_status: { in: ['paid', 'completed'] } },
          select: { id: true, participant_id: true, photo_ids: true, product_ids: true, total_amount: true, paid_at: true },
        }),
      ]);

      const participantIds = new Set(participants.map(participant => participant.id));
      const normalizedPaidOrders = paidOrders.filter(order => order.participant_id && participantIds.has(order.participant_id));
      const allPaidPhotoIds = new Set<number>();
      const parsedOrders = normalizedPaidOrders.map(order => {
        const lines = paidLines(order.photo_ids, order.product_ids);
        lines.forEach(line => allPaidPhotoIds.add(line.photoId));
        return { ...order, lines };
      });
      const paidPhotos = allPaidPhotoIds.size
        ? await prisma.galleryPhoto.findMany({
            where: { gallery_id: galleryId, id: { in: [...allPaidPhotoIds] } },
            select: { id: true, file_url: true, thumbnail_url: true, download_source_url: true, order_index: true },
          })
        : [];
      const photoById = new Map(paidPhotos.map(photo => [photo.id, photo]));

      const byParticipant = new Map<number, any>();
      const byPhoto = new Map<number, any>();
      const missingHq = new Set<number>();
      for (const participant of participants) {
        byParticipant.set(participant.id, {
          participant_id: participant.id,
          parent_identifier: participant.parent_identifier,
          avatar: participant.avatar,
          parent_name: participant.parent_name,
          parent_email: participant.parent_email,
          parent_phone: participant.parent_phone,
          selection_status: participant.selection_status,
          selection_submitted_at: participant.selection_submitted_at,
          max_selections: participant.max_selections,
          publication_consent: participant.publication_consent,
          consent_scope: participant.consent_scope,
          standard_selections: [],
          paid_items: [],
          paid_total_amount: 0,
          missing_hq_photo_ids: [],
        });
        for (const selection of participant.selections) {
          const target = byParticipant.get(participant.id);
          target.standard_selections.push({
            photo_id: selection.photo.id,
            thumbnail_url: selection.photo.thumbnail_url,
            selected_at: selection.selected_at,
            has_hq: Boolean(selection.photo.download_source_url),
          });
          if (!selection.photo.download_source_url) missingHq.add(selection.photo.id);
          if (!byPhoto.has(selection.photo.id)) {
            byPhoto.set(selection.photo.id, {
              photo_id: selection.photo.id,
              thumbnail_url: selection.photo.thumbnail_url,
              order_index: selection.photo.order_index,
              has_hq: Boolean(selection.photo.download_source_url),
              standard_selected_by: [],
              paid_lines: [],
              total_prints: 0,
            });
          }
          byPhoto.get(selection.photo.id).standard_selected_by.push({
            participant_id: participant.id,
            parent_identifier: participant.parent_identifier,
            parent_name: participant.parent_name,
          });
          byPhoto.get(selection.photo.id).total_prints += participant.selection_status === 'SUBMITTED' ? 1 : 0;
        }
      }

      for (const order of parsedOrders) {
        const participant = byParticipant.get(order.participant_id!);
        if (!participant) continue;
        participant.paid_total_amount += order.total_amount;
        for (const line of order.lines) {
          const photo = photoById.get(line.photoId);
          const item = {
            order_id: order.id,
            photo_id: line.photoId,
            quantity: line.quantity,
            format: line.format,
            has_hq: Boolean(photo?.download_source_url),
          };
          participant.paid_items.push(item);
          if (!photo?.download_source_url) missingHq.add(line.photoId);
          if (!byPhoto.has(line.photoId)) {
            byPhoto.set(line.photoId, {
              photo_id: line.photoId,
              thumbnail_url: photo?.thumbnail_url || null,
              order_index: photo?.order_index ?? Number.MAX_SAFE_INTEGER,
              has_hq: Boolean(photo?.download_source_url),
              standard_selected_by: [],
              paid_lines: [],
              total_prints: 0,
            });
          }
          byPhoto.get(line.photoId).paid_lines.push({
            participant_id: order.participant_id,
            order_id: order.id,
            quantity: line.quantity,
            format: line.format,
          });
          byPhoto.get(line.photoId).total_prints += line.quantity;
        }
      }

      for (const participant of byParticipant.values()) {
        participant.missing_hq_photo_ids = [...new Set([
          ...participant.standard_selections.filter((item: any) => !item.has_hq).map((item: any) => item.photo_id),
          ...participant.paid_items.filter((item: any) => !item.has_hq).map((item: any) => item.photo_id),
        ])];
      }

      return NextResponse.json({
        gallery: {
          id: gallery.id,
          name: gallery.client_name,
          mode: gallery.gallery_mode,
          max_photos_per_participant: gallery.max_photos_for_print,
        },
        statistics: {
          total_participants: participants.length,
          submitted_participants: participants.filter(item => item.selection_status === 'SUBMITTED').length,
          legacy_review_required: participants.filter(item => item.selection_status === 'LEGACY_REVIEW_REQUIRED').length,
          draft_with_selections: participants.filter(item => item.selection_status === 'DRAFT' && item.selections.length > 0).length,
          no_selection: participants.filter(item => item.selections.length === 0).length,
          paid_orders: parsedOrders.length,
          paid_prints: parsedOrders.flatMap(order => order.lines).reduce((sum, line) => sum + line.quantity, 0),
          paid_total_amount: parsedOrders.reduce((sum, order) => sum + order.total_amount, 0),
          missing_hq_unique_photos: missingHq.size,
          print_ready: missingHq.size === 0
            && participants.every(item => item.selections.length === 0 || item.selection_status === 'SUBMITTED'),
        },
        by_participant: [...byParticipant.values()],
        by_photo: [...byPhoto.values()].sort((a, b) => b.total_prints - a.total_prints || a.order_index - b.order_index),
        missing_hq_photo_ids: [...missingHq],
      });
    } catch (error) {
      console.error('Print summary error:', error);
      return NextResponse.json({ error: 'Błąd generowania podsumowania' }, { status: 500 });
    }
  });
}
