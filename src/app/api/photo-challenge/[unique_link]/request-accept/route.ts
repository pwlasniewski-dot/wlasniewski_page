/**
 * POST /api/photo-challenge/[unique_link]/request-accept
 *
 * Wysyła ponownie e-mail z osobistym linkiem akceptacji do invitee_contact.
 * Używane gdy zaproszony zgubił mail albo gdy ktoś wszedł z udostępnionego linka
 * (bez tokena ?t=) i chce dostać własny link na maila.
 *
 * Bezpieczeństwo:
 *  - rate-limit: 3/min/challenge (in-memory, best-effort)
 *  - link wysyłany jest WYŁĄCZNIE na invitee_contact zapisany w bazie — nie da się
 *    przekierować maila gdzie indziej.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/sender';
import { generateChallengeInviteEmail } from '@/lib/email-templates';
import { createAcceptToken } from '@/lib/photo-challenge/accept-token';
import { getSiteUrl } from '@/lib/site-url';
import { logSystem } from '@/lib/logger';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const recentRequests = new Map<string, number[]>(); // challengeId → timestamps

function rateLimitOk(key: string): boolean {
    const now = Date.now();
    const arr = (recentRequests.get(key) || []).filter((t) => now - t < 60_000);
    if (arr.length >= 3) return false;
    arr.push(now);
    recentRequests.set(key, arr);
    return true;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ unique_link: string }> }
) {
    try {
        const { unique_link } = await params;
        const challenge = await prisma.photoChallenge.findUnique({
            where: { unique_link },
            include: { package: true },
        });

        if (!challenge) {
            return NextResponse.json({ success: false, error: 'Wyzwanie nie istnieje' }, { status: 404 });
        }

        if (!rateLimitOk(String(challenge.id))) {
            return NextResponse.json(
                { success: false, error: 'Za dużo prób. Spróbuj ponownie za minutę.' },
                { status: 429 }
            );
        }

        // Upewnij się, że istnieje invitee User
        let inviteeUser = challenge.invitee_user_id
            ? await prisma.user.findUnique({ where: { id: challenge.invitee_user_id } })
            : null;
        if (!inviteeUser) {
            inviteeUser = await prisma.user.findUnique({ where: { email: challenge.invitee_contact } });
        }
        if (!inviteeUser) {
            const randomPwd = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
            inviteeUser = await prisma.user.create({
                data: {
                    email: challenge.invitee_contact,
                    password_hash: randomPwd,
                    name: challenge.invitee_name,
                    role: 'CLIENT',
                    is_active: true,
                },
            });
            await prisma.photoChallenge.update({
                where: { id: challenge.id },
                data: { invitee_user_id: inviteeUser.id },
            });
        } else if (!challenge.invitee_user_id) {
            await prisma.photoChallenge.update({
                where: { id: challenge.id },
                data: { invitee_user_id: inviteeUser.id },
            });
        }

        const baseUrl = getSiteUrl();
        const acceptToken = await createAcceptToken({
            challengeId: challenge.id,
            inviteeEmail: challenge.invitee_contact,
            inviteeUserId: inviteeUser.id,
        });
        const link = `${baseUrl}/foto-wyzwanie/invite/${unique_link}?t=${encodeURIComponent(acceptToken)}`;

        const html = generateChallengeInviteEmail({
            inviterName: challenge.inviter_name,
            inviteeName: challenge.invitee_name,
            link,
            packageName: challenge.package?.name || 'Foto Wyzwanie',
        });

        await sendEmail({
            to: challenge.invitee_contact,
            subject: `🔐 Twój osobisty link do akceptacji wyzwania od ${challenge.inviter_name}`,
            html,
        });

        await logSystem('INFO', 'EMAIL', `Re-sent challenge accept-link to ${challenge.invitee_contact}`, {
            challengeId: challenge.id,
        });

        // Maska adresu, żeby UI mógł pokazać "wysłaliśmy na p***@***.pl"
        const masked = (() => {
            const [local, domain] = challenge.invitee_contact.split('@');
            if (!domain) return challenge.invitee_contact;
            const l = local.length <= 2 ? local : local[0] + '***' + local.slice(-1);
            const [dName, ...rest] = domain.split('.');
            const d = dName.length <= 2 ? dName : dName[0] + '***';
            return `${l}@${d}.${rest.join('.')}`;
        })();

        return NextResponse.json({ success: true, masked });
    } catch (error) {
        console.error('request-accept error:', error);
        return NextResponse.json({ success: false, error: 'Błąd serwera' }, { status: 500 });
    }
}
