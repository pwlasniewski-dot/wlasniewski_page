// API Route: POST /api/admin/galleries/[id]/participants/remind
// Send reminder email to selected guardians with final selection deadline.

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/email/sender';

function formatDatePL(dateInput: string): string {
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return dateInput;
  return d.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async () => {
    try {
      const { id } = await params;
      const galleryId = Number(id);

      if (Number.isNaN(galleryId)) {
        return NextResponse.json({ success: false, error: 'Nieprawidłowe ID galerii' }, { status: 400 });
      }

      const body = await request.json();
      const participantIds = Array.isArray(body?.participantIds)
        ? body.participantIds.map((v: unknown) => Number(v)).filter((v: number) => !Number.isNaN(v))
        : [];
      const deadlineDate = String(body?.deadlineDate || '').trim();
      const fallbackGroupPhotos = 1;

      if (participantIds.length === 0) {
        return NextResponse.json({ success: false, error: 'Brak zaznaczonych opiekunów' }, { status: 400 });
      }

      const deadline = new Date(deadlineDate);
      if (!deadlineDate || Number.isNaN(deadline.getTime())) {
        return NextResponse.json({ success: false, error: 'Nieprawidłowy termin ostateczny' }, { status: 400 });
      }

      const gallery = await prisma.clientGallery.findUnique({
        where: { id: galleryId },
        select: {
          id: true,
          gallery_mode: true,
          group_access_code: true,
          group_password: true,
          access_code: true,
          client_name: true,
        },
      });

      if (!gallery) {
        return NextResponse.json({ success: false, error: 'Galeria nie istnieje' }, { status: 404 });
      }

      const participants = await prisma.galleryParticipant.findMany({
        where: {
          gallery_id: galleryId,
          id: { in: participantIds },
        },
        select: {
          id: true,
          parent_name: true,
          parent_email: true,
          selections: { select: { id: true } },
        },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
      const galleryUrl = gallery.gallery_mode === 'GROUP'
        ? `${appUrl}/galeria/grupowa?code=${gallery.group_access_code || gallery.access_code}`
        : `${appUrl}/galeria/${gallery.access_code}`;
      const deadlineLabel = formatDatePL(deadlineDate);

      let sentCount = 0;
      const skipped: Array<{ id: number; reason: string }> = [];

      for (const participant of participants) {
        if (!participant.parent_email) {
          skipped.push({ id: participant.id, reason: 'Brak emaila opiekuna' });
          continue;
        }

        const displayName = participant.parent_name || 'Rodzicu';
        const currentSelections = participant.selections.length;

        const subject = `Przypomnienie: wybór zdjęć do ${deadlineLabel}`;
        const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:24px;">
      <h2 style="margin:0 0 10px;color:#fff;">Przypomnienie o wyborze zdjęć</h2>
      <p style="color:#d4d4d8;line-height:1.6;margin:0 0 12px;">Dzień dobry ${displayName},</p>
      <p style="color:#d4d4d8;line-height:1.6;margin:0 0 12px;">to przypomnienie o wyborze zdjęć w galerii. Ostateczny termin wyboru to <strong style="color:#fff;">${deadlineLabel}</strong>.</p>
      <p style="color:#d4d4d8;line-height:1.6;margin:0 0 12px;">Aktualnie wybrane zdjęcia: <strong style="color:#fff;">${currentSelections}</strong>.</p>
      <p style="color:#fbbf24;line-height:1.6;margin:0 0 12px;">Po tym terminie, jeśli nie będzie wyboru, fotograf wybierze ${fallbackGroupPhotos} zdjęcie grupowe ogólne.</p>
      ${gallery.group_password
          ? `<p style="color:#d4d4d8;line-height:1.6;margin:0 0 12px;">Hasło do galerii: <strong style="color:#fff;">${gallery.group_password}</strong></p>`
          : ''}
      <div style="text-align:center;margin:18px 0;">
        <a href="${galleryUrl}" style="display:inline-block;background:#eab308;color:#000;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;">Otwórz galerię i wybierz zdjęcia</a>
      </div>
      <p style="color:#71717a;font-size:12px;margin:16px 0 0;">Link: <a href="${galleryUrl}" style="color:#93c5fd;">${galleryUrl}</a></p>
    </div>
  </div>
</body>
</html>`;

        try {
          await sendEmail({
            to: participant.parent_email,
            subject,
            html,
          });
          sentCount += 1;
        } catch (error) {
          console.error('Reminder email failed:', participant.id, error);
          skipped.push({ id: participant.id, reason: 'Błąd wysyłki email' });
        }
      }

      return NextResponse.json({
        success: true,
        requestedCount: participantIds.length,
        sentCount,
        skipped,
      });
    } catch (error) {
      console.error('Participants reminder error:', error);
      return NextResponse.json({ success: false, error: 'Błąd wysyłki monitu' }, { status: 500 });
    }
  });
}
