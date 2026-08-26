import { createHash, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateParentToken } from '@/lib/auth/parent-jwt';
import { getGroupPrintPrices } from '@/lib/galleries/group-settings';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function POST(request: NextRequest) {
  const correlationId = randomUUID();
  let galleryId: number | null = null;
  try {
    const { token } = await request.json();
    const rawToken = typeof token === 'string' ? token.trim() : '';
    if (!/^[A-Za-z0-9_-]{40,100}$/.test(rawToken)) {
      return NextResponse.json({ error: 'Link logowania jest nieprawidłowy.' }, { status: 400 });
    }
    const tokenHash = hashToken(rawToken);
    const now = new Date();

    const result = await prisma.$transaction(async tx => {
      const loginToken = await tx.groupGalleryLoginToken.findUnique({ where: { token_hash: tokenHash } });
      if (!loginToken || loginToken.used_at || loginToken.expires_at <= now) return null;
      galleryId = loginToken.gallery_id;

      const [participant, gallery] = await Promise.all([
        tx.galleryParticipant.findFirst({
          where: {
            id: loginToken.participant_id,
            gallery_id: loginToken.gallery_id,
            parent_email: { equals: loginToken.email, mode: 'insensitive' },
          },
          select: {
            id: true,
            gallery_id: true,
            parent_identifier: true,
            parent_name: true,
            avatar: true,
            max_selections: true,
            allow_extra_photo_purchase: true,
            selection_status: true,
            selection_submitted_at: true,
          },
        }),
        tx.clientGallery.findFirst({
          where: { id: loginToken.gallery_id, gallery_mode: 'GROUP', is_active: true },
          select: {
            id: true,
            client_name: true,
            description: true,
            max_photos_for_print: true,
            allow_extra_photo_purchase: true,
            external_download_url: true,
            price_per_premium: true,
            expires_at: true,
          },
        }),
      ]);
      if (!participant || !gallery || (gallery.expires_at && gallery.expires_at <= now)) return null;

      const consumed = await tx.groupGalleryLoginToken.updateMany({
        where: { token_hash: tokenHash, used_at: null, expires_at: { gt: now } },
        data: { used_at: now },
      });
      if (consumed.count !== 1) return null;
      await tx.groupGalleryActivity.create({
        data: {
          gallery_id: gallery.id,
          participant_id: participant.id,
          action: 'MAGIC_LOGIN_VERIFIED',
          result: 'SUCCESS',
          correlation_id: correlationId,
        },
      });
      return { participant, gallery };
    });

    if (!result || !result.participant.parent_identifier) {
      return NextResponse.json({ error: 'Link wygasł albo został już użyty. Wyślij nowy link.' }, { status: 401 });
    }
    const [parentToken, printPrices] = await Promise.all([
      generateParentToken({
        participant_id: result.participant.id,
        gallery_id: result.gallery.id,
        parent_identifier: result.participant.parent_identifier,
      }),
      getGroupPrintPrices(),
    ]);
    return NextResponse.json({
      success: true,
      token: parentToken,
      participant: {
        participant_id: result.participant.id,
        gallery_id: result.gallery.id,
        parent_identifier: result.participant.parent_identifier,
        parent_name: result.participant.parent_name,
        avatar: result.participant.avatar,
        max_selections: result.participant.max_selections,
        allow_extra_photo_purchase: result.participant.allow_extra_photo_purchase,
        selection_status: result.participant.selection_status,
        selection_submitted_at: result.participant.selection_submitted_at,
        token: parentToken,
      },
      gallery: {
        gallery_id: result.gallery.id,
        gallery_name: result.gallery.client_name,
        description: result.gallery.description,
        max_photos_for_print: result.gallery.max_photos_for_print || 5,
        allow_extra_photo_purchase: result.gallery.allow_extra_photo_purchase,
        external_download_url: result.gallery.external_download_url,
        price_per_premium: result.gallery.price_per_premium,
        group_print_price_10x15: printPrices.price10x15,
        group_print_price_15x21: printPrices.price15x21,
        expires_at: result.gallery.expires_at,
      },
    });
  } catch (error) {
    await recordAdminIncidentSafely({
      severity: 'P1',
      category: 'AUTHENTICATION',
      reasonCode: 'GROUP_GALLERY_MAGIC_LOGIN_VERIFY_FAILED',
      summary: 'Nie udało się zweryfikować linku logowania do galerii grupowej',
      entityType: 'gallery',
      entityId: galleryId,
      correlationId,
      details: { error: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: 'Nie udało się zalogować. Administrator otrzymał zgłoszenie.' }, { status: 500 });
  }
}
