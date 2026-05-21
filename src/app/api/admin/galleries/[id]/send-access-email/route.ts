// API Route: POST /api/admin/galleries/[id]/send-access-email
// Send gallery access email manually for an existing gallery

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/email/sender';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { id } = await params;
            const galleryId = Number(id);

            const gallery = await prisma.clientGallery.findUnique({
                where: { id: galleryId },
                select: {
                    id: true,
                    client_name: true,
                    client_email: true,
                    access_code: true,
                    gallery_mode: true,
                    group_access_code: true,
                    expires_at: true,
                },
            });

            if (!gallery) {
                return NextResponse.json(
                    { success: false, error: 'Galeria nie znaleziona' },
                    { status: 404 }
                );
            }

            if (!gallery.client_email) {
                return NextResponse.json(
                    { success: false, error: 'Brak emaila klienta w galerii' },
                    { status: 400 }
                );
            }

            const isGroupMode = gallery.gallery_mode === 'GROUP';
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
            const galleryUrl = isGroupMode
                ? `${appUrl}/galeria/grupowa`
                : `${appUrl}/galeria/${gallery.access_code}`;

            const displayCode = isGroupMode
                ? (gallery.group_access_code || gallery.access_code)
                : gallery.access_code;

            const codeLabel = isGroupMode
                ? 'Kod grupowy (rozdaj rodzicom)'
                : 'Kod dostępu';

            const introText = isGroupMode
                ? `Twoja galeria grupowa jest gotowa. Rozdaj poniższy kod uczestnikom. Każdy z nich wchodzi na ${galleryUrl}, wpisuje ten sam kod i wybiera własny awatar.`
                : 'Twoja galeria zdjęć jest gotowa. Możesz teraz przeglądać zdjęcia i wybrać te, które chcesz zachować.';

            const expiresAt = gallery.expires_at
                ? new Date(gallery.expires_at)
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            const expiresFormatted = expiresAt.toLocaleDateString('pl-PL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });

            await sendEmail({
                to: gallery.client_email,
                subject: '📸 Twoja galeria zdjęć jest gotowa! — Przemysław Właśniewski',
                html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;padding:30px 0;border-bottom:2px solid #c5a059;margin-bottom:30px;">
      <h1 style="color:#c5a059;font-size:28px;margin:0;letter-spacing:2px;">PRZEMYSŁAW WŁAŚNIEWSKI</h1>
      <p style="color:#888;font-size:12px;margin:5px 0 0;letter-spacing:4px;text-transform:uppercase;">Fotografia</p>
    </div>

    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:40px;margin-bottom:24px;">
      <h2 style="color:#fff;font-size:24px;margin:0 0 16px;">Cześć, ${gallery.client_name}! 👋</h2>
      <p style="color:#ccc;font-size:16px;line-height:1.6;margin:0 0 24px;">${introText}</p>

      <div style="background:#1a1a1a;border:1px solid #c5a059;border-radius:8px;padding:24px;margin:24px 0;text-align:center;">
        <p style="color:#888;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">${codeLabel}</p>
        <p style="color:#c5a059;font-size:32px;font-weight:bold;margin:0;font-family:monospace;letter-spacing:4px;">${displayCode}</p>
      </div>

      <div style="text-align:center;margin:32px 0;">
        <a href="${galleryUrl}" style="display:inline-block;background:#c5a059;color:#000;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:bold;font-size:16px;letter-spacing:1px;">
          🖼️ ${isGroupMode ? 'Otwórz Galerię Grupową' : 'Otwórz Galerię'}
        </a>
      </div>

      <div style="border-top:1px solid #222;padding-top:20px;margin-top:20px;">
        <p style="color:#666;font-size:13px;margin:0;">
          ⏰ Galeria dostępna do: <strong style="color:#fff;">${expiresFormatted}</strong><br>
          🔗 Link bezpośredni: <a href="${galleryUrl}" style="color:#c5a059;">${galleryUrl}</a>
        </p>
      </div>
    </div>

    <p style="color:#555;font-size:12px;text-align:center;margin:0;">
      © ${new Date().getFullYear()} Przemysław Właśniewski · Fotografia<br>
      <a href="https://wlasniewski.pl" style="color:#c5a059;">wlasniewski.pl</a>
    </p>
  </div>
</body>
</html>`,
            });

            return NextResponse.json({
                success: true,
                message: `Email z dostępem wysłany do ${gallery.client_email}`,
            });
        } catch (error) {
            console.error('Error sending gallery access email:', error);
            return NextResponse.json(
                { success: false, error: 'Nie udało się wysłać maila z dostępem' },
                { status: 500 }
            );
        }
    });
}
