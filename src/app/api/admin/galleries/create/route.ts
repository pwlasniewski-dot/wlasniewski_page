// API Route: POST /api/admin/galleries/create
// Create new gallery and send access email to client

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { generateAccessCode } from '@/lib/gallery-utils';
import { sendEmail, getAdminEmail } from '@/lib/email/sender';

export async function POST(request: NextRequest) {
    return withAuth(request, async () => {
        try {
            const body = await request.json();
            const {
                client_name,
                client_email,
                standard_count,
                price_per_premium,
                expires_at,
                booking_id,
                challenge_id,
                send_email: shouldSendEmail = true
            } = body;

            if (!client_name || !client_email) {
                return NextResponse.json(
                    { success: false, error: 'Wymagane pola: client_name, client_email' },
                    { status: 400 }
                );
            }

            // Generate unique access code
            const access_code = generateAccessCode();

            // Calculate expiration date (default: +30 days)
            const expiresAt = expires_at
                ? new Date(expires_at)
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            // Create gallery
            const gallery = await prisma.clientGallery.create({
                data: {
                    client_name,
                    client_email,
                    access_code,
                    standard_count: standard_count || 10,
                    price_per_premium: price_per_premium || 2000, // 20 zł default
                    expires_at: expiresAt,
                    is_active: true,
                    booking_id: booking_id ? Number(booking_id) : undefined,
                }
            });

            // If challenge_id provided, update challenge with note
            if (challenge_id) {
                await prisma.photoChallenge.update({
                    where: { id: Number(challenge_id) },
                    data: {
                        admin_notes: `Galeria utworzona: #${gallery.id}`
                    }
                });
            }

            // Send access email to client
            if (shouldSendEmail) {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
                const galleryUrl = `${appUrl}/galeria/${access_code}`;
                const expiresFormatted = expiresAt.toLocaleDateString('pl-PL', {
                    day: 'numeric', month: 'long', year: 'numeric'
                });

                try {
                    await sendEmail({
                        to: client_email,
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
      <h2 style="color:#fff;font-size:24px;margin:0 0 16px;">Cześć, ${client_name}! 👋</h2>
      <p style="color:#ccc;font-size:16px;line-height:1.6;margin:0 0 24px;">
        Twoja galeria zdjęć jest gotowa! Możesz teraz przeglądać swoje zdjęcia i wybrać te, które chcesz zachować.
      </p>
      
      <div style="background:#1a1a1a;border:1px solid #c5a059;border-radius:8px;padding:24px;margin:24px 0;text-align:center;">
        <p style="color:#888;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">Kod dostępu</p>
        <p style="color:#c5a059;font-size:32px;font-weight:bold;margin:0;font-family:monospace;letter-spacing:4px;">${access_code}</p>
      </div>
      
      <div style="text-align:center;margin:32px 0;">
        <a href="${galleryUrl}" style="display:inline-block;background:#c5a059;color:#000;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:bold;font-size:16px;letter-spacing:1px;">
          🖼️ Otwórz Galerię
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
</html>`
                    });
                    console.log(`[Gallery] Access email sent to ${client_email}`);
                } catch (emailError) {
                    console.error('[Gallery] Failed to send access email:', emailError);
                    // Don't fail the request if email fails
                }

                // Notify admin
                try {
                    const adminEmail = await getAdminEmail();
                    if (adminEmail) {
                        await sendEmail({
                            to: adminEmail,
                            subject: `📸 Nowa galeria utworzona — ${client_name}`,
                            html: `
<div style="font-family:Arial,sans-serif;padding:20px;background:#0a0a0a;color:#fff;">
  <h2 style="color:#c5a059;">Nowa galeria zdjęć</h2>
  <p>Galeria #${gallery.id} została utworzona dla klienta <strong>${client_name}</strong> (${client_email}).</p>
  <p>Kod dostępu: <code style="background:#222;padding:4px 8px;border-radius:4px;color:#c5a059;">${access_code}</code></p>
  <p>Wygasa: ${expiresFormatted}</p>
  <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl'}/admin/galleries" style="color:#c5a059;">Zarządzaj galeriami →</a></p>
</div>`
                        });
                    }
                } catch (adminEmailError) {
                    console.error('[Gallery] Failed to send admin notification:', adminEmailError);
                }
            }

            return NextResponse.json({
                success: true,
                gallery: {
                    id: gallery.id,
                    client_name: gallery.client_name,
                    access_code: gallery.access_code,
                },
                message: shouldSendEmail ? 'Galeria utworzona i email wysłany do klienta' : 'Galeria utworzona'
            });
        } catch (error) {
            console.error('Error creating gallery:', error);
            return NextResponse.json(
                { success: false, error: 'Nie udało się utworzyć galerii' },
                { status: 500 }
            );
        }
    });
}
