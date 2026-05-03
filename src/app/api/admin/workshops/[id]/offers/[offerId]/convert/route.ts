import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { generatePin, hashPin, pickRandomAvatar, buildLogin } from '@/lib/workshops/auth';
import { sendEmail } from '@/lib/email/sender';

export const dynamic = 'force-dynamic';

// POST /api/admin/workshops/[id]/offers/[offerId]/convert
// Tworzy konto uczestnika z oferty (po wplacie zaliczki) i wysyla loginy mailem.
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string; offerId: string }> }) {
    return withAuth(request, async () => {
        const { id, offerId } = await ctx.params;
        const wid = parseInt(id, 10);
        const oid = parseInt(offerId, 10);
        if (!wid || !oid) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

        const workshop = await prisma.workshop.findUnique({ where: { id: wid } });
        if (!workshop) return NextResponse.json({ error: 'Warsztat nie istnieje' }, { status: 404 });

        const offer = await prisma.workshopOffer.findFirst({ where: { id: oid, workshop_id: wid } });
        if (!offer) return NextResponse.json({ error: 'Oferta nie istnieje' }, { status: 404 });
        if (offer.participant_id) {
            return NextResponse.json({ error: 'Ta oferta ma juz utworzone konto uczestnika' }, { status: 400 });
        }

        // Wybierz nastepny indeks loginu
        const existing = await prisma.workshopParticipant.findMany({
            where: { workshop_id: wid }, select: { login: true },
        });
        let maxIdx = 0;
        const re = new RegExp(`^${workshop.slug}-(\\d+)$`);
        for (const p of existing) {
            const m = p.login.match(re);
            if (m) maxIdx = Math.max(maxIdx, parseInt(m[1], 10));
        }
        const idx = maxIdx + 1;
        const login = buildLogin(workshop.slug, idx);
        const pin = generatePin(6);
        const pinHash = await hashPin(pin);
        const avatar = pickRandomAvatar(idx);

        const participant = await prisma.workshopParticipant.create({
            data: {
                workshop_id: wid,
                login,
                pin_hash: pinHash,
                pin_plain_temp: pin,
                avatar,
                display_name: offer.participant_name || null,
            },
        });

        await prisma.workshopOffer.update({
            where: { id: oid },
            data: { participant_id: participant.id, status: 'confirmed' },
        });

        // Wyslij dane logowania
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl';
        const loginUrl = `${baseUrl}/warsztaty/${workshop.slug}/login`;
        try {
            await sendEmail({
                to: offer.recipient_email,
                subject: `🎉 Potwierdzenie zapisu na warsztaty: ${workshop.title}`,
                html: `
                    <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
                        <div style="background:linear-gradient(135deg,#10b981 0%,#f59e0b 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
                            <div style="font-size:48px;">${avatar}</div>
                            <h1 style="margin:8px 0 0;">Witamy na warsztatach!</h1>
                            <p style="margin:8px 0 0;opacity:0.95;">${workshop.title}</p>
                        </div>
                        <div style="padding:24px;color:#1f2937;">
                            <p>Zaliczka zaksięgowana${offer.participant_name ? ` — miejsce dla <strong>${offer.participant_name}</strong> jest zarezerwowane` : ''}.</p>
                            <div style="background:#fef3c7;border:2px solid #f59e0b;border-radius:8px;padding:16px;margin:16px 0;">
                                <div style="text-transform:uppercase;font-size:11px;color:#92400e;font-weight:bold;">Dane do logowania</div>
                                <div style="margin-top:8px;font-size:15px;"><strong>Login:</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px;">${login}</code></div>
                                <div style="font-size:15px;margin-top:4px;"><strong>PIN:</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px;font-size:18px;letter-spacing:2px;">${pin}</code></div>
                                <div style="margin-top:12px;"><a href="${loginUrl}" style="background:#f43f5e;color:white;padding:10px 18px;text-decoration:none;border-radius:6px;font-weight:bold;">Zaloguj się do panelu</a></div>
                            </div>
                            <p style="font-size:13px;color:#6b7280;">Pełen program i materiały znajdziesz po zalogowaniu. Do zobaczenia!</p>
                        </div>
                    </div>
                `,
            });
        } catch (e) {
            console.warn('[convert] mail send failed', e);
        }

        return NextResponse.json({ ok: true, participant: { id: participant.id, login, pin, avatar } });
    });
}
