import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/email/sender';
import { getSiteUrl } from '@/lib/site-url';
import { createMagicLinkToken } from '@/lib/photo-challenge/magic-link';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { id } = await params;
            const challengeId = Number(id);

            const challenge = await prisma.photoChallenge.findUnique({
                where: { id: challengeId },
                include: {
                    package: true
                }
            });

            if (!challenge) {
                return NextResponse.json({ success: false, error: 'Challenge not found' }, { status: 404 });
            }

            // Upewnij się że istnieje User dla zaproszonego — magic-link wymaga userId.
            // Dla starszych wyzwań (sprzed unifikacji) twórz konto przy okazji.
            let inviteeUser = challenge.invitee_user_id
                ? await prisma.user.findUnique({ where: { id: challenge.invitee_user_id } })
                : null;
            if (!inviteeUser) {
                const existing = await prisma.user.findUnique({ where: { email: challenge.invitee_contact } });
                if (existing) {
                    inviteeUser = existing;
                } else {
                    const bcrypt = (await import('bcryptjs')).default;
                    const crypto = await import('crypto');
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
                }
                if (!challenge.invitee_user_id) {
                    await prisma.photoChallenge.update({
                        where: { id: challenge.id },
                        data: { invitee_user_id: inviteeUser.id },
                    });
                }
            }

            // Magic-link: 1-klik logowanie do panelu, bez hasła.
            const baseUrl = getSiteUrl();
            const magicToken = await createMagicLinkToken({
                userId: inviteeUser.id,
                email: inviteeUser.email,
                challengeId: challenge.id,
                ttl: '30d',
            });
            const loginLink = `${baseUrl}/foto-wyzwanie/wejdz?token=${encodeURIComponent(magicToken)}`;

            await sendEmail({
                to: challenge.invitee_contact,
                subject: 'Twoje zdjęcia z Foto Wyzwania są gotowe! 📸',
                template: 'challenge-photos-ready',
                data: {
                    inviteeName: challenge.invitee_name,
                    inviterName: challenge.inviter_name,
                    packageName: challenge.package.name,
                    loginLink: loginLink
                }
            });

            // Log activity
            await prisma.challengeTimelineEvent.create({
                data: {
                    challenge_id: challengeId,
                    event_type: 'photos_ready_notification',
                    event_description: 'Wysłano powiadomienie o gotowych zdjęciach'
                }
            });

            return NextResponse.json({ success: true });

        } catch (error) {
            console.error('Notify ready error:', error);
            return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
        }
    });
}
