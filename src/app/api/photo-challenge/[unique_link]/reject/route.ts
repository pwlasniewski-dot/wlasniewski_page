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

        // Update status to rejected
        await prisma.photoChallenge.update({
            where: { unique_link },
            data: {
                status: 'rejected',
                rejected_at: new Date()
            }
        });

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
