import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/sender';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cron: automatyczne przypomnienia o zaliczkach na warsztaty.
 *
 * Trigger: external cron (cron-job.org / Netlify scheduled fn / Uptime Robot), codziennie ~09:00.
 * Auth: Authorization: Bearer ${CRON_SECRET}
 *
 * Reguły:
 *  - status in ('sent','paid')  ← czyli oferty żywe (paid bez konta nie wysyłamy)
 *  - faktycznie tylko status='sent' i deposit_paid_at IS NULL
 *  - deposit_due_at <= NOW() + 3 dni  → typ "upcoming"
 *  - deposit_due_at < NOW()            → typ "overdue"
 *  - idempotencja: marker [REMIND_<TYPE>_<YYYY-MM-DD>] w notes (1 raz dziennie max)
 *
 * Uwaga: re-używa tego samego templatu co ręczna przypominajka — różnica tylko w trigger źródle.
 */
async function handle(request: NextRequest) {
    const auth = request.headers.get('authorization') || '';
    const expected = `Bearer ${process.env.CRON_SECRET || ''}`;
    if (!process.env.CRON_SECRET || auth !== expected) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const horizon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const today = now.toISOString().slice(0, 10);

    const offers = await prisma.workshopOffer.findMany({
        where: {
            status: 'sent',
            deposit_paid_at: null,
            deposit_due_at: { not: null, lte: horizon },
        },
        include: { workshop: true },
    });

    const settings = await prisma.settings.findFirst({
        select: { bank_account_number: true, bank_account_holder: true, bank_name: true },
    }).catch(() => null);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl';

    let sent = 0, skipped = 0, failed = 0;

    for (const o of offers) {
        const due = o.deposit_due_at ? new Date(o.deposit_due_at) : null;
        if (!due) { skipped++; continue; }
        const overdue = due < now;
        const type = overdue ? 'overdue' : 'upcoming';
        const markerToday = `[REMIND_${type.toUpperCase()}_${today}]`;
        const markerOtherToday = `[REMIND_${overdue ? 'UPCOMING' : 'OVERDUE'}_${today}]`;
        if ((o.notes || '').includes(markerToday) || (o.notes || '').includes(markerOtherToday)) {
            skipped++;
            continue;
        }

        const ws = o.workshop;
        if (!ws) { skipped++; continue; }

        const recipientName = o.recipient_name || o.recipient_email.split('@')[0];
        const dueStr = due.toLocaleDateString('pl-PL');
        const startStr = ws.start_date
            ? new Date(ws.start_date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
            : null;
        const landingUrl = `${baseUrl}/warsztaty/${ws.slug}`;

        const subject = type === 'overdue'
            ? `[PILNE] Termin zaliczki minął — miejsce na warsztatach zagrożone: ${ws.title}`
            : `Przypomnienie o zaliczce — ${ws.title}`;

        const intro = type === 'overdue'
            ? `Niestety <strong>termin wpłaty zaliczki (${dueStr}) minął</strong>${startStr ? `, a warsztaty rozpoczynają się <strong>${startStr}</strong>` : ''}. Bez wpłaty nie mogę dłużej blokować dla Ciebie miejsca — <strong>rezerwacja jest zagrożona</strong>. Proszę o pilną reakcję.`
            : `Przypominam o zaliczce rezerwującej miejsce na warsztatach <strong>${ws.title}</strong>${startStr ? ` (${startStr})` : ''}. Termin wpłaty: <strong>${dueStr}</strong>.`;

        const bankBlock = settings?.bank_account_number ? `
            <div style="margin:18px 0;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-size:13px;color:#1f2937;">
                <div style="font-weight:bold;margin-bottom:8px;color:#0f172a;">Dane do przelewu:</div>
                ${settings.bank_account_holder ? `<div><span style="color:#64748b;">Odbiorca:</span> ${settings.bank_account_holder}</div>` : ''}
                <div style="font-family:'Courier New',monospace;font-size:14px;margin:6px 0;padding:8px;background:#fff;border:1px dashed #94a3b8;border-radius:4px;letter-spacing:1px;">${settings.bank_account_number}</div>
                ${settings.bank_name ? `<div><span style="color:#64748b;">Bank:</span> ${settings.bank_name}</div>` : ''}
                <div style="margin-top:6px;"><span style="color:#64748b;">Tytuł:</span> <strong>Zaliczka warsztaty ${ws.title}${o.participant_name ? ` — ${o.participant_name}` : ''}</strong></div>
                ${o.deposit_amount ? `<div style="margin-top:6px;"><span style="color:#64748b;">Kwota:</span> <strong>${o.deposit_amount.toLocaleString('pl-PL')} PLN</strong></div>` : ''}
            </div>` : '';

        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family:-apple-system,Segoe UI,sans-serif;background:#f3f4f6;margin:0;padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;box-shadow:0 4px 12px rgba(0,0,0,0.06);${type === 'overdue' ? 'border-top:4px solid #dc2626;' : 'border-top:4px solid #f59e0b;'}">
        ${type === 'overdue' ? '<div style="display:inline-block;background:#fee2e2;color:#991b1b;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:bold;letter-spacing:1px;margin-bottom:12px;">⚠ PILNE — MIEJSCE ZAGROŻONE</div>' : ''}
        <h2 style="font-family:'Playfair Display',serif;color:#1a1a1a;font-size:22px;margin:0 0 8px;">Witaj ${recipientName},</h2>
        <p style="color:#374151;line-height:1.6;font-size:14px;">${intro}</p>
        <div style="margin:18px 0;padding:14px;background:${type === 'overdue' ? '#fee2e2' : '#fef3c7'};border-left:4px solid ${type === 'overdue' ? '#dc2626' : '#f59e0b'};border-radius:4px;font-size:13px;color:#1f2937;">
            <strong>Warsztaty:</strong> ${ws.title}<br>
            ${startStr ? `<strong>Termin:</strong> ${startStr}<br>` : ''}
            ${ws.location ? `<strong>Miejsce:</strong> ${ws.location}<br>` : ''}
            ${o.price ? `<strong>Cena:</strong> ${o.price.toLocaleString('pl-PL')} PLN<br>` : ''}
            ${o.deposit_amount ? `<strong>Zaliczka:</strong> ${o.deposit_amount.toLocaleString('pl-PL')} PLN<br>` : ''}
            <strong>Termin wpłaty:</strong> ${dueStr}${type === 'overdue' ? ' <span style="color:#dc2626;">(MINĄŁ)</span>' : ''}
        </div>
        ${bankBlock}
        <p style="text-align:center;margin:28px 0;">
            <a href="${landingUrl}" style="display:inline-block;background:${type === 'overdue' ? '#dc2626' : '#f59e0b'};color:#fff;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:bold;font-size:14px;letter-spacing:0.5px;">Otwórz stronę warsztatów →</a>
        </p>
        <p style="color:#6b7280;font-size:12px;line-height:1.5;">Jeśli wpłata została już zrealizowana — zignoruj tę wiadomość, zaksięgujemy ją w ciągu 1–2 dni.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
        <p style="color:#9ca3af;font-size:11px;text-align:center;">Przemysław Właśniewski · wlasniewski.pl<br>Wiadomość automatyczna — przypomnienie o terminie zaliczki.</p>
    </div>
</body></html>`;

        try {
            await sendEmail({ to: o.recipient_email, subject, html });
            await prisma.workshopOffer.update({
                where: { id: o.id },
                data: { notes: `${o.notes || ''}\n${markerToday}`.trim() },
            });
            sent++;
        } catch (e) {
            console.error(`[cron workshop-deposit-reminder] offer #${o.id} failed`, e);
            failed++;
        }
    }

    return NextResponse.json({ ok: true, scanned: offers.length, sent, skipped, failed });
}

export async function GET(request: NextRequest) {
    return handle(request);
}
export async function POST(request: NextRequest) {
    return handle(request);
}
