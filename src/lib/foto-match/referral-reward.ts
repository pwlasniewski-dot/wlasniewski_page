/**
 * Foto-Match referral: po zatwierdzeniu profilu zaproszonego usera,
 * przyznajemy voucher polecającemu (jeśli bonus włączony w settings).
 */
import crypto from 'node:crypto';
import prisma from '@/lib/db/prisma';

export type ReferralAwardResult = {
    referralId: number;
    referrerEmail: string;
    referrerName: string | null;
    voucherCode: string;
    bonusLabel: string;
    expiresAt: string | null;
} | null;

function formatGrosze(grosze: number): string {
    return (grosze / 100).toFixed(2).replace(/\.00$/, '') + ' zł';
}

function buildBonusLabel(type: string, amount: number, percent: number): string {
    if (type === 'BOTH') return `${formatGrosze(amount)} lub ${percent}%`;
    if (type === 'PERCENT') return `${percent}%`;
    return formatGrosze(amount);
}

function generateVoucherCode(): string {
    return crypto.randomBytes(6).toString('hex').toUpperCase(); // 12-char A-F0-9
}

export async function tryAwardReferral(opts: {
    invitedUserId: number;
    invitedProfileId: number;
}): Promise<ReferralAwardResult> {
    // 1) Znajdź referral który czeka na tego użytkownika
    const referral = await prisma.fotoMatchReferral.findFirst({
        where: {
            invited_user_id: opts.invitedUserId,
            status: { in: ['PENDING', 'REGISTERED'] },
        },
        include: {
            referrer: { include: { user: { select: { email: true, name: true } } } },
        },
    });
    if (!referral) return null;

    // 2) Sprawdź globalne ustawienia bonusu
    const settings = await prisma.fotoMatchMatchSettings.findFirst({ orderBy: { id: 'asc' } });

    // Zawsze podlinkuj invited_profile, nawet bez bonusu (statystyki).
    const baseUpdate = {
        invited_profile_id: opts.invitedProfileId,
        status: 'ACTIVE' as const,
    };

    if (!settings?.referral_bonus_enabled) {
        await prisma.fotoMatchReferral.update({
            where: { id: referral.id },
            data: baseUpdate,
        });
        return null;
    }

    // 3) Wygeneruj voucher
    const code = generateVoucherCode();
    const expiresAt = settings.referral_bonus_expires_days > 0
        ? new Date(Date.now() + settings.referral_bonus_expires_days * 86400_000)
        : null;

    await prisma.fotoMatchReferral.update({
        where: { id: referral.id },
        data: {
            ...baseUpdate,
            status: 'REWARDED',
            reward_amount_grosze: settings.referral_bonus_amount_grosze,
            reward_percent: settings.referral_bonus_percent,
            reward_type: settings.referral_bonus_type,
            reward_voucher_code: code,
            reward_expires_at: expiresAt,
        },
    });

    const refUser = referral.referrer?.user;
    if (!refUser) return null;

    return {
        referralId: referral.id,
        referrerEmail: refUser.email,
        referrerName: refUser.name,
        voucherCode: code,
        bonusLabel: buildBonusLabel(
            settings.referral_bonus_type,
            settings.referral_bonus_amount_grosze,
            settings.referral_bonus_percent,
        ),
        expiresAt: expiresAt ? expiresAt.toISOString().slice(0, 10) : null,
    };
}
