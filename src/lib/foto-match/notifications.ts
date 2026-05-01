/**
 * Foto-Match: pomocnicze maile lifecycle.
 * Każdy mail jest best-effort (nie blokuje API gdy SMTP padnie).
 */
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
