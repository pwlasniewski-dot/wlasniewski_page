import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyParentToken, extractTokenFromHeader } from '@/lib/auth/parent-jwt';

type GroupExtraPrintSize = '10x15' | '15x21';

type ParsedExtraOrderLine = {
  photo_id: number;
  print_size: GroupExtraPrintSize;
  quantity: number;
  unit_amount?: number;
};

function isGroupExtraPrintSize(value: string): value is GroupExtraPrintSize {
  return value === '10x15' || value === '15x21';
}

function parsePhotoIds(raw: string): number[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0);
    }
  } catch {
    // fallback below
  }

  return raw
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);
}

function parseExtraOrderLines(productIdsRaw: string | null, photoIdsRaw: string): ParsedExtraOrderLine[] {
  const fallbackPhotoIds = parsePhotoIds(photoIdsRaw);

  if (productIdsRaw) {
    try {
      const parsed = JSON.parse(productIdsRaw) as Record<string, unknown>;
      if (parsed?.kind === 'group_extra_prints') {
        const rawLines = Array.isArray(parsed.lines) ? parsed.lines : [];
        const lines = rawLines
          .map((rawLine) => {
            const line = rawLine as Record<string, unknown>;
            const photo_id = Number(line.photo_id);
            const print_size = String(line.print_size || '').trim();
            const quantity = Number(line.quantity);
            const unit_amount = Number(line.unit_amount);

            if (!Number.isInteger(photo_id) || photo_id <= 0) return null;
            if (!isGroupExtraPrintSize(print_size)) return null;
            if (!Number.isInteger(quantity) || quantity <= 0) return null;

            return {
              photo_id,
              print_size,
              quantity,
              unit_amount: Number.isFinite(unit_amount) && unit_amount > 0 ? Math.round(unit_amount) : undefined,
            };
          })
          .filter((line): line is ParsedExtraOrderLine => Boolean(line));

        if (lines.length > 0) {
          return lines;
        }

        const fallbackSize = String(parsed.print_size || '').trim();
        if (isGroupExtraPrintSize(fallbackSize) && fallbackPhotoIds.length > 0) {
          const byPhoto = new Map<number, number>();
          fallbackPhotoIds.forEach((photoId) => {
            byPhoto.set(photoId, (byPhoto.get(photoId) || 0) + 1);
          });

          return Array.from(byPhoto.entries()).map(([photo_id, quantity]) => ({
            photo_id,
            print_size: fallbackSize,
            quantity,
          }));
        }
      }
    } catch {
      // ignore JSON parsing errors and continue with fallback
    }
  }

  if (fallbackPhotoIds.length === 0) return [];
  const byPhoto = new Map<number, number>();
  fallbackPhotoIds.forEach((photoId) => {
    byPhoto.set(photoId, (byPhoto.get(photoId) || 0) + 1);
  });

  return Array.from(byPhoto.entries()).map(([photo_id, quantity]) => ({
    photo_id,
    print_size: '10x15',
    quantity,
  }));
}

/**
 * POST /api/galleries/group/participant/[id]/select
 * Toggle photo selection for a participant
 * REQUIRES: Valid parent JWT token with matching participant_id
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const participantId = parseInt(id, 10);
    const { photo_id } = await request.json();

    if (isNaN(participantId) || !photo_id) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane' },
        { status: 400 }
      );
    }

    // SECURITY: Verify parent JWT token
    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Brak autoryzacji' },
        { status: 401 }
      );
    }

    const payload = await verifyParentToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Nieprawidłowy token autoryzacyjny' },
        { status: 401 }
      );
    }

    // SECURITY: Verify token participant_id matches requested participant_id
    if (payload.participant_id !== participantId) {
      return NextResponse.json(
        { error: 'Brak dostępu do tego uczestnika' },
        { status: 403 }
      );
    }

    // Get participant info
    const participant = await prisma.galleryParticipant.findUnique({
      where: { id: participantId },
      include: {
        selections: true,
        gallery: {
          select: {
            allow_extra_photo_purchase: true,
            gallery_mode: true,
            is_active: true,
          },
        },
      },
    });

    if (!participant || participant.gallery.gallery_mode !== 'GROUP') {
      return NextResponse.json(
        { error: 'Uczestnik nie istnieje' },
        { status: 404 }
      );
    }

    if (!participant.gallery.is_active) {
      return NextResponse.json(
        { error: 'Galeria jest nieaktywna' },
        { status: 403 }
      );
    }

    // SECURITY: Verify photo belongs to this gallery
    const photo = await prisma.galleryPhoto.findFirst({
      where: {
        id: photo_id,
        gallery_id: participant.gallery_id,
      },
    });

    if (!photo) {
      return NextResponse.json(
        { error: 'Zdjęcie nie istnieje w tej galerii' },
        { status: 404 }
      );
    }

    // Check if photo already selected
    const existingSelection = await prisma.photoSelection.findUnique({
      where: {
        participant_id_photo_id: {
          participant_id: participantId,
          photo_id: photo_id,
        },
      },
    });

    if (existingSelection) {
      // Remove selection (toggle off)
      await prisma.photoSelection.delete({
        where: { id: existingSelection.id },
      });

      return NextResponse.json({
        action: 'removed',
        selected_count: participant.selections.length - 1,
        max_selections: participant.max_selections,
      });
    } else {
      // Check selection limit
      if (participant.selections.length >= participant.max_selections) {
        return NextResponse.json(
          { 
            error: `Możesz wybrać maksymalnie ${participant.max_selections} zdjęć`,
            max_selections: participant.max_selections,
            current_count: participant.selections.length,
          },
          { status: 400 }
        );
      }

      // Add selection
      await prisma.photoSelection.create({
        data: {
          participant_id: participantId,
          photo_id: photo_id,
        },
      });

      return NextResponse.json({
        action: 'added',
        selected_count: participant.selections.length + 1,
        max_selections: participant.max_selections,
      });
    }

  } catch (error) {
    console.error('Select photo error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas zapisywania wyboru' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/galleries/group/participant/[id]/select
 * Get all selected photos for a participant
 * REQUIRES: Valid parent JWT token with matching participant_id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const participantId = parseInt(id, 10);

    if (isNaN(participantId)) {
      return NextResponse.json(
        { error: 'Nieprawidłowe ID uczestnika' },
        { status: 400 }
      );
    }

    // SECURITY: Verify parent JWT token
    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Brak autoryzacji' },
        { status: 401 }
      );
    }

    const payload = await verifyParentToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Nieprawidłowy token autoryzacyjny' },
        { status: 401 }
      );
    }

    // SECURITY: Verify token participant_id matches requested participant_id
    if (payload.participant_id !== participantId) {
      return NextResponse.json(
        { error: 'Brak dostępu do tego uczestnika' },
        { status: 403 }
      );
    }

    const participant = await prisma.galleryParticipant.findUnique({
      where: { id: participantId },
      include: {
        selections: {
          include: {
            photo: {
              select: {
                id: true,
                file_url: true,
                thumbnail_url: true,
              },
            },
          },
        },
        gallery: {
          select: {
            allow_extra_photo_purchase: true,
          },
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Uczestnik nie istnieje' },
        { status: 404 }
      );
    }

    const extraOrders = await prisma.photoOrder.findMany({
      where: {
        gallery_id: participant.gallery_id,
        participant_id: participant.id,
      },
      select: {
        id: true,
        photo_ids: true,
        photo_count: true,
        total_amount: true,
        payment_status: true,
        payment_url: true,
        created_at: true,
        product_ids: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const paidStatuses = new Set(['paid', 'completed']);
    const pendingLikeStatuses = new Set(['pending', 'new', 'waiting', 'created']);

    const paidExtraPhotoIds = new Set<number>();
    const orderedPhotoTotals = new Map<number, {
      photo_id: number;
      paid_total: number;
      unpaid_total: number;
      by_size: {
        '10x15': { paid: number; unpaid: number };
        '15x21': { paid: number; unpaid: number };
      };
    }>();

    const extraOrdersHistory = extraOrders.map((order) => {
      const lines = parseExtraOrderLines(order.product_ids, order.photo_ids);
      const isPaid = paidStatuses.has(order.payment_status);
      const isPendingLike = pendingLikeStatuses.has(order.payment_status);

      lines.forEach((line) => {
        let current = orderedPhotoTotals.get(line.photo_id);
        if (!current) {
          current = {
            photo_id: line.photo_id,
            paid_total: 0,
            unpaid_total: 0,
            by_size: {
              '10x15': { paid: 0, unpaid: 0 },
              '15x21': { paid: 0, unpaid: 0 },
            },
          };
          orderedPhotoTotals.set(line.photo_id, current);
        }

        if (isPaid) {
          current.paid_total += line.quantity;
          current.by_size[line.print_size].paid += line.quantity;
          paidExtraPhotoIds.add(line.photo_id);
        } else {
          current.unpaid_total += line.quantity;
          current.by_size[line.print_size].unpaid += line.quantity;
        }
      });

      return {
        order_id: order.id,
        payment_status: order.payment_status,
        payment_state_label: isPaid ? 'Oplacone' : (isPendingLike ? 'Nieoplacone' : 'Wymaga sprawdzenia'),
        created_at: order.created_at,
        total_amount: order.total_amount,
        photo_count: order.photo_count,
        payment_url: order.payment_url,
        lines,
      };
    });

    return NextResponse.json({
      parent_name: participant.parent_name,
      parent_identifier: participant.parent_identifier,
      avatar: participant.avatar,
      selected_photos: participant.selections.map(s => ({
        photo_id: s.photo_id,
        file_url: s.photo.file_url,
        thumbnail_url: s.photo.thumbnail_url,
        selected_at: s.selected_at,
      })),
      selected_count: participant.selections.length,
      max_selections: participant.max_selections,
      allow_extra_photo_purchase: participant.allow_extra_photo_purchase || participant.gallery.allow_extra_photo_purchase,
      paid_extra_photo_ids: Array.from(paidExtraPhotoIds),
      extra_orders_history: extraOrdersHistory,
      ordered_photo_totals: Array.from(orderedPhotoTotals.values()),
      publication_consent: participant.publication_consent,
      consent_scope: participant.consent_scope,
    });

  } catch (error) {
    console.error('Get selections error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania wyborów' },
      { status: 500 }
    );
  }
}
