import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const amount = request.nextUrl.searchParams.get('amount');

        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
        }

        const challenge = await prisma.photoChallenge.findUnique({
            where: { id },
            include: { package: true }
        });

        if (!challenge) {
            return NextResponse.json({ success: false, error: 'Challenge not found' }, { status: 404 });
        }

        // Mock payment processing:
        // In a real scenario, this would redirect to P24/PayU and then a callback would update the status.
        // For now, we simulate success and update the challenge status.

        await prisma.$transaction([
            // Update challenge status
            prisma.photoChallenge.update({
                where: { id },
                data: {
                    status: 'sent',
                    payment_status: 'paid',
                    payment_id: `SIMULATED_${Date.now()}`,
                    payment_method: 'P24_SIMULATED'
                } as any
            }),
            // Update related booking status if it exists
            prisma.booking.updateMany({
                where: { challenge_id: id },
                data: { status: 'confirmed' }
            })
        ]);

        // Send invitation email AFTER successful payment
        try {
            const { sendEmail } = await import('@/lib/email/sender');
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const inviteLink = `${baseUrl}/foto-wyzwanie/invite/${challenge.unique_link}`;
            const loginLink = `${baseUrl}/foto-wyzwanie/login`;

            // 1. Send to Invitee
            await sendEmail({
                to: challenge.invitee_contact,
                subject: `🎉 ${challenge.inviter_name} zaprasza Cię do Foto Wyzwania!`,
                template: 'challenge-invitation',
                data: {
                    inviterName: challenge.inviter_name,
                    inviteeName: challenge.invitee_name,
                    packageName: challenge.package.name,
                    packagePrice: challenge.package.challenge_price,
                    packageDescription: challenge.package.description || '',
                    inviterPhone: challenge.inviter_contact,
                    inviteLink
                }
            });

            // 2. Send to Inviter (Confirmation)
            if (challenge.inviter_email) {
                await sendEmail({
                    to: challenge.inviter_email,
                    subject: `✅ Potwierdzenie płatności za Foto Wyzwanie`,
                    template: 'challenge-payment-confirmed-inviter',
                    data: {
                        inviterName: challenge.inviter_name,
                        inviteeName: challenge.invitee_name,
                        packageName: challenge.package.name,
                        inviteLink,
                        loginLink
                    }
                });
            }
        } catch (emailError) {
            console.error('Failed to send emails after payment:', emailError);
        }

        // Redirect to a success page
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        return NextResponse.redirect(`${baseUrl}/foto-wyzwanie/success?id=${challenge.unique_link}`);

    } catch (error) {
        console.error('Payment error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
