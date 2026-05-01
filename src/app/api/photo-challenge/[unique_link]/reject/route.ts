import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ unique_link: string }> }
) {
    try {
        const { unique_link } = await params;
        const challenge = await prisma.photoChallenge.findUnique({
            where: { unique_link },
            include: { package: true }
        });

        if (!challenge) {
            return NextResponse.json(
                { success: false, error: 'Challenge not found' },
                { status: 404 }
            );
        }

        // Idempotencja: jeśli już odrzucone / zaakceptowane, nie wykonujemy
        // ponownie update'u i NIE wysyłamy duplikatu emaila refundowego.
        // (Klient klikając kilka razy "Odrzuć" mógł wcześniej zalać admina
        // wieloma "WYMAGANY ZWROT".)
        if (challenge.status === 'rejected' || (challenge as any).rejected_at) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'ALREADY_REJECTED',
                    message: 'To zaproszenie zostało już wcześniej odrzucone.',
                    rejected_at: (challenge as any).rejected_at,
                },
                { status: 409 },
            );
        }
        if (challenge.status === 'accepted' || (challenge as any).accepted_at) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'ALREADY_ACCEPTED',
                    message: 'To zaproszenie zostało już zaakceptowane i nie można go cofnąć przez ten formularz.',
                },
                { status: 409 },
            );
        }

        // Update status to rejected — z guardem na warunki wyścigu (gdyby
        // dwa requesty trafiły równocześnie, drugi zaktualizuje 0 wierszy).
        const updated = await prisma.photoChallenge.updateMany({
            where: {
                unique_link,
                status: { notIn: ['rejected', 'accepted'] },
                rejected_at: null,
            },
            data: {
                status: 'rejected',
                rejected_at: new Date(),
            },
        });

        if (updated.count === 0) {
            // Inny request wygrał wyścig — nie wysyłamy emaili.
            return NextResponse.json(
                {
                    success: false,
                    error: 'ALREADY_REJECTED',
                    message: 'To zaproszenie zostało już wcześniej odrzucone.',
                },
                { status: 409 },
            );
        }

        // Cancel associated booking to free up the slot
        await prisma.booking.updateMany({
            where: {
                challenge_id: challenge.id,
                status: 'challenge_pending'
            },
            data: {
                status: 'cancelled',
                notes: `Wyzwanie odrzucone przez zaproszonego. Pierwotny zapraszający: ${challenge.inviter_name}`
            }
        });

        // Send notification to inviter & admin (for refund)
        try {
            const { sendEmail, getAdminEmail } = await import('@/lib/email/sender');
            const adminEmail = await getAdminEmail();
            const c = challenge as any;

            // Notify Inviter
            if (c.inviter_email) {
                await sendEmail({
                    to: c.inviter_email,
                    subject: `Wyzwanie odrzucone - ${c.inviter_name}`,
                    template: 'challenge-rejected',
                    data: {
                        inviterName: c.inviter_name,
                        inviteeName: c.invitee_name,
                        contactLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://wlasniewski.pl'}/kontakt`
                    }
                });
            }

            // Notify Admin about refund
            if (adminEmail) {
                await sendEmail({
                    to: adminEmail,
                    subject: `⚠️ WYMAGANY ZWROT: Wyzwanie odrzucone - ${c.inviter_name}`,
                    template: 'challenge-rejected-admin',
                    data: {
                        inviterName: c.inviter_name,
                        inviterEmail: c.inviter_email,
                        inviteeName: c.invitee_name,
                        amount: challenge.package.challenge_price,
                        paymentId: c.payment_id || 'Brak'
                    }
                });
            }
        } catch (emailError) {
            console.error('Failed to send rejection emails:', emailError);
        }

        return NextResponse.json({
            success: true
        });
    } catch (error) {
        console.error('Error rejecting challenge:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
