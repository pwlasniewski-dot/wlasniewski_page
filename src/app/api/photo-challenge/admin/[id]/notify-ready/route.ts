import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/email/sender';

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

            // Send email to invitee
            const loginLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/foto-wyzwanie/login`;

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
