// API Route: POST /api/admin/test-email/crm
// Sends test emails for all CRM notification types

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { sendEmail, getAdminEmail, getSMTPConfig } from '@/lib/email/sender';
import { logSystem } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    return withAuth(request, async (req) => {
        try {
            const body = await req.json();
            const {
                clientEmail = 'pwlasniewski@icloud.com',
                types = ['welcome', 'offer', 'contract', 'gallery', 'booking']
            } = body;

            const adminEmail = await getAdminEmail();
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
            const results: Record<string, any> = {};

            console.log(`[CRM Email Test] Admin email: ${adminEmail}, Client: ${clientEmail}`);

            // 1. Welcome / Client Creation Email
            if (types.includes('welcome')) {
                try {
                    await sendEmail({
                        to: clientEmail,
                        subject: '🧪 [TEST] Witaj w Panelu Klienta — Przemysław Właśniewski',
                        template: 'welcome-client',
                        data: {
                            name: 'Klient Testowy',
                            email: clientEmail,
                            loginUrl: `${appUrl}/logowanie`
                        }
                    });
                    results.welcome = { success: true, to: clientEmail };
                } catch (e: any) {
                    results.welcome = { success: false, error: e.message };
                }
            }

            // 2. Offer Sent Email (to client)
            if (types.includes('offer')) {
                try {
                    await sendEmail({
                        to: clientEmail,
                        subject: '🧪 [TEST] Nowa oferta dla Ciebie — Przemysław Właśniewski',
                        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;padding:30px 0;border-bottom:2px solid #c5a059;margin-bottom:30px;">
      <h1 style="color:#c5a059;font-size:28px;margin:0;">PRZEMYSŁAW WŁAŚNIEWSKI</h1>
      <p style="color:#888;font-size:12px;margin:5px 0 0;letter-spacing:4px;">FOTOGRAFIA</p>
    </div>
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:40px;">
      <h2 style="color:#fff;margin:0 0 16px;">Cześć, Klient Testowy! 👋</h2>
      <p style="color:#ccc;font-size:16px;line-height:1.6;">Przygotowałem dla Ciebie specjalną ofertę fotograficzną. Kliknij poniżej, aby ją przejrzeć.</p>
      <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:20px;margin:24px 0;">
        <p style="color:#888;font-size:12px;margin:0 0 4px;">Oferta testowa</p>
        <p style="color:#fff;font-size:18px;font-weight:bold;margin:0;">Sesja Portretowa Premium</p>
        <p style="color:#c5a059;font-size:24px;font-weight:bold;margin:8px 0 0;">1 500 PLN</p>
      </div>
      <div style="text-align:center;margin:32px 0;">
        <a href="${appUrl}/strefa-klienta/oferty" style="display:inline-block;background:#c5a059;color:#000;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:bold;font-size:16px;">
          📋 Przejrzyj ofertę
        </a>
      </div>
    </div>
  </div>
</body>
</html>`
                    });
                    results.offer = { success: true, to: clientEmail };
                } catch (e: any) {
                    results.offer = { success: false, error: e.message };
                }

                // Offer notification to admin
                if (adminEmail) {
                    try {
                        await sendEmail({
                            to: adminEmail,
                            subject: '🧪 [TEST] Oferta wysłana — Klient Testowy',
                            html: `<div style="font-family:Arial;padding:20px;background:#0a0a0a;color:#fff;"><h2 style="color:#c5a059;">[TEST] Oferta wysłana</h2><p>Oferta testowa została wysłana do klienta <strong>Klient Testowy</strong> (${clientEmail}).</p></div>`
                        });
                        results.offer_admin = { success: true, to: adminEmail };
                    } catch (e: any) {
                        results.offer_admin = { success: false, error: e.message };
                    }
                }
            }

            // 3. Contract Ready Email (to client)
            if (types.includes('contract')) {
                try {
                    await sendEmail({
                        to: clientEmail,
                        subject: '🧪 [TEST] Umowa UMW-TEST-001 jest gotowa — Przemysław Właśniewski',
                        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;padding:30px 0;border-bottom:2px solid #c5a059;margin-bottom:30px;">
      <h1 style="color:#c5a059;font-size:28px;margin:0;">PRZEMYSŁAW WŁAŚNIEWSKI</h1>
    </div>
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:40px;">
      <h2 style="color:#fff;margin:0 0 16px;">Cześć, Klient Testowy! 👋</h2>
      <p style="color:#ccc;font-size:16px;line-height:1.6;">Twoja umowa jest gotowa do przejrzenia.</p>
      <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:20px;margin:24px 0;">
        <p style="color:#888;font-size:12px;margin:0 0 8px;">Numer umowy</p>
        <p style="color:#c5a059;font-size:20px;font-weight:bold;margin:0;font-family:monospace;">UMW-TEST-001</p>
        <p style="color:#666;font-size:13px;margin:8px 0 0;">Oferta: Sesja Portretowa Premium</p>
      </div>
      <div style="text-align:center;margin:32px 0;">
        <a href="${appUrl}/strefa-klienta/umowy" style="display:inline-block;background:#c5a059;color:#000;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:bold;font-size:16px;">
          📄 Przejdź do umowy
        </a>
      </div>
    </div>
  </div>
</body>
</html>`
                    });
                    results.contract = { success: true, to: clientEmail };
                } catch (e: any) {
                    results.contract = { success: false, error: e.message };
                }

                if (adminEmail) {
                    try {
                        await sendEmail({
                            to: adminEmail,
                            subject: '🧪 [TEST] Nowa umowa UMW-TEST-001 — Klient Testowy',
                            html: `<div style="font-family:Arial;padding:20px;background:#0a0a0a;color:#fff;"><h2 style="color:#c5a059;">[TEST] Umowa wygenerowana</h2><p>Umowa <strong>UMW-TEST-001</strong> wygenerowana dla <strong>Klient Testowy</strong> (${clientEmail}).</p></div>`
                        });
                        results.contract_admin = { success: true, to: adminEmail };
                    } catch (e: any) {
                        results.contract_admin = { success: false, error: e.message };
                    }
                }
            }

            // 4. Gallery Access Email (to client)
            if (types.includes('gallery')) {
                const testCode = 'TEST-GALLERY-001';
                try {
                    await sendEmail({
                        to: clientEmail,
                        subject: '🧪 [TEST] Twoja galeria zdjęć jest gotowa! — Przemysław Właśniewski',
                        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;padding:30px 0;border-bottom:2px solid #c5a059;margin-bottom:30px;">
      <h1 style="color:#c5a059;font-size:28px;margin:0;">PRZEMYSŁAW WŁAŚNIEWSKI</h1>
    </div>
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:40px;">
      <h2 style="color:#fff;margin:0 0 16px;">Cześć, Klient Testowy! 👋</h2>
      <p style="color:#ccc;font-size:16px;line-height:1.6;">Twoja galeria zdjęć jest gotowa!</p>
      <div style="background:#1a1a1a;border:1px solid #c5a059;border-radius:8px;padding:24px;margin:24px 0;text-align:center;">
        <p style="color:#888;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:2px;">Kod dostępu</p>
        <p style="color:#c5a059;font-size:32px;font-weight:bold;margin:0;font-family:monospace;letter-spacing:4px;">${testCode}</p>
      </div>
      <div style="text-align:center;margin:32px 0;">
        <a href="${appUrl}/galeria/${testCode}" style="display:inline-block;background:#c5a059;color:#000;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:bold;font-size:16px;">
          🖼️ Otwórz Galerię
        </a>
      </div>
    </div>
  </div>
</body>
</html>`
                    });
                    results.gallery = { success: true, to: clientEmail };
                } catch (e: any) {
                    results.gallery = { success: false, error: e.message };
                }

                if (adminEmail) {
                    try {
                        await sendEmail({
                            to: adminEmail,
                            subject: '🧪 [TEST] Nowa galeria — Klient Testowy',
                            html: `<div style="font-family:Arial;padding:20px;background:#0a0a0a;color:#fff;"><h2 style="color:#c5a059;">[TEST] Galeria utworzona</h2><p>Galeria testowa z kodem <strong>${testCode}</strong> dla <strong>Klient Testowy</strong> (${clientEmail}).</p></div>`
                        });
                        results.gallery_admin = { success: true, to: adminEmail };
                    } catch (e: any) {
                        results.gallery_admin = { success: false, error: e.message };
                    }
                }
            }

            // 5. Booking Confirmation Email
            if (types.includes('booking')) {
                try {
                    const { generateBookingConfirmedEmail } = await import('@/lib/email-templates');
                    const emailData = {
                        clientName: 'Klient Testowy',
                        service: 'Sesja Portretowa',
                        packageName: 'Premium',
                        date: 'środa, 1 marca 2026',
                        time: '14:00 - 16:00',
                        location: 'Kraków, Studio',
                        price: 1500,
                        email: clientEmail,
                    };
                    await sendEmail({
                        to: clientEmail,
                        subject: '🧪 [TEST] ✅ Rezerwacja POTWIERDZONA! — Sesja Portretowa',
                        html: generateBookingConfirmedEmail(emailData)
                    });
                    results.booking = { success: true, to: clientEmail };
                } catch (e: any) {
                    results.booking = { success: false, error: e.message };
                }

                if (adminEmail) {
                    try {
                        await sendEmail({
                            to: adminEmail,
                            subject: '🧪 [TEST] 🎉 Nowa rezerwacja: Klient Testowy - Sesja Portretowa',
                            html: `<div style="font-family:Arial;padding:20px;background:#0a0a0a;color:#fff;"><h2 style="color:#c5a059;">[TEST] Nowa rezerwacja</h2><p>Klient: <strong>Klient Testowy</strong> (${clientEmail})<br>Usługa: Sesja Portretowa<br>Data: 1 marca 2026<br>Kwota: 1500 PLN</p></div>`
                        });
                        results.booking_admin = { success: true, to: adminEmail };
                    } catch (e: any) {
                        results.booking_admin = { success: false, error: e.message };
                    }
                }
            }

            await logSystem('INFO', 'EMAIL', 'CRM email test completed', { results, adminEmail, clientEmail });

            const allSuccess = Object.values(results).every((r: any) => r.success);
            return NextResponse.json({
                success: allSuccess,
                adminEmail,
                clientEmail,
                results,
                summary: `Wysłano ${Object.values(results).filter((r: any) => r.success).length}/${Object.keys(results).length} emaili`
            });

        } catch (error: any) {
            console.error('[CRM Email Test] Error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
    });
}
