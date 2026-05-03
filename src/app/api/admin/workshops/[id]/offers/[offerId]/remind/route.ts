import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/email/sender';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/workshops/[id]/offers/[offerId]/remind?type=upcoming|overdue
 *
 * Wysyła ręczną przypominajkę o wpłacie zaliczki dla oferty warsztatu.
 *  - upcoming: termin jeszcze nie minął (lub brak terminu) — ton miły.
 *  - overdue:  termin minął — ton stanowczy, "miejsce zagrożone".
 *  - brak parametru → auto-detekcja po deposit_due_at.
 *
 * Idempotencja "miękka": w polu notes dorzucamy marker [REMIND_YYYY-MM-DD],
 * żeby można było zobaczyć kiedy ostatnio coś poszło i żeby cron nie dublował z ręcznym.
 */
export async function POST(
    request: NextRequest,
    ctx: { params: Promise<{ id: string; offerId: string }> }
) {
    return withAuth(request, async (req) => {
        try {
            const { id, offerId } = await ctx.params;
            const wid = parseInt(id, 10);
            const oid = parseInt(offerId, 10);
            if (!wid || !oid) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

            const url = new URL(req.url);
            let type = (url.searchParams.get('type') || '').toLowerCase();

            const offer = await prisma.workshopOffer.findFirst({
                where: { id: oid, workshop_id: wid },
            });
            if (!offer) return NextResponse.json({ error: 'Oferta nie znaleziona' }, { status: 404 });
            if (offer.deposit_paid_at) {
                return NextResponse.json({ error: 'Zaliczka już opłacona — przypomnienie zbędne' }, { status: 400 });
            }
            if (offer.status === 'cancelled' || offer.status === 'confirmed') {
                return NextResponse.json({ error: `Status ${offer.status} — nie wysyłam przypomnienia` }, { status: 400 });
            }

            const workshop = await prisma.workshop.findUnique({ where: { id: wid } });
            if (!workshop) return NextResponse.json({ error: 'Warsztat nie istnieje' }, { status: 404 });

            const due = offer.deposit_due_at ? new Date(offer.deposit_due_at) : null;
            const now = new Date();
            if (!type) type = due && due < now ? 'overdue' : 'upcoming';
            if (!['upcoming', 'overdue'].includes(type)) type = 'upcoming';

            const settings = await prisma.settings.findFirst({
                select: {
                    bank_account_number: true,
                    bank_account_holder: true,
                    bank_name: true,
                },
            }).catch(() => null);

            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl';
            const landingUrl = `${baseUrl}/warsztaty/${workshop.slug}`;
            const dueStr = due ? due.toLocaleDateString('pl-PL') : null;
            const startStr = workshop.start_date
                ? new Date(workshop.start_date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
                : null;

            const recipientName = offer.recipient_name || offer.recipient_email.split('@')[0];
            const subject = type === 'overdue'
                ? `[PILNE] Termin zaliczki minął — miejsce na warsztatach zagrożone: ${workshop.title}`
                : `Przypomnienie o zaliczce — ${workshop.title}`;

            const intro = type === 'overdue'
                ? `Niestety <strong>termin wpłaty zaliczki${dueStr ? ` (${dueStr})` : ''} minął</strong>${startStr ? `, a warsztaty rozpoczynają się <strong>${startStr}</strong>` : ''}. Bez wpłaty nie mogę dłużej blokować dla Ciebie miejsca — <strong>rezerwacja jest zagrożona</strong>. Proszę o pilną reakcję.`
                : `Przypominam o zaliczce rezerwującej miejsce na warsztatach <strong>${workshop.title}</strong>${startStr ? ` (${startStr})` : ''}${dueStr ? `. Termin wpłaty: <strong>${dueStr}</strong>` : ''}.`;

            const bankBlock = settings?.bank_account_number ? `
                <div style="margin:18px 0; padding:16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; font-size:13px; color:#1f2937;">
                    <div style="font-weight:bold; margin-bottom:8px; color:#0f172a;">Dane do przelewu:</div>
                    ${settings.bank_account_holder ? `<div><span style="color:#64748b;">Odbiorca:</span> ${settings.bank_account_holder}</div>` : ''}
                    <div style="font-family: 'Courier New', monospace; font-size:14px; margin:6px 0; padding:8px; background:#fff; border:1px dashed #94a3b8; border-radius:4px; letter-spacing:1px;">
                        ${settings.bank_account_number}
                    </div>
                    ${settings.bank_name ? `<div><span style="color:#64748b;">Bank:</span> ${settings.bank_name}</div>` : ''}
                    <div style="margin-top:6px;"><span style="color:#64748b;">Tytuł:</span> <strong>Zaliczka warsztaty ${workshop.title}${offer.participant_name ? ` — ${offer.participant_name}` : ''}</strong></div>
                    ${offer.deposit_amount ? `<div style="margin-top:6px;"><span style="color:#64748b;">Kwota:</span> <strong>${offer.deposit_amount.toLocaleString('pl-PL')} PLN</strong></div>` : ''}
                </div>` : '';

            const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family:-apple-system,Segoe UI,sans-serif;background:#f3f4f6;margin:0;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;box-shadow:0 4px 12px rgba(0,0,0,0.06);${type === 'overdue' ? 'border-top:4px solid #dc2626;' : 'border-top:4px solid #f59e0b;'}">
        ${type === 'overdue' ? '<div style="display:inline-block;background:#fee2e2;color:#991b1b;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:bold;letter-spacing:1px;margin-bottom:12px;">⚠ PILNE — MIEJSCE ZAGROŻONE</div>' : ''}
        <h2 style="font-family:'Playfair Display',serif;color:#1a1a1a;font-size:22px;margin:0 0 8px;">Witaj ${recipientName},</h2>
        <p style="color:#374151;line-height:1.6;font-size:14px;">${intro}</p>
        <div style="margin:18px 0;padding:14px;background:${type === 'overdue' ? '#fee2e2' : '#fef3c7'};border-left:4px solid ${type === 'overdue' ? '#dc2626' : '#f59e0b'};border-radius:4px;font-size:13px;color:#1f2937;">
            <strong>Warsztaty:</strong> ${workshop.title}<br>
            ${startStr ? `<strong>Termin:</strong> ${startStr}<br>` : ''}
            ${workshop.location ? `<strong>Miejsce:</strong> ${workshop.location}<br>` : ''}
            ${offer.price ? `<strong>Cena:</strong> ${offer.price.toLocaleString('pl-PL')} PLN<br>` : ''}
            ${offer.deposit_amount ? `<strong>Zaliczka:</strong> ${offer.deposit_amount.toLocaleString('pl-PL')} PLN<br>` : ''}
            ${dueStr ? `<strong>Termin wpłaty:</strong> ${dueStr}${type === 'overdue' ? ' <span style="color:#dc2626;">(MINĄŁ)</span>' : ''}` : ''}
        </div>
        ${bankBlock}
        <p style="text-align:center;margin:28px 0;">
            <a href="${landingUrl}" style="display:inline-block;background:${type === 'overdue' ? '#dc2626' : '#f59e0b'};color:#fff;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:bold;font-size:14px;letter-spacing:0.5px;">Otwórz stronę warsztatów →</a>
        </p>
        <p style="color:#6b7280;font-size:12px;line-height:1.5;">Jeśli wpłata została już zrealizowana — zignoruj tę wiadomość, zaksięgujemy ją w ciągu 1–2 dni.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
        <p style="color:#9ca3af;font-size:11px;text-align:center;">Przemysław Właśniewski · wlasniewski.pl</p>
    </div>
</body></html>`;

            await sendEmail({ to: offer.recipient_email, subject, html });

            const today = new Date().toISOString().slice(0, 10);
            const marker = `[REMIND_${type.toUpperCase()}_${today}]`;
            await prisma.workshopOffer.update({
                where: { id: oid },
                data: { notes: `${offer.notes || ''}\n${marker}`.trim() },
            });

            return NextResponse.json({ success: true, sent_to: offer.recipient_email, type });
        } catch (e: any) {
            console.error('[POST workshop offer remind]', e);
            return NextResponse.json({ error: e.message || 'Internal' }, { status: 500 });
        }
    });
}
