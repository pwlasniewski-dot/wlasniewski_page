import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateParentToken } from '@/lib/auth/parent-jwt';
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit';

/**
 * POST /api/galleries/group/login-email
 * Login existing parent profile by email OR parent identifier code (e.g. PW-7475).
 */
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`group-login-email:${clientIp}`, 15, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.' },
        { status: 429 }
      );
    }

    const { gallery_id, access_code, parent_email } = await request.json();

    if (!gallery_id || !access_code || !parent_email) {
      return NextResponse.json(
        { error: 'ID galerii, kod dostępu i email/identyfikator są wymagane' },
        { status: 400 }
      );
    }

    const galleryId = Number(gallery_id);
    if (!Number.isFinite(galleryId)) {
      return NextResponse.json({ error: 'Nieprawidłowe ID galerii' }, { status: 400 });
    }

    const normalizedCode = String(access_code).trim().toUpperCase();

    const gallery = await prisma.clientGallery.findUnique({
      where: { group_access_code: normalizedCode },
      select: { id: true, expires_at: true, gallery_mode: true, is_active: true, allow_extra_photo_purchase: true },
    });

    if (!gallery || gallery.id !== galleryId || gallery.gallery_mode !== 'GROUP' || !gallery.is_active) {
      return NextResponse.json({ error: 'Nieprawidłowy kod dostępu' }, { status: 404 });
    }

    if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Galeria wygasła' }, { status: 403 });
    }

    const input = String(parent_email).trim();

    // Detect whether input is a parent identifier (e.g. PW-7475, KP-1234) or an email
    const isIdentifier = /^[A-Z]{1,4}-\d{3,6}$/i.test(input);

    let participant: { id: number; parent_identifier: string | null; parent_name: string | null; avatar: string | null; max_selections: number; allow_extra_photo_purchase: boolean } | null = null;

    if (isIdentifier) {
      participant = await prisma.galleryParticipant.findFirst({
        where: {
          gallery_id: galleryId,
          parent_identifier: { equals: input.toUpperCase(), mode: 'insensitive' },
        },
        select: { id: true, parent_identifier: true, parent_name: true, avatar: true, max_selections: true, allow_extra_photo_purchase: true },
      });
    } else {
      const normalizedEmail = input.toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return NextResponse.json({ error: 'Wpisz email lub identyfikator (np. PW-7475)' }, { status: 400 });
      }
      participant = await prisma.galleryParticipant.findFirst({
        where: { gallery_id: galleryId, parent_email: normalizedEmail },
        select: { id: true, parent_identifier: true, parent_name: true, avatar: true, max_selections: true, allow_extra_photo_purchase: true },
      });
      // Legacy fallback for historical mixed-case emails
      if (!participant) {
        participant = await prisma.galleryParticipant.findFirst({
          where: { gallery_id: galleryId, parent_email: { equals: normalizedEmail, mode: 'insensitive' } },
          select: { id: true, parent_identifier: true, parent_name: true, avatar: true, max_selections: true, allow_extra_photo_purchase: true },
        });
      }
    }

    if (!participant) {
      return NextResponse.json(
        { error: 'Nie znaleziono profilu rodzica dla tego emaila w tej galerii' },
        { status: 404 }
      );
    }

    const token = await generateParentToken({
      participant_id: participant.id,
      gallery_id: galleryId,
      parent_identifier: participant.parent_identifier || `P-${participant.id}`,
    });

    return NextResponse.json({
      participant_id: participant.id,
      gallery_id: galleryId,
      parent_identifier: participant.parent_identifier,
      parent_name: participant.parent_name,
      avatar: participant.avatar,
      max_selections: participant.max_selections,
      allow_extra_photo_purchase: participant.allow_extra_photo_purchase,
      token,
    });
  } catch (error) {
    console.error('Group email login error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas logowania po emailu' },
      { status: 500 }
    );
  }
}
