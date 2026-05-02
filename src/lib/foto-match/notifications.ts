/**
 * Foto-Match: pomocnicze maile lifecycle.
 * Każdy mail jest best-effort (nie blokuje API gdy SMTP padnie).
 */
import prisma from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/sender';
import { getSiteUrl } from '@/lib/site-url';

const SITE = () => getSiteUrl();

async function safeSend(promise: Promise<unknown>) {
    try {
        await promise;
    } catch (e: any) {
        console.error('[FOTO_MATCH_EMAIL] failed:', e?.message || e);
    }
}

export function sendProfileSubmitted(opts: { to: string; name: string | null }) {
    return safeSend(sendEmail({
        to: opts.to,
        subject: 'Foto-Match: profil przyjęty do weryfikacji',
        template: 'foto-match-submitted',
        data: { name: opts.name, profileUrl: `${SITE()}/foto-match/profil` },
    }));
}

export function sendProfileApproved(opts: { to: string; name: string | null; displayName: string }) {
    return safeSend(sendEmail({
        to: opts.to,
        subject: '🎉 Foto-Match: Twój profil jest aktywny!',
        template: 'foto-match-approved',
        data: {
            name: opts.name,
            displayName: opts.displayName,
            discoverUrl: `${SITE()}/foto-match/odkryj`,
            referUrl: `${SITE()}/foto-match/zapros`,
        },
    }));
}

export function sendProfileRejected(opts: { to: string; name: string | null; displayName: string; reason: string | null }) {
    return safeSend(sendEmail({
        to: opts.to,
        subject: 'Foto-Match: profil wymaga zmian',
        template: 'foto-match-rejected',
        data: {
            name: opts.name,
            displayName: opts.displayName,
            reason: opts.reason,
            profileUrl: `${SITE()}/foto-match/onboarding`,
        },
    }));
}

export function sendProfileSuspended(opts: { to: string; name: string | null; reason: string | null }) {
    return safeSend(sendEmail({
        to: opts.to,
        subject: 'Foto-Match: profil zawieszony',
        template: 'foto-match-suspended',
        data: { name: opts.name, reason: opts.reason },
    }));
}

export function sendReferralRewarded(opts: {
    to: string;
    name: string | null;
    bonusLabel: string;
    voucherCode: string;
    expiresAt: string | null;
}) {
    return safeSend(sendEmail({
        to: opts.to,
        subject: '🎁 Foto-Match: dostałeś bonus za polecenie!',
        template: 'foto-match-referral-rewarded',
        data: {
            name: opts.name,
            bonusLabel: opts.bonusLabel,
            voucherCode: opts.voucherCode,
            expiresAt: opts.expiresAt,
            bookingUrl: `${SITE()}/rezerwacja`,
        },
    }));
}

/**
 * Email wysyłany do `recipientProfileId` po wzajemnym match-u z `partnerProfileId`.
 * Pomija profile testowe (@fotomatch.test).
 */
export async function sendMatchEmail(recipientProfileId: number, partnerProfileId: number): Promise<void> {
    const [recipient, partner] = await Promise.all([
        prisma.fotoMatchProfile.findUnique({
            where: { id: recipientProfileId },
            include: { user: { select: { email: true, name: true } } },
        }),
        prisma.fotoMatchProfile.findUnique({
            where: { id: partnerProfileId },
            select: { id: true, display_name: true, city: true, photos: { take: 1, orderBy: { id: 'asc' }, select: { url: true } } },
        }),
    ]);

    if (!recipient?.user?.email || !partner) return;
    if (recipient.user.email.endsWith('@fotomatch.test')) return; // pomiń seed test

    const partnerPhoto = partner.photos[0]?.url;
    const link = `${SITE()}/foto-match/odkryj?match=${partner.id}`;
    const html = `
<div style="font-family:Inter,Arial,sans-serif;background:#0a0a0a;color:#fff;padding:32px;max-width:600px;margin:0 auto;border-radius:12px">
  <h1 style="margin:0 0 8px;font-size:28px;color:#f59e0b">Masz nowy match!</h1>
  <p style="color:#a1a1aa;margin:0 0 24px">${recipient.display_name}, polubiła/polubił Cię osoba która wcześniej polubiła Twój profil.</p>
  ${partnerPhoto ? `<img src="${partnerPhoto}" alt="${partner.display_name}" style="width:100%;max-width:360px;border-radius:12px;margin-bottom:16px">` : ''}
  <h2 style="margin:0 0 4px;font-size:22px">${partner.display_name}${partner.city ? ` &middot; ${partner.city}` : ''}</h2>
  <p style="color:#a1a1aa;margin:0 0 24px">Możecie zacząć rozmowę i umówić wspólną sesję zdjęciową.</p>
  <a href="${link}" style="display:inline-block;padding:14px 28px;background:#f59e0b;color:#000;text-decoration:none;border-radius:8px;font-weight:bold">Otwórz Foto-Match &rarr;</a>
  <p style="color:#71717a;font-size:12px;margin-top:32px">Nie chcesz takich powiadomień? Zmień ustawienia w profilu Foto-Match.</p>
</div>`;

    await safeSend(sendEmail({
        to: recipient.user.email,
        subject: `Nowy match: ${partner.display_name}`,
        html,
    }));
}
