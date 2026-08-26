import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit';
import { bearerToken, verifyGroupGalleryAccessToken } from '@/lib/auth/group-gallery-access';
import { sendEmail } from '@/lib/email/sender';
import { escapeHtml } from '@/lib/security/output';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';

const GENERIC_MESSAGE = 'Jeśli profil istnieje, wysłaliśmy bezpieczny link logowania na zapisany adres email.';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Starts passwordless login without returning a parent session or revealing account existence. */
export async function POST(request: NextRequest) {
  const correlationId = randomUUID();
  let galleryId: number | null = null;
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`group-magic-login:${clientIp}`, 8, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Zbyt wiele prób. Spróbuj ponownie za 15 minut.' }, { status: 429 });
    }

    const { gallery_id, access_code, parent_email } = await request.json();
    galleryId = Number(gallery_id);
    const input = String(parent_email || '').trim();
    const normalizedCode = String(access_code || '').trim().toUpperCase();
    if (!Number.isInteger(galleryId) || galleryId <= 0 || !normalizedCode || !input || input.length > 254) {
      return NextResponse.json({ error: 'Nieprawidłowe dane logowania' }, { status: 400 });
    }

    const entryToken = bearerToken(request.headers.get('authorization'));
    if (!(await verifyGroupGalleryAccessToken(entryToken, galleryId))) {
      return NextResponse.json(
        { error: 'Sesja wejścia do galerii wygasła. Wpisz ponownie kod i hasło.' },
        { status: 401 },
      );
    }

    const gallery = await prisma.clientGallery.findUnique({
      where: { group_access_code: normalizedCode },
      select: { id: true, client_name: true, gallery_mode: true, is_active: true, expires_at: true },
    });
    if (!gallery || gallery.id !== galleryId || gallery.gallery_mode !== 'GROUP' || !gallery.is_active) {
      return NextResponse.json({ error: 'Galeria nie jest dostępna' }, { status: 404 });
    }
    if (gallery.expires_at && gallery.expires_at < new Date()) {
      return NextResponse.json({ error: 'Galeria wygasła' }, { status: 403 });
    }

    const isIdentifier = /^[A-Z]{1,6}-\d{3,8}$/i.test(input);
    const candidates = await prisma.galleryParticipant.findMany({
      where: isIdentifier
        ? { gallery_id: galleryId, parent_identifier: { equals: input.toUpperCase(), mode: 'insensitive' } }
        : { gallery_id: galleryId, parent_email: { equals: input.toLowerCase(), mode: 'insensitive' } },
      select: { id: true, parent_identifier: true, parent_name: true, parent_email: true },
      take: 2,
    });

    if (candidates.length > 1) {
      await recordAdminIncidentSafely({
        severity: 'P0',
        category: 'DATA_INTEGRITY',
        reasonCode: 'GROUP_GALLERY_DUPLICATE_PARENT_LOGIN_IDENTITY',
        summary: 'Więcej niż jeden profil rodzica pasuje do danych logowania',
        entityType: 'gallery',
        entityId: galleryId,
        correlationId,
        details: { input_type: isIdentifier ? 'identifier' : 'email', participant_ids: candidates.map(item => item.id) },
      });
      return NextResponse.json({ success: true, requires_verification: true, message: GENERIC_MESSAGE });
    }

    const participant = candidates[0];
    const destination = participant?.parent_email?.trim().toLowerCase();
    if (!participant || !destination || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination)) {
      return NextResponse.json({ success: true, requires_verification: true, message: GENERIC_MESSAGE });
    }

    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.$transaction(async tx => {
      await tx.groupGalleryLoginToken.updateMany({
        where: { participant_id: participant.id, used_at: null },
        data: { used_at: new Date() },
      });
      await tx.groupGalleryLoginToken.create({
        data: {
          token_hash: tokenHash,
          gallery_id: galleryId!,
          participant_id: participant.id,
          email: destination,
          expires_at: expiresAt,
        },
      });
    });

    const galleryUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl');
    galleryUrl.pathname = '/galeria/grupowa';
    galleryUrl.search = '';
    galleryUrl.searchParams.set('code', normalizedCode);
    galleryUrl.searchParams.set('group_login_token', rawToken);
    await sendEmail({
      to: destination,
      subject: `Bezpieczne logowanie do galerii: ${gallery.client_name}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:640px;margin:0 auto;padding:24px;">
          <h2>Bezpieczne logowanie do galerii</h2>
          <p>Cześć ${escapeHtml(participant.parent_name || 'Rodzicu')},</p>
          <p>kliknij przycisk, aby wrócić do własnych wyborów zdjęć. Link jest jednorazowy i ważny 15 minut.</p>
          <p><a href="${escapeHtml(galleryUrl.toString())}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;">Zaloguj się do swoich wyborów</a></p>
          <p>Jeśli to nie Ty, zignoruj tę wiadomość.</p>
        </div>`,
    });

    await prisma.groupGalleryActivity.create({
      data: {
        gallery_id: galleryId,
        participant_id: participant.id,
        action: 'MAGIC_LOGIN_SENT',
        result: 'SUCCESS',
        correlation_id: correlationId,
      },
    });
    return NextResponse.json({ success: true, requires_verification: true, message: GENERIC_MESSAGE });
  } catch (error) {
    await recordAdminIncidentSafely({
      severity: 'P1',
      category: 'AUTHENTICATION',
      reasonCode: 'GROUP_GALLERY_MAGIC_LOGIN_SEND_FAILED',
      summary: 'Nie udało się wysłać bezpiecznego linku logowania rodzica',
      entityType: 'gallery',
      entityId: galleryId,
      correlationId,
      details: { error: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: 'Nie udało się wysłać linku. Administrator otrzymał zgłoszenie.' }, { status: 500 });
  }
}
