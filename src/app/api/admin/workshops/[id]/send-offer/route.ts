import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/email/sender';

export const dynamic = 'force-dynamic';

// POST /api/admin/workshops/[id]/send-offer
// body: {
//   recipient_email: string,
//   recipient_name?: string,
//   participant_name?: string,
//   price?: number,
//   deposit_amount?: number,
//   deposit_due_at?: string,
//   custom_message?: string,
// }
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req) => {
        const { id } = await ctx.params;
        const wid = parseInt(id, 10);
        if (!wid) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

        const body = await req.json().catch(() => ({}));
        const {
            recipient_email,
            recipient_name,
            participant_name,
            price,
            deposit_amount,
            deposit_due_at,
            custom_message,
        } = body || {};

        if (!recipient_email || !/^.+@.+\..+$/.test(recipient_email)) {
            return NextResponse.json({ error: 'Brak poprawnego adresu e-mail' }, { status: 400 });
        }

        const workshop = await prisma.workshop.findUnique({ where: { id: wid } });
        if (!workshop) return NextResponse.json({ error: 'Warsztat nie istnieje' }, { status: 404 });

        const settings = await prisma.setting.findFirst({
            select: {
                bank_account_number: true,
                bank_account_holder: true,
                bank_name: true,
            },
        }).catch(() => null);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL
            || process.env.NEXT_PUBLIC_BASE_URL
            || 'https://wlasniewski.pl';

        // Buduj plan HTML
        const schedule: any[] = Array.isArray(workshop.schedule) ? (workshop.schedule as any[]) : [];
        const scheduleHtml = schedule.length > 0
            ? `
                <h3 style="color:#9f1239;margin-top:24px;margin-bottom:12px;font-size:18px;">📅 Program warsztatów</h3>
                <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
                    <thead>
                        <tr style="background:#fef3c7;">
                            <th style="padding:10px 8px;text-align:left;border:1px solid #fde68a;font-weight:600;">Data</th>
                            <th style="padding:10px 8px;text-align:left;border:1px solid #fde68a;font-weight:600;">Godziny</th>
                            <th style="padding:10px 8px;text-align:left;border:1px solid #fde68a;font-weight:600;">Temat</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${schedule.map((s: any) => `
                            <tr style="background:#fff;">
                                <td style="padding:10px 8px;border:1px solid #fde68a;white-space:nowrap;">${s.date || '—'}</td>
                                <td style="padding:10px 8px;border:1px solid #fde68a;white-space:nowrap;">${s.start || ''} – ${s.end || ''}</td>
                                <td style="padding:10px 8px;border:1px solid #fde68a;">
                                    <strong style="color:#1f2937;">${s.topic || ''}</strong>
                                    ${s.plan ? `<div style="color:#6b7280;font-size:13px;margin-top:4px;line-height:1.4;">${s.plan}</div>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `
            : '';

        const formatPrice = (amount: number) => {
            return amount.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(',00', '');
        };

        const priceBlock = price && price > 0
            ? `
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
                    <div style="font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;margin-bottom:8px;">Cena warsztatów</div>
                    <div style="font-size:32px;font-weight:bold;color:#0f172a;">${formatPrice(price)} PLN</div>
                </div>
            `
            : '';

        const depositBlock = deposit_amount && deposit_amount > 0
            ? `
                <div style="background:#fff7ed;border:2px solid #fb923c;border-radius:8px;padding:20px;margin:20px 0;">
                    <div style="text-align:center;margin-bottom:16px;">
                        <div style="font-size:11px;color:#c2410c;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;margin-bottom:8px;">💰 Zaliczka rezerwująca miejsce</div>
                        <div style="font-size:36px;font-weight:bold;color:#9a3412;">${formatPrice(deposit_amount)} PLN</div>
                        ${deposit_due_at ? `<div style="font-size:14px;color:#7c2d12;margin-top:8px;">Termin wpłaty: <strong>${new Date(deposit_due_at).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong></div>` : ''}
                    </div>
                    ${settings?.bank_account_number ? `
                        <div style="margin-top:16px;padding:16px;background:#fff;border-radius:6px;font-size:14px;border:1px solid #fed7aa;">
                            <div style="color:#9a3412;font-size:12px;text-transform:uppercase;font-weight:bold;margin-bottom:12px;">📋 Dane do przelewu</div>
                            <div style="margin:6px 0;line-height:1.6;"><strong style="color:#7c2d12;">Numer konta:</strong><br><code style="font-family:monospace;background:#fef3c7;padding:4px 8px;border-radius:4px;font-size:13px;display:inline-block;margin-top:4px;">${settings.bank_account_number}</code></div>
                            ${settings.bank_account_holder ? `<div style="margin:6px 0;line-height:1.6;"><strong style="color:#7c2d12;">Odbiorca:</strong> ${settings.bank_account_holder}</div>` : ''}
                            ${settings.bank_name ? `<div style="margin:6px 0;line-height:1.6;"><strong style="color:#7c2d12;">Bank:</strong> ${settings.bank_name}</div>` : ''}
                            <div style="margin:6px 0;line-height:1.6;"><strong style="color:#7c2d12;">Tytuł przelewu:</strong><br><span style="background:#fef3c7;padding:4px 8px;border-radius:4px;font-size:13px;display:inline-block;margin-top:4px;">Zaliczka warsztaty ${workshop.title}${participant_name ? ` - ${participant_name}` : ''}</span></div>
                        </div>
                    ` : ''}
                </div>
            `
            : '';

        const html = `
<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fef3c7;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;">
        <div style="background:linear-gradient(135deg,#f43f5e 0%,#f59e0b 100%);padding:32px 24px;text-align:center;color:white;">
            <div style="font-size:48px;margin-bottom:8px;">📸</div>
            <h1 style="margin:0;font-size:24px;font-weight:bold;">Warsztaty fotograficzne</h1>
            <p style="margin:8px 0 0;opacity:0.95;">${workshop.title}</p>
        </div>

        <div style="padding:32px 24px;color:#1f2937;">
            <p style="font-size:16px;margin:0 0 16px;">Witaj${recipient_name ? ` ${recipient_name}` : ''},</p>

            ${custom_message ? `<div style="background:#f9fafb;border-left:4px solid #f43f5e;padding:12px 16px;margin:16px 0;font-style:italic;color:#374151;white-space:pre-wrap;">${custom_message}</div>` : ''}

            <p style="margin:0 0 16px;">Zapraszam${participant_name ? ` ${participant_name}` : ''} na warsztaty fotograficzne organizowane przez Studio Właśniewski.</p>

            <table style="width:100%;font-size:14px;margin:16px 0;">
                <tr><td style="padding:6px 0;color:#6b7280;width:140px;">📍 Lokalizacja:</td><td style="padding:6px 0;font-weight:bold;">${workshop.location || '—'}</td></tr>
                ${workshop.starts_at ? `<tr><td style="padding:6px 0;color:#6b7280;">🗓 Start:</td><td style="padding:6px 0;font-weight:bold;">${new Date(workshop.starts_at).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>` : ''}
                ${workshop.ends_at ? `<tr><td style="padding:6px 0;color:#6b7280;">🏁 Koniec:</td><td style="padding:6px 0;font-weight:bold;">${new Date(workshop.ends_at).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>` : ''}
            </table>

            ${workshop.description ? `<div style="background:#fefce8;border-radius:8px;padding:16px;margin:16px 0;color:#374151;white-space:pre-wrap;font-size:14px;">${workshop.description}</div>` : ''}

            ${scheduleHtml}

            ${priceBlock}
            ${depositBlock}

            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:24px 0;">
                <h4 style="margin:0 0 8px;color:#15803d;">Co dalej?</h4>
                <ol style="margin:0;padding-left:20px;color:#166534;font-size:14px;">
                    ${deposit_amount ? `<li style="margin:4px 0;">Wpłać zaliczkę na podane konto bankowe</li>` : ''}
                    <li style="margin:4px 0;">Po potwierdzeniu wpłaty otrzymasz dane logowania (login + PIN) do panelu uczestnika</li>
                    <li style="margin:4px 0;">W panelu znajdziesz materiały, harmonogram i będziesz mógł przesyłać zdjęcia</li>
                </ol>
            </div>

            <p style="margin:24px 0 8px;font-size:14px;color:#6b7280;">W razie pytań — odpowiedz na tę wiadomość.</p>
            <p style="margin:0;font-size:14px;">Pozdrawiam,<br><strong>Przemysław Właśniewski</strong><br><a href="${baseUrl}" style="color:#f43f5e;">wlasniewski.pl</a></p>
        </div>

        <div style="background:#1f2937;color:#9ca3af;padding:16px;text-align:center;font-size:11px;">
            © ${new Date().getFullYear()} Studio Właśniewski · Warsztaty fotograficzne
        </div>
    </div>
</body></html>
        `.trim();

        try {
            await sendEmail({
                to: recipient_email,
                subject: `📸 Oferta warsztatów: ${workshop.title}`,
                html,
            });

            // Zapisz oferte w DB do trackingu
            const saved = await prisma.workshopOffer.create({
                data: {
                    workshop_id: wid,
                    recipient_email,
                    recipient_name: recipient_name || null,
                    participant_name: participant_name || null,
                    price: price ? parseFloat(String(price)) : null,
                    deposit_amount: deposit_amount ? parseFloat(String(deposit_amount)) : null,
                    deposit_due_at: deposit_due_at ? new Date(deposit_due_at) : null,
                    custom_message: custom_message || null,
                    status: 'sent',
                    source: 'admin',
                },
            });

            // Powiąż ofertę i warsztat z klientem CRM jeśli istnieje taki user
            const user = await prisma.user.findFirst({ where: { email: recipient_email } });
            if (user) {
                await prisma.workshopOffer.update({ where: { id: saved.id }, data: { client_id: user.id } });
                // Jeśli warsztat nie ma jeszcze organizatora, ustaw go
                if (!workshop.organizer_client_id) {
                    await prisma.workshop.update({ where: { id: wid }, data: { organizer_client_id: user.id } });
                }
            }

            return NextResponse.json({ ok: true, sent_to: recipient_email, offer_id: saved.id });
        } catch (e: any) {
            console.error('[send-offer]', e);
            return NextResponse.json({ error: e?.message || 'Błąd wysyłki' }, { status: 500 });
        }
    });
}
