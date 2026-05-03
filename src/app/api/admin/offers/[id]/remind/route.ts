import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/email/sender';

/**
 * POST /api/admin/offers/[id]/remind?type=unread|deposit
 *  - "unread": klient nie zatwierdzil/nie zalogowal sie/nie odczytal oferty.
 *  - "deposit": klient zaakceptowal ofert\u0119 ale nie wp\u0142aci\u0142 zaliczki.
 *
 * Dorzuca rekord do CrmActivity (typ: "reminder_unread_offer" / "reminder_deposit_due").
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req) => {
        try {
            const { id } = await context.params;
            const offerId = parseInt(id, 10);
            const url = new URL(req.url);
            const type = (url.searchParams.get('type') || 'unread').toLowerCase();
            const validTypes = ['unread', 'deposit'];
            if (!validTypes.includes(type)) {
                return NextResponse.json({ error: 'Niepoprawny typ przypominajki' }, { status: 400 });
            }

            const offer = await prisma.offer.findUnique({
                where: { id: offerId },
                include: { user: true },
            });
            if (!offer) return NextResponse.json({ error: 'Oferta nie znaleziona' }, { status: 404 });

            const recipientEmail = offer.user?.email || offer.client_email;
            if (!recipientEmail) {
                return NextResponse.json({ error: 'Brak adresu e-mail klienta' }, { status: 400 });
            }
            const clientName = offer.user?.name || (offer.client_email?.split('@')[0]) || 'Pani/Panie';
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl';
            const offerLink = `${appUrl}/strefa-klienta/oferty/${offer.id}`;

            // Dane bankowe + procent zaliczki z Settings (jeden globalny rekord id=1)
            const settings = await prisma.settings.findFirst({
                select: {
                    bank_account_number: true,
                    bank_account_holder: true,
                    bank_name: true,
                    bank_swift: true,
                    split_payment_deposit_percent: true,
                },
            });
            const depositPct = settings?.split_payment_deposit_percent || 30;
            const depositAmount = Math.round((offer.total_price || 0) * (depositPct / 100));

            // Walidacje sensu zalecenia
            if (type === 'deposit' && offer.status !== 'accepted') {
                return NextResponse.json({
                    error: 'Przypomnienie o zaliczce ma sens tylko dla zaakceptowanej oferty (status=accepted).',
                    currentStatus: offer.status,
                }, { status: 400 });
            }

            const subject = type === 'deposit'
                ? `Przypomnienie o wpłacie zaliczki — ${offer.title}`
                : `Czeka na Ciebie oferta: ${offer.title}`;

            const intro = type === 'deposit'
                ? `Dziękuję za zaakceptowanie oferty <strong>${offer.title}</strong>. Aby zarezerwować termin sesji, czekam jeszcze na <strong>wpłatę zaliczki (${depositPct}% wartości umowy)</strong>.`
                : `Przypominam, że na Twoim koncie czeka spersonalizowana oferta <strong>${offer.title}</strong>. Po jej akceptacji ustalimy szczegóły i termin sesji.`;

            const cta = type === 'deposit' ? 'Zapłać online (PayU)' : 'Otwórz ofertę';

            // Sekcja z numerem konta — tylko dla przypominajki o zaliczce i tylko jeśli admin uzupełnił dane
            const bankBlock = (type === 'deposit' && settings?.bank_account_number) ? `
      <div style="margin:18px 0; padding:16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; font-size:13px; color:#1f2937;">
        <div style="font-weight:bold; margin-bottom:8px; color:#0f172a;">Dane do przelewu tradycyjnego:</div>
        ${settings.bank_account_holder ? `<div><span style="color:#64748b;">Odbiorca:</span> ${settings.bank_account_holder}</div>` : ''}
        <div style="font-family: 'Courier New', monospace; font-size:14px; margin:6px 0; padding:8px; background:#fff; border:1px dashed #94a3b8; border-radius:4px; letter-spacing:1px;">
          ${settings.bank_account_number}
        </div>
        ${settings.bank_name ? `<div><span style="color:#64748b;">Bank:</span> ${settings.bank_name}</div>` : ''}
        <div style="margin-top:6px;"><span style="color:#64748b;">Tytuł przelewu:</span> <strong>Zaliczka — ${offer.offerNumber || `#${offer.id}`}</strong></div>
        <div style="margin-top:6px;"><span style="color:#64748b;">Kwota:</span> <strong>${depositAmount.toLocaleString('pl-PL')} PLN</strong></div>
      </div>` : '';

            const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family: -apple-system, Segoe UI, sans-serif; background:#f3f4f6; margin:0; padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
    <h2 style="font-family:'Playfair Display', serif; color:#1a1a1a; font-size:22px; margin:0 0 8px;">Witaj ${clientName},</h2>
    <p style="color:#374151; line-height:1.6; font-size:14px;">${intro}</p>
    ${type === 'deposit' ? `
      <div style="margin:18px 0; padding:14px; background:#fef9c3; border-left:4px solid #c5a059; border-radius:4px; font-size:13px; color:#1f2937;">
        <strong>Wartość oferty:</strong> ${(offer.total_price || 0).toLocaleString('pl-PL')} PLN<br>
        <strong>Zaliczka (${depositPct}%):</strong> ${depositAmount.toLocaleString('pl-PL')} PLN<br>
        <strong>Numer oferty:</strong> ${offer.offerNumber || `#${offer.id}`}
      </div>
      ${bankBlock}
      <p style="color:#374151; font-size:13px; line-height:1.6; margin:18px 0 8px;">Możesz zapłacić <strong>online przez PayU/BLIK</strong> z poziomu strony oferty (przycisk poniżej) lub klasycznym przelewem na podany rachunek.</p>` : ''}
    <p style="text-align:center; margin:28px 0;">
      <a href="${offerLink}" style="display:inline-block; background:#c5a059; color:#fff; text-decoration:none; padding:14px 28px; border-radius:6px; font-weight:bold; font-size:14px; letter-spacing:0.5px;">${cta} →</a>
    </p>
    <p style="color:#6b7280; font-size:12px; line-height:1.5;">Jeśli nie pamiętasz hasła, możesz je odzyskać klikając "Zapomniałem hasła" na stronie logowania. Login = Twój adres e-mail.</p>
    <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;">
    <p style="color:#9ca3af; font-size:11px; text-align:center;">Przemysław Właśniewski · wlasniewski.pl<br>Ta wiadomość została wysłana ręcznie z panelu administracyjnego jako przypomnienie.</p>
  </div>
</body></html>`;

            await sendEmail({ to: recipientEmail, subject, html });

            // Log w CRM
            try {
                await prisma.crmActivity.create({
                    data: {
                        client_id: offer.client_id || offer.user?.id || null,
                        client_email: recipientEmail,
                        action: type === 'deposit' ? 'reminder_deposit_due' : 'reminder_unread_offer',
                        entity_type: 'offer',
                        entity_id: offer.id,
                        details: JSON.stringify({
                            sent_to: recipientEmail,
                            offer_number: offer.offerNumber,
                            offer_title: offer.title,
                            type,
                        }),
                    },
                });
            } catch (e) {
                console.warn('[remind] CRM log failed', e);
            }

            return NextResponse.json({ success: true, sent_to: recipientEmail, type });
        } catch (e: any) {
            console.error('[POST /api/admin/offers/[id]/remind]', e);
            return NextResponse.json({ error: e.message || 'Internal' }, { status: 500 });
        }
    });
}
